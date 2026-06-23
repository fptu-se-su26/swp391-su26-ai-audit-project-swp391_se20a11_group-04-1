const { execSync } = require('child_process');
const path = require('path');
const { startWsRelay } = require('./wsRelay');

async function startAgent({ token, backendUrl }) {
    console.log('✅ DevTrack Local Agent đang chạy...');
    console.log(`🔗 Backend: ${backendUrl}`);
    console.log('⏳ Đang chờ test jobs từ server...\n');

    try {
        console.log('📦 Cài đặt dependencies...');
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log('📦 Cài đặt Playwright browser...');
        const ext = process.platform === 'win32' ? '.cmd' : '';
        const playwrightCli = path.join(__dirname, 'node_modules', '.bin', `playwright${ext}`);
        execSync(`"${playwrightCli}" install chromium`, { stdio: 'inherit', cwd: __dirname });
        console.log('ℹ️ Playwright đã sẵn sàng.');
    } catch (e) {
        console.log('ℹ️ Playwright đã sẵn sàng.');
    }

    // ── Start embedded WebSocket relay ──────────────────────────────────────
    // Agent tự host WS relay để script Playwright có thể push CDP frames
    // mà không cần playwright-service chạy riêng trên máy local.
    // Nếu port 4001 bị chiếm (thường bởi Docker Playwright), Agent tự động
    // chuyển sang chế độ Central Relay (dùng chung Relay đang chạy trên Docker).
    let relayPort = 4001;
    let localRelayActive = false;
    try {
        const relay = await startWsRelay(4001);
        relayPort = relay.port;
        localRelayActive = true;
    } catch (e) {
        if (e.code === 'EADDRINUSE') {
            console.log('[WsRelay] ⚡ Phát hiện cổng 4001 đang bận (Docker Playwright hoặc dịch vụ khác).');
            console.log('[WsRelay] 🔄 Tự động chuyển sang chế độ Central Relay — Agent sẽ dùng Relay Server đang chạy.');
            console.log('[WsRelay] ℹ️  Live stream vẫn hoạt động bình thường thông qua Central Relay.\n');
        } else {
            console.warn('[WsRelay] Không thể start WS relay:', e.message);
            console.warn('[WsRelay] Live stream có thể không hoạt động, nhưng test vẫn chạy bình thường.');
        }
    }

    const localWsUrl = `ws://localhost:${relayPort}`;
    if (localRelayActive) {
        console.log(`🎥 Chế độ: Local Relay — Live stream relay: ${localWsUrl}\n`);
    } else {
        console.log(`🎥 Chế độ: Central Relay — Sử dụng Relay Server tại ${localWsUrl} (hoặc URL từ server)\n`);
    }
    // ────────────────────────────────────────────────────────────────────────

    const { executeScript, executeApiTest } = require('./executor');

    // isRunning guard ngăn chạy đồng thời 2 task
    let isRunning = false;

    setInterval(async () => {
        if (isRunning) return;

        try {
            const res = await fetch(`${backendUrl}/api/v1/agent-tasks/pending?token=${token}`);
            if (res.status === 204) return; // No pending tasks

            if (!res.ok) {
                console.error(`⚠️ Lỗi kết nối server: ${res.status} ${res.statusText}`);
                return;
            }

            const task = await res.json();
            if (!task || !task.taskId) return;

            isRunning = true;
            console.log(`\n▶ Nhận task ${task.taskId} — ${task.baseUrl}`);

            // Ưu tiên dùng wsUrl từ server (Central Relay / Cloud) nếu có,
            // fallback về localWsUrl (embedded relay) khi server không chỉ định.
            // Điều này cho phép Agent hoạt động linh hoạt trong mọi môi trường:
            //   - Local only (không Docker): dùng embedded relay
            //   - Local + Docker: dùng Docker Playwright làm Central Relay
            //   - Production/Cloud: dùng wsUrl từ server (vd: wss://domain.com/relay)
            const wsUrl = task.wsUrl || localWsUrl;
            const runId = task.runId || task.taskId;
            console.log(`🎥 Live stream: ${wsUrl}/?runId=${runId}&role=provider`);

            let result;
            let apiResultPayload = null;

            if (task.taskType === 'API_TEST_JOB') {
                console.log(`📡 Thực thi API Test Job trực tiếp...`);
                const apiResult = await executeApiTest(task.script);
                result = { status: apiResult.status, duration: apiResult.duration };
                apiResultPayload = apiResult.apiResult;
            } else {
                result = await executeScript(task.script, task.taskId, task.baseUrl, {
                    WS_URL: wsUrl
                });
            }

            // Log chi tiết cho FAIL và ERROR
            if (result.status !== 'PASS') {
                console.error(`🚨 Test ${result.status}:`, result.error?.message || apiResultPayload?.error || 'Unknown error');
                if (result.error?.stack) {
                    console.error('   Stack:', result.error.stack.split('\n')[0]);
                }
                if (result.error?.failedStep) {
                    console.error(`   Failed at step: "${result.error.failedStep}" (index: ${result.error.failedStepIndex})`);
                }
            }

            // Log tóm tắt từng step
            if (result.steps && result.steps.length > 0) {
                console.log('📋 Steps:');
                result.steps.forEach((s, i) => {
                    const icon = s.status === 'PASS' ? '  ✅' : '  ❌';
                    console.log(`${icon} Step ${i + 1}: ${s.title} (${s.duration}ms)`);
                    if (s.error) console.log(`     → ${s.error.substring(0, 200)}`);
                });
            }

            const payloadBody = {
                outcome: result.status === 'PASS' ? 'PASSED' : 'FAILED',
                notes: result.error?.message || null,
                durationMs: result.duration,
                failedStepIndex: result.error?.failedStepIndex !== undefined && result.error?.failedStepIndex !== null
                    ? result.error.failedStepIndex : null,
                steps: result.steps || [],
                evidenceUrls: result.screenshots || []
            };

            if (apiResultPayload) {
                Object.assign(payloadBody, apiResultPayload);
            }

            // Submit result to backend with retry logic
            const submitUrl = `${backendUrl}/api/v1/agent-tasks/${task.taskId}/result?token=${token}`;
            let submitted = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const submitRes = await fetch(submitUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payloadBody)
                    });
                    if (submitRes.ok) {
                        submitted = true;
                        break;
                    }
                    const errBody = await submitRes.text().catch(() => '');
                    console.error(`⚠️ Submit attempt ${attempt}/3 failed: HTTP ${submitRes.status} — ${errBody.substring(0, 300)}`);
                } catch (fetchErr) {
                    console.error(`⚠️ Submit attempt ${attempt}/3 network error: ${fetchErr.message}`);
                }
                if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
            }

            if (submitted) {
                console.log(`✓ Task ${task.taskId} hoàn thành với kết quả: ${result.status}`);
            } else {
                console.error(`❌ Task ${task.taskId} kết quả ${result.status} nhưng KHÔNG gửi được về server sau 3 lần thử!`);
            }
        } catch (err) {
            console.error('⚠️ Agent poll error:', err.message);
        } finally {
            isRunning = false;
        }
    }, 3000);
}

module.exports = { startAgent };
