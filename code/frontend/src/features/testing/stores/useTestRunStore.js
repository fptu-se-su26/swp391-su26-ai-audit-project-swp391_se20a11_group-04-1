import { create } from 'zustand';

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'SYSTEM_ERROR', 'TIMED_OUT'];

export const useTestRunStore = create((set, get) => ({
    activeTestRun: null,
    executions: [],
    isRunning: false,
    progress: { completed: 0, total: 0, passed: 0, failed: 0, skipped: 0, aborted: 0 },

    initTestRun: (testRunResponse, testCaseIds) => set({
        activeTestRun: testRunResponse,
        executions: testCaseIds.map(id => ({
            testCaseId: Number(id),
            status: 'PENDING',
            notes: null, screenshotUrl: null, durationMs: null, testCaseName: null
        })),
        isRunning: true,
        progress: { completed: 0, total: testCaseIds.length, passed: 0, failed: 0, skipped: 0, aborted: 0 }
    }),

    onExecutionStarted: ({ testCaseId, testCaseName }) => set(state => ({
        executions: state.executions.map(ex =>
            ex.testCaseId === testCaseId ? { ...ex, status: 'RUNNING', testCaseName } : ex
        )
    })),

    onExecutionCompleted: (event) => set(state => {
        const isRunFinished = event.completedCount >= event.totalCount;
        return {
            executions: state.executions.map(ex =>
                ex.testCaseId === event.testCaseId
                    ? { ...ex, status: event.status, notes: event.notes,
                        screenshotUrl: event.screenshotUrl, durationMs: event.durationMs }
                    : ex
            ),
            isRunning: isRunFinished ? false : state.isRunning,
            progress: {
                completed: event.completedCount,
                total: event.totalCount,
                passed: event.passedCount,
                failed: event.failedCount,
                skipped: event.skippedCount ?? 0,
                aborted: event.abortedCount ?? 0
            }
        };
    }),

    onRunCompleted: (event) => set(state => ({
        activeTestRun: { ...state.activeTestRun, status: event.finalStatus },
        isRunning: false,
        // Nếu có aborted executions (cancel), update status trong list
        executions: state.executions.map(ex =>
            ['PENDING', 'RUNNING'].includes(ex.status)
                ? { ...ex, status: 'ABORTED' }
                : ex
        ),
        progress: {
            ...state.progress,
            passed: event.passedCount ?? state.progress.passed,
            failed: event.failedCount ?? state.progress.failed,
            skipped: event.skippedCount ?? state.progress.skipped,
            aborted: event.abortedCount ?? state.progress.aborted
        }
    })),

    // Dùng khi reconnect WebSocket
    loadFromApi: (apiResponse) => set({
        activeTestRun: { testRunId: apiResponse.testRunId, status: apiResponse.status },
        executions: apiResponse.executions.map(e => ({
            executionId: e.executionId,
            testCaseId: e.testCaseId,
            testCaseName: e.testCaseName,
            status: e.status,
            notes: e.notes,
            screenshotUrl: e.screenshotUrl,
            durationMs: e.durationMs
        })),
        isRunning: !TERMINAL_STATUSES.includes(apiResponse.status),
        progress: {
            completed: apiResponse.completedCount,
            total: apiResponse.totalTestCases,
            passed: apiResponse.passedCount,
            failed: apiResponse.failedCount,
            skipped: apiResponse.skippedCount ?? 0,
            aborted: apiResponse.abortedCount ?? 0
        }
    }),

    reset: () => set({
        activeTestRun: null, executions: [], isRunning: false,
        progress: { completed: 0, total: 0, passed: 0, failed: 0, skipped: 0, aborted: 0 }
    })
}));
