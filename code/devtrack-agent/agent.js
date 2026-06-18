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
    // Nếu port 4001 bị chiếm (thường bởi Docker), relay tự tìm port trống.
    let relayPort = 4001;
    try {
        const relay = await startWsRelay(4001);
        relayPort = relay.port;
    } catch (e) {
        console.warn('[WsRelay] Không thể start WS relay:', e.message);
        console.warn('[WsRelay] Live stream sẽ không hoạt động, nhưng test vẫn chạy bình thường.');
    }

    const localWsUrl = `ws://localhost:${relayPort}`;
    console.log(`🎥 Live stream relay: ${localWsUrl}\n`);
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

            // Luôn dùng WS URL của embedded relay (chạy ngay trên máy user),
            // bỏ qua wsUrl từ server vì nó trỏ tới playwright-service cloud.
            const wsUrl = localWsUrl;
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

            await fetch(`${backendUrl}/api/v1/agent-tasks/${task.taskId}/result?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadBody)
            });

            console.log(`✓ Task ${task.taskId} hoàn thành với kết quả: ${result.status}`);
        } catch (err) {
            console.error('⚠️ Agent poll error:', err.message);
        } finally {
            isRunning = false;
        }
    }, 3000);
}

module.exports = { startAgent };
