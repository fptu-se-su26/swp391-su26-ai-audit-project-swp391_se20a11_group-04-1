const { execSync } = require('child_process');
const path = require('path');

async function startAgent({ token, backendUrl }) {
    console.log('✅ DevTrack Local Agent đang chạy...');
    console.log(`🔗 Backend: ${backendUrl}`);
    console.log('⏳ Đang chờ test jobs từ server...\n');

    try {
        console.log('📦 Cài đặt dependencies...');
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log('📦 Cài đặt Playwright browser...');
        // Dùng đường dẫn trực tiếp đến playwright trong node_modules thay vì npx
        const ext = process.platform === 'win32' ? '.cmd' : '';
        const playwrightCli = path.join(__dirname, 'node_modules', '.bin', `playwright${ext}`);
        execSync(`"${playwrightCli}" install chromium`, { stdio: 'inherit', cwd: __dirname });
        console.log('ℹ️ Playwright đã sẵn sàng.');
    } catch (e) { 
        console.log('ℹ️ Playwright đã sẵn sàng.');
    }

    const { executeScript } = require('./executor');

    // Issue 10 FIX: isRunning guard ngăn chạy đồng thời 2 task
    let isRunning = false;

    setInterval(async () => {
        if (isRunning) return; // Đang chạy task khác → bỏ qua tick này

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
            if (task.wsUrl && task.runId) {
                console.log(`🎥 Live stream: ${task.wsUrl}/?runId=${task.runId}&role=provider`);
            }

            const result = await executeScript(task.script, task.taskId, task.baseUrl, {
                WS_URL: task.wsUrl || 'ws://localhost:4001'
            });
            
            // Log chi tiết cho cả FAIL và ERROR
            if (result.status !== 'PASS') {
                console.error(`🚨 Test ${result.status}:`, result.error?.message || 'Unknown error');
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

            await fetch(`${backendUrl}/api/v1/agent-tasks/${task.taskId}/result?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outcome: result.status === 'PASS' ? 'PASSED' : 'FAILED',
                    notes: result.error?.message || null,
                    durationMs: result.duration,
                    failedStepIndex: result.error?.failedStepIndex !== undefined && result.error?.failedStepIndex !== null ? result.error.failedStepIndex : null,
                    steps: result.steps,
                    evidenceUrls: result.screenshots || []
                })
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
