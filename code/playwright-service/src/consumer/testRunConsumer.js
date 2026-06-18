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
    const { testRunId, correlationId, projectId } = message;
    const log = createLogger({ testRunId, correlationId });

    try {
        // Jitter delay (0-3000ms) to stagger workers that might have received the message concurrently
        await sleep(Math.floor(Math.random() * 3000));

        // Dedup guard: Check if TestRun has already been processed
        const res = await callInternalRaw(`/internal/test-runs/${testRunId}/executions`, 'GET');
        if (res.ok) {
            const plan = await res.json();
            const isAlreadyProcessed = plan.executions.every(e => e.status !== 'PENDING');
            if (isAlreadyProcessed) {
                log.info(`TestRun ${testRunId} already processed, skipping duplicate`);
                return; // Skip silently
            }
        }

        // 1. Set RUNNING
        const patchRes = await callInternalRaw(`/internal/test-runs/${testRunId}/status`, 'PATCH', { status: 'RUNNING' });
        if (patchRes.status === 409) {
            log.info(`TestRun ${testRunId} already started by another worker, skipping`);
            return; // Graceful exit
        }
        if (!patchRes.ok) {
            throw new Error(`PATCH RUNNING failed: ${patchRes.status}`);
        }

        // 2. Fetch execution plan
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
                
                // Dùng executionId làm runId để tránh conflict temp dir khi nhiều workers chạy cùng testRunId
                const execRunId = `${testRunId}-${execution.executionId}`;
                
                let execResult;
                if (isLocalUrl(testCaseResponse.base_url)) {
                    if (!projectId) throw new Error("projectId is missing in Kafka message for local execution");
                    execResult = await delegateToLocalAgent(testRunId, execution.executionId, projectId, script, testCaseResponse.base_url);
                } else {
                    execResult = await executeScript(script, execRunId, testCaseResponse.base_url);
                }
                
                outcome = execResult.status === 'PASS' ? 'PASSED' : 'FAILED';
                notes = execResult.error ? execResult.error.message : null;
                failedStepIndex = execResult.error ? execResult.error.failedStepIndex : null;
                durationMs = execResult.duration || (Date.now() - startTime);
                
                // Upload screenshots to Cloudinary
                if (execResult.screenshots && execResult.screenshots.length > 0) {
                    try {
                        evidenceUrls = await uploadImages(execResult.screenshots, execRunId);
                        if (evidenceUrls.length > 0) {
                            screenshotUrl = evidenceUrls[evidenceUrls.length - 1]; // Set the last screenshot as the main one
                        }
                    } catch (uploadErr) {
                        log.warn('Cloudinary upload failed, but test will complete normally', uploadErr);
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
                    idempotencyKey: `${testRunId}-${execution.executionId}`,
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
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }
    return null;
}

async function callInternalRaw(path, method = 'GET', body = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        return await fetch(`${BACKEND_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Service-Key': INTERNAL_SERVICE_KEY
            },
            body: body ? JSON.stringify(body) : null,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function isLocalUrl(url) {
    if (!url) return false;
    return url.includes('localhost') 
        || url.includes('127.0.0.1') 
        || url.includes('0.0.0.0');
}

async function delegateToLocalAgent(testRunId, executionId, projectId, script, baseUrl) {
    const POLL_INTERVAL = 3000;
    const TIMEOUT_MS = 5 * 60 * 1000;
    const startTime = Date.now();

    const taskRes = await callInternal('/internal/agent-tasks', 'POST', {
        testRunId, executionId, projectId, script, baseUrl
    });
    const agentTaskId = taskRes.agentTaskId;

    while (Date.now() - startTime < TIMEOUT_MS) {
        await sleep(POLL_INTERVAL);
        const statusRes = await callInternal(`/internal/agent-tasks/${agentTaskId}/status`);
        
        if (statusRes.status === 'COMPLETED') {
            const r = statusRes.result || {};
            return {
                status: r.outcome === 'PASSED' ? 'PASS' : 'FAIL',
                steps: r.steps || [],
                screenshots: [],
                error: r.notes ? { message: r.notes, failedStepIndex: r.failedStepIndex } : null,
                duration: r.durationMs || (Date.now() - startTime)
            };
        }
        if (statusRes.status === 'FAILED' || statusRes.status === 'TIMEOUT') {
            return {
                status: 'ERROR',
                steps: [],
                screenshots: [],
                error: { message: statusRes.result?.notes || 'Agent task failed or timed out' },
                duration: Date.now() - startTime
            };
        }
    }

    return {
        status: 'ERROR',
        steps: [],
        screenshots: [],
        error: { message: 'Local Agent không phản hồi trong 5 phút. Hãy đảm bảo Agent đang chạy.' },
        duration: TIMEOUT_MS
    };
}

module.exports = { handleTestRunJobCommand };
