import React, { useState, useEffect } from 'react';
import { useTestRunStore } from '../stores/useTestRunStore';
import { createTestRun, cancelTestRun, getTestRunStatus } from '../services/testRunService';

const STATUS_COLOR = {
    PENDING: 'var(--color-text-tertiary)',
    RUNNING: '#378ADD',
    PASSED:  '#1D9E75',
    FAILED:  '#E24B4A',
    SKIPPED: '#BA7517',
    ABORTED: 'var(--color-text-tertiary)'
};

const STATUS_LABEL = {
    PENDING: 'Chờ', RUNNING: 'Đang chạy...', PASSED: 'Pass',
    FAILED: 'Fail', SKIPPED: 'Bỏ qua', ABORTED: 'Huỷ'
};

export function TestRunPanel({ projectId, testCaseIds }) {
    const {
        activeTestRun, executions, isRunning, progress,
        initTestRun, loadFromApi, reset
    } = useTestRunStore();
    const [loading, setLoading] = useState(false);

    // Reconnect: sync lại state từ API nếu có run đang RUNNING
    useEffect(() => {
        if (activeTestRun?.testRunId && isRunning) {
            getTestRunStatus(activeTestRun.testRunId)
                .then(loadFromApi)
                .catch(err => console.error('Failed to sync test run status:', err));
        }
    }, []); // chỉ chạy khi component mount lần đầu

    useEffect(() => {
        let ws;
        if (activeTestRun?.testRunId && isRunning) {
            ws = new WebSocket(`${import.meta.env.VITE_WS_URL || "ws://localhost:4001"}/?runId=${activeTestRun.testRunId}&role=client`);
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    const store = useTestRunStore.getState();
                    if (msg.type === 'TEST_CASE_STARTED') {
                        store.onExecutionStarted(msg);
                    } else if (msg.type === 'TEST_CASE_COMPLETED') {
                        store.onExecutionCompleted(msg);
                    } else if (msg.type === 'TEST_RUN_COMPLETED') {
                        store.onRunCompleted(msg);
                    }
                } catch (e) {}
            };
            ws.onerror = () => console.error('[TestRunPanel] WS error');
        }
        return () => {
            if (ws) ws.close();
        };
    }, [activeTestRun?.testRunId, isRunning]);

    const handleRunTest = async () => {
        setLoading(true);
        try {
            const response = await createTestRun(projectId, testCaseIds);
            initTestRun(response, testCaseIds);
        } catch (err) {
            console.error('Failed to start test run:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!activeTestRun) return;
        try {
            await cancelTestRun(activeTestRun.testRunId);
            // UI sẽ update qua WebSocket TEST_RUN_COMPLETED { finalStatus: "CANCELLED" }
        } catch (err) {
            console.error('Failed to cancel:', err);
        }
    };

    const progressPercent = progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100) : 0;
    const hasFailures = progress.failed > 0;
    const isFinalStatus = !isRunning && activeTestRun;

    return (
        <div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={handleRunTest} disabled={isRunning || loading}>
                    {loading ? 'Đang khởi tạo...' : isRunning ? 'Đang chạy...' : 'Run Test'}
                </button>
                {isRunning && (
                    <button onClick={handleCancel} style={{ color: '#E24B4A' }}>
                        Huỷ
                    </button>
                )}
                {isFinalStatus && (
                    <button onClick={reset}>Chạy lại</button>
                )}
            </div>

            {/* Progress */}
            {activeTestRun && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>
                            {progress.completed}/{progress.total} test case
                            {isFinalStatus && ` · ${activeTestRun.status}`}
                        </span>
                        <span>
                            {progress.passed > 0 && <span style={{ color: '#1D9E75' }}>{progress.passed} pass </span>}
                            {progress.failed > 0 && <span style={{ color: '#E24B4A' }}>{progress.failed} fail </span>}
                            {progress.skipped > 0 && <span style={{ color: '#BA7517' }}>{progress.skipped} skip </span>}
                            {progress.aborted > 0 && <span style={{ color: 'var(--color-text-tertiary)' }}>{progress.aborted} aborted</span>}
                        </span>
                    </div>
                    <div style={{ background: 'var(--color-border-tertiary)', borderRadius: 4, height: 5 }}>
                        <div style={{
                            width: `${progressPercent}%`,
                            background: hasFailures ? '#E24B4A' : '#1D9E75',
                            height: '100%', borderRadius: 4,
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Execution list */}
            {executions.length > 0 && (
                <div>
                    {executions.map(ex => (
                        <div key={ex.testCaseId} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 0',
                            borderBottom: '1px solid var(--color-border-tertiary)'
                        }}>
                            <span style={{
                                color: STATUS_COLOR[ex.status] || 'var(--color-text-secondary)',
                                fontSize: 11, fontWeight: 500, minWidth: 80
                            }}>
                                {STATUS_LABEL[ex.status] || ex.status}
                            </span>
                            <span style={{ fontSize: 13, flex: 1 }}>
                                {ex.testCaseName || `Test Case #${ex.testCaseId}`}
                            </span>
                            {ex.durationMs != null && (
                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                    {ex.durationMs}ms
                                </span>
                            )}
                            {ex.screenshotUrl && (
                                <a href={ex.screenshotUrl} target="_blank" rel="noreferrer"
                                   style={{ fontSize: 11, color: '#378ADD' }}>
                                    Screenshot
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
