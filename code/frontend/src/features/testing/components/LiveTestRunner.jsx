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

  const fetchTestCaseDetail = useTestCaseStore(s => s.fetchTestCaseDetail);
  const fetchRequirementsTree = useTestCaseStore(s => s.fetchRequirementsTree);

  const [agentToken, setAgentToken] = useState(null);
  const isLocalUrl = testCase?.baseUrl?.includes('localhost') || testCase?.baseUrl?.includes('127.0.0.1') || testCase?.baseUrl?.includes('0.0.0.0');

  const stepsArr = useMemo(() => {
    let arr = [];
    if (typeof testCase.stepsStructured === 'string') {
      try { arr = JSON.parse(testCase.stepsStructured); } catch (e) {}
    } else if (Array.isArray(testCase.stepsStructured)) {
      arr = testCase.stepsStructured;
    }
    return [...arr].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [testCase.stepsStructured]);

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
          }
        } catch (e) {}
      };
      ws.onerror = () => console.error('[LiveTestRunner] WS error');
      ws.onclose = () => {
        console.log('[LiveTestRunner] WS closed');
      };
    }
    return () => {
      if (ws) ws.close();
      setCurrentStepIndex(null);
    };
  }, [status, runId]);

  useEffect(() => {
    if (status === 'IDLE' || status === 'RUNNING') {
      if (status === 'RUNNING' && currentStepIndex === null) {
        setLastRunningStepIndex(null);
      }
    }
  }, [status, currentStepIndex]);

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
        const path = step.path || step.expectedUrl || step.url || '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
          return path;
        }
        return (testCase.baseUrl || '') + path;
      }
    }
    return testCase.baseUrl || 'about:blank';
  })();

  return (
    <TestExecutionViewer
      projectId={projectId}
      testCase={testCase}
      stepsArr={stepsArr}
      screenshots={screenshots}
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
