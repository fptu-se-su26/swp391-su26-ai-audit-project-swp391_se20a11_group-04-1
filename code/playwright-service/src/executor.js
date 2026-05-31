const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function executeScript(script, runId, baseUrl) {
    const tempDir = path.join(process.cwd(), 'temp', runId);
    const scriptPath = path.join(tempDir, 'test.spec.js');
    const screenshotDir = path.join(tempDir, 'screenshots');

    fs.mkdirSync(screenshotDir, { recursive: true });

    // Thay path screenshot tương đối → tuyệt đối và chuẩn hóa backslash cho Windows
    const scriptWithAbsPath = script.replace(
        /path:\s*['"]([^'"]+\.png)['"]/g,
        (_, filename) => {
            const absPath = path.join(screenshotDir, filename).replace(/\\/g, '\\\\');
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
                env: { ...process.env, BASE_URL: baseUrl, LIVE_STATUS_FILE: liveStatusFile },
            }
        );
        result = parseOutput(stdout, screenshotDir);
    } catch (err) {
        // Playwright exit code != 0 khi test FAIL — stdout vẫn có JSON
        if (err.stdout) {
            result = parseOutput(err.stdout, screenshotDir);
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
        report = JSON.parse(stdout);
    } catch {
        console.error('[Executor] Playwright output parse error. Raw stdout:', stdout);
        return {
            status: 'ERROR',
            error: { message: 'Không parse được output từ Playwright', raw: stdout },
            steps: [],
            screenshots: [],
        };
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

    const passed = testResult.status === 'expected' || testResult.status === 'passed';

    const steps = (testResult.results?.[0]?.steps || [])
        .filter(s => s.category === 'test.step')
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

    const rawError = testResult.results?.[0]?.error;
    const error = passed
        ? null
        : {
            message: (rawError?.message || 'Test thất bại').replace(/\x1b\[[0-9;]*m/g, ''),
            stack: (rawError?.stack || '').replace(/\x1b\[[0-9;]*m/g, ''),
            failedStep: steps.find(s => s.status === 'FAIL')?.title || null,
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