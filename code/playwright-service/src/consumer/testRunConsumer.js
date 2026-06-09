// ensure global fetch is available (Node 18+)
require('dotenv').config();

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;
const BACKEND_URL = process.env.BACKEND_URL;

function createLogger(context) {
    return {
        info: (msg, obj = {}) => console.log(`[INFO] [${context.correlationId}] ${msg}`, obj),
        warn: (msg, obj = {}) => console.warn(`[WARN] [${context.correlationId}] ${msg}`, obj),
        error: (msg, obj = {}) => console.error(`[ERROR] [${context.correlationId}] ${msg}`, obj),
    };
}

async function handleTestRunJobCommand(message) {
    const { testRunId, correlationId } = message;
    const log = createLogger({ testRunId, correlationId });

    try {
        // 1. Set RUNNING
        await callInternal(`/internal/test-runs/${testRunId}/status`, 'PATCH',
            { status: 'RUNNING' });

        // 2. Fetch execution plan từ INTERNAL endpoint (có service key, không cần session)
        const plan = await callInternal(`/internal/test-runs/${testRunId}/executions`);

        // 3. Chạy từng execution
        for (const execution of plan.executions) {
            if (execution.status !== 'PENDING' && execution.status !== 'RUNNING') continue;

            // 3a. Signal bắt đầu — nếu nhận 409 → TestRun đã CANCELLED → dừng lại
            const startResponse = await callInternalRaw(
                `/internal/test-runs/${testRunId}/executions/start`,
                'POST', { testExecutionId: execution.executionId, testCaseId: execution.testCaseId }
            );
            if (startResponse.status === 409) {
                log.info('TestRun cancelled, stopping execution loop');
                return; // EXIT LOOP GRACEFULLY
            }
            if (!startResponse.ok) {
                throw new Error(`Start execution failed: ${startResponse.status}`);
            }

            const startTime = Date.now();
            let outcome = 'FAILED';
            let notes = null;
            let screenshotUrl = null;
            let durationMs = 0;
            let failedStepIndex = null;
            let evidenceUrls = [];

            try {
                const testCaseResponse = await callInternal(`/internal/test-runs/test-cases/${execution.testCaseId}`);
                
                let script;
                if (testCaseResponse.cached_playwright_script && testCaseResponse.script_source === 'AI_GENERATED') {
                    script = testCaseResponse.cached_playwright_script;
                } else if (testCaseResponse.steps_structured) {
                    const { generateFromTemplate } = require('../templateEngine');
                    // Format response to match expected testCase structure
                    const tc = {
                        title: testCaseResponse.title,
                        base_url: testCaseResponse.base_url,
                        steps_structured: typeof testCaseResponse.steps_structured === 'string' 
                            ? JSON.parse(testCaseResponse.steps_structured) 
                            : testCaseResponse.steps_structured
                    };
                    script = generateFromTemplate(tc, testRunId.toString());
                } else {
                    const { generateWithAI } = require('../aiGenerator');
                    script = await generateWithAI(testCaseResponse);
                }

                const { executeScript, cleanupTempDir } = require('../executor');
                const { uploadImages } = require('../services/cloudinaryService');
                
                const execResult = await executeScript(script, testRunId.toString(), testCaseResponse.base_url);
                
                outcome = execResult.status === 'PASS' ? 'PASSED' : 'FAILED';
                notes = execResult.error ? execResult.error.message : null;
                failedStepIndex = execResult.error ? execResult.error.failedStepIndex : null;
                durationMs = execResult.duration || (Date.now() - startTime);
                
                // Upload screenshots to Cloudinary
                if (execResult.screenshots && execResult.screenshots.length > 0) {
                    evidenceUrls = await uploadImages(execResult.screenshots);
                    if (evidenceUrls.length > 0) {
                        screenshotUrl = evidenceUrls[evidenceUrls.length - 1]; // Set the last screenshot as the main one
                    }
                }
                
                cleanupTempDir(execResult.tempDir);
            } catch (err) {
                outcome = 'FAILED';
                notes = `Execution exception: ${err.message}`;
                durationMs = Date.now() - startTime;
                log.error('Test case threw exception', { testCaseId: execution.testCaseId, err });
            }

            // 3b. Callback kết quả — với retry, kiểm tra 409
            const resultResponse = await callInternalWithRetry(
                `/internal/test-runs/${testRunId}/executions/${execution.executionId}/result`,
                'POST',
                {
                    testExecutionId: execution.executionId,
                    testCaseId: execution.testCaseId,
                    idempotencyKey: `${testRunId}-${execution.testCaseId}`,
                    outcome,
                    notes,
                    screenshotUrl,
                    durationMs,
                    failedStepIndex,
                    evidenceUrls
                }
            );

            // 409 = TestRun đã terminal (e.g., vừa bị cancel)
            if (resultResponse === 409) {
                log.info('TestRun became terminal during execution, stopping');
                return;
            }
        }

        // 4. Hoàn thành
        await callInternal(`/internal/test-runs/${testRunId}/status`, 'PATCH',
            { status: 'COMPLETED' });

        log.info('TestRun completed successfully');

    } catch (fatalError) {
        const errMsg = fatalError?.message || String(fatalError);
        log.error('Fatal error — marking SYSTEM_ERROR', { fatalError: errMsg });
        await callInternal(`/internal/test-runs/${testRunId}/status`, 'PATCH', {
            status: 'SYSTEM_ERROR',
            notes: errMsg
        }).catch(() => {}); // best-effort — watchdog sẽ handle nếu cả cái này cũng fail
    }
}

// Trả về status code thay vì throw — để caller kiểm tra 409
async function callInternalWithRetry(path, method, body, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await callInternalRaw(path, method, body);
        if (res.status === 409) return 409; // signal cancel
        if (res.ok) return res.status;
        if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} retries: ${path}`);
        await sleep(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s
    }
}

async function callInternal(path, method = 'GET', body = null) {
    const res = await callInternalRaw(path, method, body);
    if (!res.ok) throw new Error(`Backend ${res.status} for ${path}`);
    return method === 'GET' ? res.json() : null;
}

async function callInternalRaw(path, method = 'GET', body = null) {
    return fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Key': INTERNAL_SERVICE_KEY
        },
        body: body ? JSON.stringify(body) : null
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = { handleTestRunJobCommand };
