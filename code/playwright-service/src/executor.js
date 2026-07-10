const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function executeScript(script, baseRunId, baseUrl) {
    const uniqueRunId = `${baseRunId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tempDir = path.join(process.cwd(), 'temp', uniqueRunId);
    const scriptPath = path.join(tempDir, 'test.spec.js');
    const screenshotDir = path.join(tempDir, 'screenshots');

    fs.mkdirSync(screenshotDir, { recursive: true });

    // Thay path screenshot tương đối → tuyệt đối và chuẩn hóa backslash cho Windows
    const scriptWithAbsPath = script.replace(
        /path:\s*['"]([^'"]+\.png)['"]/g,
        (_, filename) => {
            // Chuẩn hóa path thành gạch chéo xuôi để js trong script sinh ra không bị lỗi escape (\t, \n...)
            const absPath = path.join(screenshotDir, filename).replace(/\\/g, '/');
            return `path: '${absPath}'`;
        }
    );

    fs.writeFileSync(scriptPath, scriptWithAbsPath, 'utf8');

    const startTime = Date.now();
    let result;

    try {
        // Chuyển dấu gạch chéo ngược thành gạch chéo xuôi để Playwright không hiểu lầm thành regex escape character (\t, \s, v.v.)
        const safeScriptPath = scriptPath.replace(/\\/g, '/');

        const liveStatusFile = path.join(tempDir, 'live_status.json');
        
        const { stdout } = await execAsync(
            `npx playwright test "${safeScriptPath}" --reporter=json,./src/reporter.js --timeout=120000 --workers=1`,
            {
                cwd: process.cwd(),
                timeout: 180000,
                encoding: 'utf8',
                maxBuffer: 50 * 1024 * 1024, // 50MB — Playwright JSON with screenshots can be large
                env: { ...process.env, BASE_URL: baseUrl, LIVE_STATUS_FILE: liveStatusFile },
            }
        );
        result = parseOutput(stdout, screenshotDir);
    } catch (err) {
        // Playwright exit code != 0 khi test FAIL — stdout vẫn có JSON
        if (err.stdout) {
            // err.stdout may be a Buffer if encoding wasn't set — convert explicitly
            const stdoutStr = Buffer.isBuffer(err.stdout) ? err.stdout.toString('utf8') : err.stdout;
            result = parseOutput(stdoutStr, screenshotDir);
        } else {
            console.error('[Executor] Playwright execution error:', err.message);
            result = {
                status: 'ERROR',
                error: { message: err.message, type: 'EXECUTION_ERROR' },
                steps: [],
                screenshots: [],
            };
        }
    }

    result.duration = Date.now() - startTime;
    result.tempDir = tempDir;
    return result;
}

function parseOutput(stdout, screenshotDir) {
    let report;
    try {
        // Strategy 1: try parsing the entire stdout directly (fastest, works when stdout is clean)
        report = JSON.parse(stdout);
    } catch {
        // Strategy 2: Playwright JSON always ends with a "stats" object as the last top-level key.
        // Find the last occurrence of `"stats"` and walk forward to the closing `}` of its value,
        // then that `}` is followed immediately by the closing `}` of the root object.
        // This avoids brace-depth counting which breaks on code snippets inside "snippet" fields.
        try {
            const statsMatch = stdout.lastIndexOf('"stats"');
            if (statsMatch === -1) throw new Error('No stats field found');
            // Find the closing brace of the stats value, then the root closing brace
            // The stats block is a simple flat object — find its closing } then the next }
            let depth = 0;
            let statsValueStart = -1;
            for (let i = statsMatch; i < stdout.length; i++) {
                if (stdout[i] === '{') {
                    if (depth === 0) statsValueStart = i;
                    depth++;
                } else if (stdout[i] === '}') {
                    depth--;
                    if (depth === 0) {
                        // Found closing } of stats value. Next non-whitespace should be } of root.
                        let rootEnd = i + 1;
                        while (rootEnd < stdout.length && /\s/.test(stdout[rootEnd])) rootEnd++;
                        if (stdout[rootEnd] === '}') {
                            const jsonStr = stdout.substring(stdout.indexOf('{'), rootEnd + 1);
                            report = JSON.parse(jsonStr);
                        }
                        break;
                    }
                }
            }
            if (!report) throw new Error('Could not find root object boundary');
        } catch (innerErr) {
            console.error('[Executor] Playwright output parse error:', innerErr.message);
            console.error('[Executor] Raw stdout (first 300 chars):', stdout.substring(0, 300));
            return {
                status: 'ERROR',
                error: { message: 'Không parse được output từ Playwright', raw: stdout.substring(0, 500) },
                steps: [],
                screenshots: [],
            };
        }
    }

    // Tìm mảng specs trong suites[0] hoặc suites[0].suites[0] (tùy thuộc vào version playwright và cấu trúc file)
    const firstSuite = report.suites?.[0];
    const specs = firstSuite?.specs || firstSuite?.suites?.[0]?.specs || [];
    const testResult = specs?.[0]?.tests?.[0];

    if (!testResult) {
        console.error('[Executor] Playwright ran but found no test results! Full report:', JSON.stringify(report, null, 2));
        return {
            status: 'ERROR',
            error: { message: 'Không tìm thấy kết quả test', details: report.errors || [] },
            steps: [],
            screenshots: [],
        };
    }

    const runResult = testResult.results?.[0];
    const actualStatus = runResult?.status;
    // Use the actual run status ('passed'/'failed'/'timedOut') as source of truth.
    // Do NOT use testResult.status === 'expected' — that field reflects whether the outcome
    // matched Playwright's annotation expectation, not whether the test actually passed.
    // 'flaky' means it passed on a retry and should still be treated as passed.
    const passed = actualStatus === 'passed' || testResult.status === 'flaky';

    const steps = (runResult?.steps || [])
        .filter(s => s.category === 'test.step' && s.title !== 'Before Hooks' && s.title !== 'After Hooks')
        .map(s => ({
            title: s.title,
            duration: s.duration,
            status: s.error ? 'FAIL' : 'PASS',
            error: s.error?.message ? s.error.message.replace(/\x1b\[[0-9;]*m/g, '') : null,
        }));

    const screenshots = fs.existsSync(screenshotDir)
        ? fs.readdirSync(screenshotDir)
            .filter(f => f.endsWith('.png'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/step-(\d+)/)?.[1] || 0);
                const numB = parseInt(b.match(/step-(\d+)/)?.[1] || 0);
                return numA - numB;
            })
            .map(f => path.join(screenshotDir, f))
        : [];

    const rawError = runResult?.error;
    let failedStepIndex = steps.findIndex(s => s.status === 'FAIL');

    // Fallback 1: Playwright đôi khi không mark step là error trong mảng steps
    // (ví dụ: expect_url fail — lỗi chỉ xuất hiện ở runResult.error).
    // Dùng số screenshots để suy ra step cuối đã thực sự chạy.
    // Mỗi step có auto-screenshot nên screenshot count = số step đã hoàn thành.
    // Step tiếp theo (chưa có screenshot) là step bị lỗi.
    if (failedStepIndex < 0 && !passed) {
        const screenshotCount = fs.existsSync(screenshotDir)
            ? fs.readdirSync(screenshotDir).filter(f => /step-\d+-after\.png$/.test(f)).length
            : 0;
        // screenshotCount = số step đã chạy xong (kể cả step bị lỗi có thể chưa chụp được)
        // Nếu có N screenshots thì step N+1 (index N) là bị lỗi, trừ khi đây là step cuối
        if (screenshotCount > 0) {
            failedStepIndex = screenshotCount; // step tiếp theo sau screenshot cuối
        }
    }

    // Fallback 2: Nếu vẫn không xác định được, dùng số step đã PASS trong mảng steps
    if (failedStepIndex < 0 && !passed && steps.length > 0) {
        const passedCount = steps.filter(s => s.status === 'PASS').length;
        failedStepIndex = passedCount;
    }

    const error = passed
        ? null
        : {
            message: (rawError?.message || 'Test thất bại').replace(/\x1b\[[0-9;]*m/g, ''),
            stack: (rawError?.stack || '').replace(/\x1b\[[0-9;]*m/g, ''),
            failedStep: steps.find(s => s.status === 'FAIL')?.title || null,
            failedStepIndex: failedStepIndex >= 0 ? failedStepIndex : null
        };

    return { status: passed ? 'PASS' : 'FAIL', steps, screenshots, error };
}

function cleanupTempDir(tempDir) {
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
        console.error('[Executor] Cleanup failed:', e.message);
    }
}

module.exports = { executeScript, cleanupTempDir };