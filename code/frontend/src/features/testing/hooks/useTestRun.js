import { useState, useRef } from 'react';
import api from '@/api/axiosConfig';

export function useTestRun(testCaseId) {
  const [state, setState] = useState({
    status: 'IDLE',  // IDLE | RUNNING | PASS | FAIL | ERROR
    runId: null,
    steps: [],
    screenshots: [],
    error: null,
    durationMs: null,
    bugReportId: null,
  });

  const pollingRef = useRef(null);

  const startRun = async () => {
    setState(s => ({ ...s, status: 'RUNNING', steps: [], screenshots: [], error: null }));

    try {
      // Gọi API bắt đầu run
      const { data } = await api.post(`/v1/test-cases/${testCaseId}/run`);
      const { runId } = data.data;

      setState(s => ({ ...s, runId }));

      // Bắt đầu polling
      pollingRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await api.get(`/v1/test-cases/runs/${runId}/status`);
          const result = statusData.data;

          setState(s => ({
            ...s,
            status: result.status,
            steps: result.steps || s.steps,
            screenshots: result.screenshots || s.screenshots,
            error: result.error,
            durationMs: result.durationMs,
            bugReportId: result.bugReportId,
          }));

          // Dừng polling khi xong
          if (result.status !== 'RUNNING') {
            clearInterval(pollingRef.current);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 1000); // Poll mỗi 1 giây

    } catch (err) {
      setState(s => ({
        ...s,
        status: 'ERROR',
        error: { message: err.response?.data?.message || 'Lỗi khi gọi API' },
      }));
    }
  };

  const reset = () => {
    clearInterval(pollingRef.current);
    setState({ status: 'IDLE', runId: null, steps: [], screenshots: [], error: null, durationMs: null, bugReportId: null });
  };

  return { ...state, startRun, reset };
}
