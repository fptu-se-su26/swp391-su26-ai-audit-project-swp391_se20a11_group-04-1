const fs = require('fs');
const path = require('path');

// Lazy-load ws to avoid issues if not installed in all environments
let WebSocket;
try { WebSocket = require('ws'); } catch (_) {}

class LiveReporter {
  constructor(options) {
    this.statusFile = process.env.LIVE_STATUS_FILE;
    this.runId = process.env.PLAYWRIGHT_RUN_ID;
    this.wsUrl = process.env.WS_URL; // e.g. ws://playwright-server:4001
    this.steps = [];
    this.ws = null;
    this.wsReady = false;
    this.messageQueue = [];

    // Connect as provider if we have a runId and wsUrl
    if (WebSocket && this.runId && this.wsUrl) {
      this._connectWs();
    }
  }

  _connectWs() {
    try {
      // Normalize: remove trailing slash then append path
      const base = (this.wsUrl || '').replace(/\/$/, '');
      const url = `${base}/?runId=${this.runId}&role=provider`;
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.wsReady = true;
        // Flush queued messages
        for (const msg of this.messageQueue) {
          this._wsSend(msg);
        }
        this.messageQueue = [];
      });

      this.ws.on('error', (err) => {
        // Non-fatal — reporter continues writing file-based status
        console.error('[LiveReporter] WS error:', err.message);
      });

      this.ws.on('close', () => {
        this.wsReady = false;
      });
    } catch (e) {
      console.error('[LiveReporter] Failed to create WS connection:', e.message);
    }
  }

  _wsSend(payload) {
    if (!this.ws) return;
    const msg = JSON.stringify(payload);
    if (this.wsReady && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(msg); } catch (_) {}
    } else {
      // Queue until open (only keep last 50 to avoid memory bloat)
      this.messageQueue.push(payload);
      if (this.messageQueue.length > 50) this.messageQueue.shift();
    }
  }

  onStepBegin(test, result, step) {
    if (step.category === 'test.step') {
      const stepIndex = this.steps.length;
      this.steps.push({
        id: step.title,
        title: step.title,
        status: 'RUNNING',
        startTime: Date.now(),
        duration: null,
        error: null
      });
      this.writeStatus();

      // Stream step_started event to frontend via WS
      this._wsSend({
        type: 'step_started',
        stepIndex,
        title: step.title,
      });
    }
  }

  onStepEnd(test, result, step) {
    if (step.category === 'test.step') {
      const stepIndex = this.steps.findLastIndex(x => x.title === step.title && x.status === 'RUNNING');
      const s = stepIndex >= 0 ? this.steps[stepIndex] : null;
      if (s) {
        s.status = step.error ? 'FAIL' : 'PASS';
        s.duration = Date.now() - s.startTime;
        s.error = step.error ? step.error.message : null;
        this.writeStatus();

        // Stream step_completed event
        this._wsSend({
          type: 'step_completed',
          stepIndex,
          title: step.title,
          status: s.status,
          duration: s.duration,
          error: s.error,
        });

        // If a screenshot was taken for this step, stream it
        const screenshotDir = this.statusFile
          ? path.join(path.dirname(this.statusFile), 'screenshots')
          : null;
        if (screenshotDir && fs.existsSync(screenshotDir)) {
          const files = fs.readdirSync(screenshotDir)
            .filter(f => f.endsWith('.png'))
            .sort();
          // Find the latest screenshot that was just written (last file)
          const latestFile = files[files.length - 1];
          if (latestFile) {
            const filePath = path.join(screenshotDir, latestFile);
            try {
              const base64 = fs.readFileSync(filePath).toString('base64');
              this._wsSend({
                type: 'step_screenshot',
                stepIndex,
                filename: latestFile,
                data: base64,
              });
            } catch (_) {}
          }
        }
      }
    }
  }

  onEnd(result) {
    // Stream test_completed so frontend knows it's done
    this._wsSend({
      type: 'test_completed',
      status: result.status,
    });

    // Close WS after a short delay to ensure last messages are flushed
    if (this.ws) {
      setTimeout(() => {
        try { this.ws.close(); } catch (_) {}
      }, 1000);
    }
  }

  writeStatus() {
    if (this.statusFile) {
      try {
        fs.writeFileSync(this.statusFile, JSON.stringify({ steps: this.steps }, null, 2));
      } catch (e) {
        // Ignore write errors during test run
      }
    }
  }
}

module.exports = LiveReporter;
