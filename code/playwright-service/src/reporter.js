const fs = require('fs');
const path = require('path');

class LiveReporter {
  constructor(options) {
    this.statusFile = process.env.LIVE_STATUS_FILE;
    this.steps = [];
  }

  onStepBegin(test, result, step) {
    if (step.category === 'test.step') {
      this.steps.push({
        id: step.title,
        title: step.title,
        status: 'RUNNING',
        startTime: Date.now(),
        duration: null,
        error: null
      });
      this.writeStatus();
    }
  }

  onStepEnd(test, result, step) {
    if (step.category === 'test.step') {
      const s = this.steps.find(x => x.title === step.title && x.status === 'RUNNING');
      if (s) {
        s.status = step.error ? 'FAIL' : 'PASS';
        s.duration = Date.now() - s.startTime;
        s.error = step.error ? step.error.message : null;
        this.writeStatus();
      }
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
