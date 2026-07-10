import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/api/axiosConfig';

/**
 * Hook to run a single test case and poll for results.
 * Integrates with the async test run backend:
 * - POST /v1/test-cases/{id}/run → returns { testRunId, status, correlationId }
 * - GET /v1/test-runs/{testRunId} → returns TestRunStatusResponse
 *
 * Also listens to WebSocket events dispatched by useNotificationStore
 * via window CustomEvents to update state immediately without waiting for poll.
 */

// Terminal statuses — stop polling when one of these is reached
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'SYSTEM_ERROR', 'TIMED_OUT'];

export function useTestRun(testCaseId) {
  const [state, setState] = useState({
    status: 'IDLE',  // IDLE | RUNNING | PASS | FAIL | ERROR
    runId: null,
    steps: [],
    screenshots: [],
    error: null,
    durationMs: null,
    bugReportId: null,
    isSaved: false,
  });

  const pollingRef = useRef(null);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const runIdRef = useRef(null);

  // Keep runIdRef in sync with state.runId
  useEffect(() => {
    runIdRef.current = state.runId;
  }, [state.runId]);

  const saveRun = useCallback(async () => {
    const currentRunId = runIdRef.current;
    if (!currentRunId) return;
    try {
      await api.post(`/v1/test-runs/${currentRunId}/save`);
      if (isMountedRef.current) setState(s => ({ ...s, isSaved: true }));
    } catch (err) {
      console.error('Failed to save run:', err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // ── WebSocket fast-path: listen to events dispatched by useNotificationStore ──
  // This lets us update state immediately when WS events arrive,
  // without waiting for the next polling interval (up to 2s delay).
  useEffect(() => {
    const handleExecutionCompleted = (e) => {
      const event = e.detail;
      if (!isMountedRef.current) return;
      // Only handle if this event belongs to our active run
      if (event.testRunId !== runIdRef.current) return;

      setState(s => {
        if (s.status !== 'RUNNING') return s;

        const notes = event.notes || null;
        const screenshotUrl = event.screenshotUrl || null;
        const evidenceUrls = event.evidenceUrls || [];
        const durationMs = event.durationMs || null;
        const failedStepIndex = event.failedStepIndex ?? null;

        const allScreenshots = [];
        if (evidenceUrls.length > 0) {
          evidenceUrls.forEach(url => allScreenshots.push({ url, filename: url.split('/').pop() }));
        } else if (screenshotUrl) {
          allScreenshots.push({ url: screenshotUrl, filename: 'Screenshot' });
        }

        const isFailed = event.status === 'FAILED';
        const errorObj = isFailed
          ? { message: notes || 'Test failed', failedStepIndex }
          : null;

        return {
          ...s,
          screenshots: allScreenshots.length > 0 ? allScreenshots : s.screenshots,
          error: errorObj || s.error,
          durationMs: durationMs || s.durationMs,
        };
      });
    };

    const handleRunCompleted = (e) => {
      const event = e.detail;
      if (!isMountedRef.current) return;
      if (event.testRunId !== runIdRef.current) return;

      // Stop polling — WS already told us the run is done, next poll will confirm
      // We don't finalize status here; let the next poll cycle do it cleanly
      // so we get full executions data from the API.
      // But we can shorten the wait: trigger an immediate poll.
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Trigger one final poll immediately to get correct final state
      const currentRunId = runIdRef.current;
      if (!currentRunId || !isMountedRef.current) return;

      api.get(`/v1/test-runs/${currentRunId}`).then(({ data: statusData }) => {
        if (!isMountedRef.current) return;
        const result = statusData.data;

        const mappedSteps = (result.executions || []).map((exec, idx) => ({
          title: exec.testCaseName || `Step ${idx + 1}`,
          status: exec.status === 'PASSED' ? 'PASS'
            : exec.status === 'FAILED' ? 'FAIL'
              : exec.status === 'RUNNING' ? 'RUNNING'
                : null,
          duration: exec.durationMs,
          error: exec.notes,
          order: exec.orderIndex,
          failedStepIndex: exec.failedStepIndex,
          evidenceUrls: exec.evidenceUrls || [],
        }));

        const hasFailedExec = (result.executions || []).some(e => e.status === 'FAILED');
        let uiStatus;
        if (result.status === 'COMPLETED') {
          uiStatus = hasFailedExec ? 'FAIL' : 'PASS';
        } else if (result.status === 'SYSTEM_ERROR' || result.status === 'TIMED_OUT') {
          uiStatus = 'ERROR';
        } else if (result.status === 'CANCELLED') {
          uiStatus = 'CANCELLED';
        } else {
          uiStatus = 'FAIL';
        }

        const totalDuration = (result.executions || []).reduce((acc, exec) => acc + (exec.durationMs || 0), 0);

        const allScreenshots = [];
        (result.executions || []).forEach(e => {
          if (e.evidenceUrls && e.evidenceUrls.length > 0) {
            e.evidenceUrls.forEach(url => allScreenshots.push({ url, filename: url.split('/').pop() }));
          } else if (e.screenshotUrl) {
            allScreenshots.push({ url: e.screenshotUrl, filename: 'Screenshot' });
          }
        });

        const failedExec = (result.executions || []).find(e => e.status === 'FAILED');
        let errorObj = null;
        if (result.status === 'SYSTEM_ERROR') {
          errorObj = { message: result.errorMessage || 'System error occurred during test execution' };
        } else if (failedExec) {
          errorObj = { message: failedExec.notes || 'Test failed', failedStepIndex: failedExec.failedStepIndex };
        }

        isStartingRef.current = false;
        setState(s => ({
          ...s,
          status: uiStatus,
          steps: mappedSteps.length > 0 ? mappedSteps : s.steps,
          screenshots: allScreenshots.length > 0 ? allScreenshots : s.screenshots,
          error: errorObj,
          durationMs: totalDuration > 0 ? totalDuration : s.durationMs,
          bugReportId: result.bugReportId || null,
          isSaved: result.isSaved || false,
        }));
      }).catch(err => {
        console.error('[useTestRun] Final poll after WS event failed:', err);
        isStartingRef.current = false;
      });
    };

    window.addEventListener('test-run-execution-completed', handleExecutionCompleted);
    window.addEventListener('test-run-completed', handleRunCompleted);
    return () => {
      window.removeEventListener('test-run-execution-completed', handleExecutionCompleted);
      window.removeEventListener('test-run-completed', handleRunCompleted);
    };
  }, []);

  const startRun = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Guard against double clicks / parallel starts
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    // Ensure no orphaned interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setState(s => ({ ...s, status: 'RUNNING', steps: [], screenshots: [], error: null }));

    try {
      // Gọi API bắt đầu run
      const { data } = await api.post(`/v1/test-cases/${testCaseId}/run`);

      // Guard: component có thể đã unmount trong khi await
      if (!isMountedRef.current) return;

      const testRunId = data.data.testRunId; // Backend returns testRunId, not runId

      // Đồng bộ runIdRef ngay lập tức tránh độ trễ 1 tick của useEffect
      setState(s => {
        runIdRef.current = testRunId;
        return { ...s, runId: testRunId };
      });

      let errorCount = 0;

      // Bắt đầu polling
      pollingRef.current = setInterval(async () => {
        // Guard: nếu đã unmount, dọn interval và thoát
        if (!isMountedRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          return;
        }

        try {
          const { data: statusData } = await api.get(`/v1/test-runs/${testRunId}`);

          // Guard sau mỗi await
          if (!isMountedRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            return;
          }

          errorCount = 0;
          const result = statusData.data;

          const mappedSteps = (result.executions || []).map((exec, idx) => ({
            title: exec.testCaseName || `Step ${idx + 1}`,
            status: exec.status === 'PASSED' ? 'PASS'
              : exec.status === 'FAILED' ? 'FAIL'
                : exec.status === 'RUNNING' ? 'RUNNING'
                  : null,
            duration: exec.durationMs,
            error: exec.notes,
            order: exec.orderIndex,
            failedStepIndex: exec.failedStepIndex,
            evidenceUrls: exec.evidenceUrls || [],
          }));

          // Determine overall UI status
          const hasFailedExec = (result.executions || []).some(e => e.status === 'FAILED');
          const hasStillRunning = (result.executions || []).some(e => e.status === 'RUNNING' || e.status === 'PENDING');
          let uiStatus;
          if (TERMINAL_STATUSES.includes(result.status)) {
            // Guard: nếu backend báo COMPLETED nhưng executions vẫn còn RUNNING/PENDING
            // → DB chưa commit kịp, tiếp tục poll thêm 1 lần nữa
            if (result.status === 'COMPLETED' && hasStillRunning) {
              uiStatus = 'RUNNING';
            } else if (result.status === 'COMPLETED') {
              uiStatus = hasFailedExec ? 'FAIL' : 'PASS';
            } else if (result.status === 'SYSTEM_ERROR' || result.status === 'TIMED_OUT') {
              uiStatus = 'ERROR';
            } else if (result.status === 'CANCELLED') {
              uiStatus = 'CANCELLED';
            } else {
              uiStatus = 'FAIL';
            }
          } else {
            uiStatus = 'RUNNING';
          }

          const totalDuration = (result.executions || []).reduce((acc, exec) => acc + (exec.durationMs || 0), 0);

          // Extract all evidence urls and screenshots
          const allScreenshots = [];
          (result.executions || []).forEach(e => {
            if (e.evidenceUrls && e.evidenceUrls.length > 0) {
              e.evidenceUrls.forEach(url => allScreenshots.push({ url, filename: url.split('/').pop() }));
            } else if (e.screenshotUrl) {
              allScreenshots.push({ url: e.screenshotUrl, filename: 'Screenshot' });
            }
          });

          const failedExec = (result.executions || []).find(e => e.status === 'FAILED');
          let errorObj = null;
          if (result.status === 'SYSTEM_ERROR') {
            errorObj = { message: result.errorMessage || 'System error occurred during test execution' };
          } else if (failedExec) {
            errorObj = { message: failedExec.notes || 'Test failed', failedStepIndex: failedExec.failedStepIndex };
          }

          setState(s => ({
            ...s,
            status: uiStatus,
            steps: mappedSteps.length > 0 ? mappedSteps : s.steps,
            screenshots: allScreenshots.length > 0 ? allScreenshots : s.screenshots,
            error: errorObj,
            durationMs: totalDuration > 0 ? totalDuration : null,
            bugReportId: result.bugReportId || null,
            isSaved: result.isSaved || false,
          }));

          // Dừng polling khi đã terminal VÀ tất cả executions đã có kết quả
          const isReallyDone = TERMINAL_STATUSES.includes(result.status) && !hasStillRunning;
          if (isReallyDone) {
            isStartingRef.current = false;
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } catch (e) {
          console.error('Polling error:', e);
          errorCount++;
          if (errorCount >= 5) {
            isStartingRef.current = false;
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            if (isMountedRef.current) {
              setState(s => ({
                ...s,
                status: 'ERROR',
                error: { message: 'Mất kết nối với máy chủ (quá số lần thử lại).' }
              }));
            }
          }
        }
      }, 2000); // Poll mỗi 2 giây (giảm load)

    } catch (err) {
      isStartingRef.current = false;
      if (isMountedRef.current) {
        setState(s => ({
          ...s,
          status: 'ERROR',
          error: { message: err.response?.data?.message || 'Lỗi khi gọi API' },
        }));
      }
    }
  }, [testCaseId]);

  const reset = useCallback(() => {
    isStartingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setState({ status: 'IDLE', runId: null, steps: [], screenshots: [], error: null, durationMs: null, bugReportId: null, isSaved: false });
  }, []);

  return { ...state, startRun, reset, saveRun };
}
