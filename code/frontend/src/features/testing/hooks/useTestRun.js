import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/api/axiosConfig';

/**
 * Hook to run a single test case and poll for results.
 * Integrates with the async test run backend:
 * - POST /v1/test-cases/{id}/run → returns { testRunId, status, correlationId }
 * - GET /v1/test-runs/{testRunId} → returns TestRunStatusResponse
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
          let uiStatus;
          if (TERMINAL_STATUSES.includes(result.status)) {
            if (result.status === 'COMPLETED') {
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

          // Dừng polling khi đã terminal
          if (TERMINAL_STATUSES.includes(result.status)) {
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
