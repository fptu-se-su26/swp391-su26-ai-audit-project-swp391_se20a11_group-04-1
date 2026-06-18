import { useState, useEffect } from 'react';
import api from '@/api/axiosConfig';

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'SYSTEM_ERROR', 'TIMED_OUT'];

export function useHistoricalTestRun(runId) {
  const [state, setState] = useState({
    status: 'IDLE',
    runId: null,
    steps: [],
    screenshots: [],
    error: null,
    durationMs: null,
    bugReportId: null,
    isSaved: false,
    loading: true,
  });

  useEffect(() => {
    if (!runId) return;

    let isMounted = true;
    setState(s => ({ ...s, loading: true, error: null }));

    api.get(`/v1/test-runs/${runId}`)
      .then(({ data: statusData }) => {
        if (!isMounted) return;
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
          uiStatus = result.status; // Might be RUNNING or PENDING
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

        setState({
          status: uiStatus,
          runId: runId,
          steps: mappedSteps,
          screenshots: allScreenshots,
          error: errorObj,
          durationMs: totalDuration > 0 ? totalDuration : null,
          bugReportId: result.bugReportId || null,
          isSaved: result.isSaved || false,
          loading: false,
        });
      })
      .catch(err => {
        if (!isMounted) return;
        setState({
          status: 'ERROR',
          runId: runId,
          steps: [],
          screenshots: [],
          error: { message: err.response?.data?.message || 'Lỗi khi lấy dữ liệu lịch sử' },
          durationMs: null,
          bugReportId: null,
          isSaved: false,
          loading: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [runId]);

  return state;
}
