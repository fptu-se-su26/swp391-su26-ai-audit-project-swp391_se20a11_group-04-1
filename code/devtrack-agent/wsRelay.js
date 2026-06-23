/**
 * wsRelay.js — Embedded WebSocket relay server for devtrack-agent
 *
 * Chạy một mini WS server ngay trong process của agent.
 * Script Playwright kết nối vào đây với role=provider để push CDP frames.
 * Frontend của DevTrack kết nối vào đây với role=client để nhận frames.
 *
 * Điều này cho phép live streaming hoạt động mà không cần playwright-service
 * chạy riêng trên máy local của user.
 */

const { WebSocketServer } = require('ws');
const http = require('http');

/**
 * Khởi động embedded WS relay server.
 * @param {number} port - Port muốn lắng nghe (default 4001)
 * @returns {Promise<{ server: http.Server, wss: WebSocketServer, port: number, close: Function }>}
 */
function startWsRelay(port = 4001) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            // Minimal HTTP handler — chỉ để health check
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, role: 'devtrack-agent-relay' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('DevTrack Agent WS Relay');
        });

        const wss = new WebSocketServer({ server });

        // Ngăn unhandled error crash khi server chưa listen được
        wss.on('error', () => {});

        // runId → Set<WebSocket>  (clients consuming frames)
        const clients = new Map();
        // runId → WebSocket        (provider pushing frames)
        const providers = new Map();
        // runId → string           (latest frame, for late-connecting clients)
        const frameBuffer = new Map();

        wss.on('connection', (ws, req) => {
            try {
                const url = new URL(req.url, `http://localhost:${port}`);
                const runId = url.searchParams.get('runId');
                const role = url.searchParams.get('role'); // 'client' | 'provider'

                if (!runId) { ws.close(); return; }

                if (role === 'provider') {
                    providers.set(runId, ws);

                    ws.on('message', (message) => {
                        const msgStr = message.toString();

                        // Buffer latest frame so late-joining clients get immediate image
                        if (msgStr.includes('"type":"frame"')) {
                            frameBuffer.set(runId, msgStr);
                        }

                        // Relay to all clients watching this runId
                        const clientSet = clients.get(runId);
                        if (clientSet) {
                            for (const clientWs of clientSet) {
                                if (clientWs.readyState === 1 /* OPEN */) {
                                    try { clientWs.send(msgStr); } catch (_) {}
                                }
                            }
                        }
                    });

                    ws.on('close', () => {
                        providers.delete(runId);
                        frameBuffer.delete(runId);
                    });

                    ws.on('error', () => { providers.delete(runId); });

                } else if (role === 'client') {
                    if (!clients.has(runId)) clients.set(runId, new Set());
                    clients.get(runId).add(ws);

                    // Send buffered frame immediately so client doesn't see blank screen
                    const buffered = frameBuffer.get(runId);
                    if (buffered && ws.readyState === 1) {
                        try { ws.send(buffered); } catch (_) {}
                    }

                    ws.on('close', () => {
                        const s = clients.get(runId);
                        if (s) {
                            s.delete(ws);
                            if (s.size === 0) clients.delete(runId);
                        }
                    });

                    ws.on('error', () => {
                        const s = clients.get(runId);
                        if (s) s.delete(ws);
                    });

                } else {
                    ws.close();
                }
            } catch (e) {
                console.error('[WsRelay] Connection handler error:', e.message);
                try { ws.close(); } catch (_) {}
            }
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[WsRelay] 🚨 Port ${port} đã bị chiếm. Hãy tắt ứng dụng khác đang dùng port này (hoặc cấu hình WS_PORT) để Live Screencast hoạt động.`);
                // Fallback bị bỏ để tránh lỗi lệch port giữa Agent và Frontend
                reject(err);
            } else {
                reject(err);
            }
        });

        server.listen(port, () => {
            console.log(`[WsRelay] ✅ Embedded WS relay đang chạy tại ws://localhost:${port}`);
            resolve({
                server,
                wss,
                port,
                close: () => {
                    wss.close();
                    server.close();
                }
            });
        });
    });
}

module.exports = { startWsRelay };
