require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { generateFromTemplate } = require('./src/templateEngine');
const { generateWithAI } = require('./src/aiGenerator');
const { executeScript, cleanupTempDir } = require('./src/executor');

const app = express();
app.use(express.json({ limit: '5mb' }));

// Store kết quả tạm trong memory (đủ cho MVP)
const runResults = new Map();

// Queue đơn giản tránh quá tải
let runningCount = 0;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_RUNS) || 3;

/**
 * POST /run
 * Body: { testCase: { title, base_url, steps_structured, expected_result,
 *                     cached_playwright_script, script_source } }
 * Response 202: { runId }
 */
app.post('/run', async (req, res) => {
    if (runningCount >= MAX_CONCURRENT) {
        return res.status(429).json({ error: 'Server đang bận, thử lại sau vài giây' });
    }

    const { testCase } = req.body;
    console.log("Received testCase payload:", JSON.stringify(testCase, null, 2));
    if (!testCase) return res.status(400).json({ error: 'Thiếu testCase trong body' });

    const runId = `run_${Date.now()}_${uuidv4().slice(0, 8)}`;
    runResults.set(runId, { status: 'RUNNING', startedAt: new Date() });
    runningCount++;

    // Chạy async — trả về runId ngay
    res.status(202).json({ runId });

    // Pipeline thực sự
    (async () => {
        try {
            // Chọn chiến lược sinh script
            let script;
            let scriptSource;

            if (testCase.cached_playwright_script && testCase.script_source === 'AI_GENERATED') {
                script = testCase.cached_playwright_script;
                scriptSource = 'CACHED';
                console.log(`[${runId}] Dùng cached script (AI_GENERATED)`);
            } else if (testCase.steps_structured?.length > 0) {
                try {
                    script = generateFromTemplate(testCase, runId);
                    scriptSource = 'TEMPLATE';
                    console.log(`[${runId}] Template Engine`);
                } catch {
                    script = await generateWithAI(testCase);
                    scriptSource = 'AI_GENERATED';
                    console.log(`[${runId}] AI Generator`);
                }
            } else {
                throw new Error('Không có steps_structured và không có cached script');
            }

            // Thực thi
            const execResult = await executeScript(script, runId, testCase.base_url);

            // Đọc screenshots thành base64 để gửi về Spring Boot
            const screenshotData = execResult.screenshots.map(filePath => ({
                filename: filePath.split('/').pop(),
                base64: fs.readFileSync(filePath).toString('base64'),
                mimeType: 'image/png',
            }));

            // Fallback: Nếu không đọc được steps từ báo cáo chuẩn, lấy từ live_status.json trước khi xoá temp
            if (!execResult.steps || execResult.steps.length === 0) {
                const liveStatusPath = path.join(execResult.tempDir, 'live_status.json');
                if (fs.existsSync(liveStatusPath)) {
                    try {
                        execResult.steps = JSON.parse(fs.readFileSync(liveStatusPath)).steps;
                    } catch(e){}
                }
            }

            runResults.set(runId, {
                status: execResult.status,
                scriptSource,
                script,                   // Gửi script về để Spring Boot cache vào DB
                steps: execResult.steps,
                screenshots: screenshotData,
                error: execResult.error,
                duration: execResult.duration,
                finishedAt: new Date(),
            });

            cleanupTempDir(execResult.tempDir);
            console.log(`[${runId}] Done: ${execResult.status} | ${execResult.duration}ms`);
        } catch (err) {
            runResults.set(runId, {
                status: 'ERROR',
                error: { message: err.message },
                steps: [],
                screenshots: [],
                finishedAt: new Date(),
            });
            console.error(`[${runId}] Error:`, err.message);
        } finally {
            runningCount--;
        }
    })();
});

/**
 * GET /status/:runId
 * Response: { status, result? }
 */
app.get('/status/:runId', (req, res) => {
    const runId = req.params.runId;
    const data = runResults.get(runId);
    if (!data) return res.status(404).json({ error: 'Run không tồn tại' });
    
    // Deep copy to avoid mutating the cached map
    const responseData = JSON.parse(JSON.stringify(data));

    if (responseData.status === 'RUNNING') {
        const tempDir = path.join(process.cwd(), 'temp', runId);
        const liveStatusPath = path.join(tempDir, 'live_status.json');
        
        if (fs.existsSync(liveStatusPath)) {
            try {
                const liveData = JSON.parse(fs.readFileSync(liveStatusPath));
                responseData.steps = liveData.steps;
                
                const screenshotDir = path.join(tempDir, 'screenshots');
                if (fs.existsSync(screenshotDir)) {
                    responseData.screenshots = fs.readdirSync(screenshotDir)
                        .filter(f => f.endsWith('.png'))
                        .sort()
                        .map(f => ({
                            filename: f,
                            base64: fs.readFileSync(path.join(screenshotDir, f)).toString('base64'),
                            mimeType: 'image/png'
                        }));
                }
            } catch (e) {
                // Ignore temporary read errors
            }
        }
    }

    res.json(responseData);

    // Xóa khỏi memory sau khi Spring Boot đã đọc kết quả cuối
    if (responseData.status !== 'RUNNING') {
        setTimeout(() => runResults.delete(runId), 30000);
    }
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Playwright Service running on :${PORT}`));

// ==========================================
// WebSocket Bridge (Live CDP Screencast)
// ==========================================
const wss = new WebSocketServer({ server });

const clients = new Map(); // runId -> Set(WebSocket)
const providers = new Map(); // runId -> WebSocket
const frameBuffer = new Map(); // runId -> latest frame message (for late-connecting clients)

wss.on('connection', (ws, req) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const runId = url.searchParams.get('runId');
        const role = url.searchParams.get('role'); // 'client' or 'provider'

        if (!runId) {
            ws.close();
            return;
        }

        if (role === 'client') {
            if (!clients.has(runId)) clients.set(runId, new Set());
            clients.get(runId).add(ws);

            // Immediately send the latest buffered frame so the client doesn't see a blank screen
            const bufferedFrame = frameBuffer.get(runId);
            if (bufferedFrame && ws.readyState === 1) {
                ws.send(bufferedFrame);
            }

            ws.on('close', () => {
                const s = clients.get(runId);
                if (s) {
                    s.delete(ws);
                    if (s.size === 0) clients.delete(runId);
                }
            });
        } else if (role === 'provider') {
            providers.set(runId, ws);
            ws.on('message', (message) => {
                // Buffer the latest frame so late-connecting clients can catch up
                frameBuffer.set(runId, message);

                const clientSet = clients.get(runId);
                if (clientSet) {
                    for (const clientWs of clientSet) {
                        if (clientWs.readyState === 1) clientWs.send(message);
                    }
                }
            });
            ws.on('close', () => {
                providers.delete(runId);
                // Clean up frame buffer after provider disconnects
                setTimeout(() => frameBuffer.delete(runId), 10000);
            });
        } else {
            ws.close();
        }
    } catch (e) {
        console.error('WS Error:', e);
        ws.close();
    }
});