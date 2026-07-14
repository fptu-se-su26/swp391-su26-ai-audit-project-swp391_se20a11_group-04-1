import { useTestRun } from '../hooks/useTestRun';
import { useEffect, useState, useMemo } from 'react';
import { testCaseService } from '../services/testCaseService';
import TestExecutionViewer from './TestExecutionViewer';
import { useParams } from 'react-router-dom';
import { useTestCaseStore } from '../stores/useTestCaseStore';

export default function LiveTestRunner({ testCase }) {
  const { projectId } = useParams();
  const { status, runId, steps, screenshots, error, durationMs, bugReportId, isSaved, startRun, reset, saveRun } = useTestRun(testCase.id);
  const [liveFrame, setLiveFrame] = useState(null);
  const [focusedStepIndex, setFocusedStepIndex] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(null);
  const [lastRunningStepIndex, setLastRunningStepIndex] = useState(null);
  const [liveScreenshots, setScreenshots] = useState([]);

  const fetchTestCaseDetail = useTestCaseStore(s => s.fetchTestCaseDetail);
  const fetchRequirementsTree = useTestCaseStore(s => s.fetchRequirementsTree);

  const [agentToken, setAgentToken] = useState(null);
  const cfgBaseUrl = testCase?.configuration?.baseUrl;
  const isLocalUrl = cfgBaseUrl?.includes('localhost') || cfgBaseUrl?.includes('127.0.0.1') || cfgBaseUrl?.includes('0.0.0.0');

  const stepsArr = useMemo(() => {
    let arr = [];
    const cfgSteps = testCase.configuration?.steps;
    if (typeof cfgSteps === 'string') {
      try { arr = JSON.parse(cfgSteps); } catch (e) { }
    } else if (Array.isArray(cfgSteps)) {
      arr = cfgSteps;
    }
    return [...arr].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [testCase.configuration?.steps]);

  useEffect(() => {
    if (focusedStepIndex !== null && focusedStepIndex >= stepsArr.length) {
      setFocusedStepIndex(null);
    }
  }, [stepsArr, focusedStepIndex]);

  useEffect(() => {
    if (isLocalUrl && testCase?.projectId && !agentToken) {
      testCaseService.getAgentToken(testCase.projectId)
        .then(token => setAgentToken(token))
        .catch(err => console.error("Failed to fetch agent token:", err));
    }
  }, [isLocalUrl, testCase, agentToken]);

  // Reset focused step khi bắt đầu run mới hoặc idle
  useEffect(() => {
    if (status === 'IDLE' || status === 'RUNNING') {
      setFocusedStepIndex(null);
    }
    if (status === 'RUNNING') {
      setLiveFrame(null);
      // Reset cả lastRunningStepIndex khi bắt đầu run mới
      setLastRunningStepIndex(null);
      setScreenshots([]);
    }
  }, [status]);

  useEffect(() => {
    let ws;
    if (status === 'RUNNING' && runId) {
      ws = new WebSocket(`${import.meta.env.VITE_WS_URL || "ws://localhost:4001"}/?runId=${runId}&role=client`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'frame') {
            setLiveFrame(msg.data);
          } else if (msg.type === 'step_started') {
            setCurrentStepIndex(msg.stepIndex);
            setLastRunningStepIndex(msg.stepIndex);
          } else if (msg.type === 'step_screenshot') {
            // Lưu screenshot của từng step để hiển thị sau khi test xong
            const ssUrl = `data:image/png;base64,${msg.data}`;
            setScreenshots(prev => {
              // Tránh duplicate
              const filtered = (prev || []).filter(s => s.filename !== msg.filename);
              return [...filtered, { filename: msg.filename, url: ssUrl }]
                .sort((a, b) => a.filename.localeCompare(b.filename));
            });
          }
        } catch (e) { }
      };
      ws.onerror = () => console.error('[LiveTestRunner] WS error');
      ws.onclose = () => {
        console.log('[LiveTestRunner] WS closed');
      };
    }
    return () => {
      if (ws) ws.close();
      // Chỉ reset currentStepIndex (dùng cho highlight đang chạy),
      // KHÔNG reset lastRunningStepIndex — dùng để hiển thị step cuối đã chạy khi FAIL
      setCurrentStepIndex(null);
    };
  }, [status, runId]);

  useEffect(() => {
    // Chỉ reset lastRunningStepIndex khi bắt đầu run mới (status chuyển từ non-RUNNING sang RUNNING)
    // KHÔNG reset khi currentStepIndex = null do WS cleanup — điều đó xảy ra sau khi test kết thúc
    if (status === 'RUNNING') {
      // lastRunningStepIndex sẽ được cập nhật bởi WS step_started events
      // Không cần reset ở đây
    }
  }, [status]);

  const handleReset = () => {
    setFocusedStepIndex(null);
    reset();
  };

  const handleSaveRun = async () => {
    await saveRun();
    if (testCase?.projectId) {
      await fetchTestCaseDetail(testCase.projectId, testCase.id);
      await fetchRequirementsTree(testCase.projectId);
    }
  };

  const isRunning = status === 'RUNNING';

  const browserBarUrl = (() => {
    let maxIndex = stepsArr.length - 1;
    if (status === 'RUNNING' && currentStepIndex !== null) {
      maxIndex = currentStepIndex;
    }
    if (focusedStepIndex !== null) {
      maxIndex = focusedStepIndex;
    }

    for (let i = Math.min(maxIndex, stepsArr.length - 1); i >= 0; i--) {
      const step = stepsArr[i];
      if (step && (step.action === 'goto' || step.action === 'expect_url')) {
        const path = step.path || step.expected || step.expectedUrl || step.url || '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
          return path;
        }
        return (cfgBaseUrl || '').replace(/\/$/, '') + '/' + path.replace(/^\//, '');
      }
    }
    return cfgBaseUrl || 'about:blank';
  })();

  return (
    <TestExecutionViewer
      projectId={projectId}
      testCase={testCase}
      stepsArr={stepsArr}
      screenshots={liveScreenshots.length > 0 ? liveScreenshots : screenshots}
      error={error}
      status={status}
      durationMs={durationMs}
      bugReportId={bugReportId}
      isSaved={isSaved}
      focusedStepIndex={focusedStepIndex}
      onFocusStep={setFocusedStepIndex}
      currentStepIndex={currentStepIndex}
      lastRunningStepIndex={lastRunningStepIndex}
      liveFrame={liveFrame}
      browserBarUrl={browserBarUrl}
      isReadOnly={false}
      onStartRun={startRun}
      onReset={handleReset}
      onSaveRun={handleSaveRun}
      isRunning={isRunning}
      runId={runId}
      agentToken={agentToken}
      isLocalUrl={isLocalUrl}
    />
  );
}
