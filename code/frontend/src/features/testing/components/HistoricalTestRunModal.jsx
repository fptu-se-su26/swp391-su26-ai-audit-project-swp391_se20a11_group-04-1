import React, { useMemo } from 'react';
import { X, Loader } from 'lucide-react';
import { useHistoricalTestRun } from '../hooks/useHistoricalTestRun';
import TestExecutionViewer from './TestExecutionViewer';

export default function HistoricalTestRunModal({ projectId, runId, testCase, onClose }) {
  const { 
    status, 
    steps, 
    screenshots, 
    error, 
    durationMs, 
    bugReportId, 
    isSaved, 
    loading 
  } = useHistoricalTestRun(runId);

  // For Historical mode, focusedStepIndex can be managed locally in TestExecutionViewer,
  // but TestExecutionViewer expects it as a prop. So we manage it here.
  const [focusedStepIndex, setFocusedStepIndex] = React.useState(null);

  // We need to pass the same structured steps as stepsArr that LiveTestRunner uses
  const stepsArr = useMemo(() => {
    let arr = [];
    const cfgSteps = testCase?.configuration?.steps;
    if (cfgSteps) {
      if (typeof cfgSteps === 'string') {
        try { arr = JSON.parse(cfgSteps); } catch (e) {}
      } else if (Array.isArray(cfgSteps)) {
        arr = cfgSteps;
      }
    }
    return [...arr].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [testCase?.configuration?.steps]);

  // Default browser url for historical view
  const browserBarUrl = (() => {
    let maxIndex = stepsArr.length - 1;
    if (focusedStepIndex !== null) {
      maxIndex = focusedStepIndex;
    }
    const cfgBaseUrl = testCase?.configuration?.baseUrl;

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

  // BUG 1 & 2: Merge hook steps with testCase steps to preserve historical accuracy 
  // but fallback to current testCase step details (action, selector) for UI richness
  const displaySteps = useMemo(() => {
    if (steps && steps.length > 0) {
      return steps.map((s, i) => ({
        ...stepsArr[i], // Fallback to current step details (action, selector) if matched by index
        ...s,           // Overwrite with historical details (title, status, duration)
        description: s.title || stepsArr[i]?.description
      }));
    }
    return stepsArr;
  }, [steps, stepsArr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] h-full max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Chi tiết Lịch sử Test Run</h2>
            <p className="text-xs text-gray-500 mt-0.5">Run ID: {runId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <Loader size={32} className="animate-spin text-[#1E707D]" />
              <p className="font-medium">Đang tải dữ liệu lịch sử...</p>
            </div>
          ) : error && status === 'ERROR' && !steps.length ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3">
              <div className="bg-red-100 p-4 rounded-full">
                <X size={32} className="text-red-600" />
              </div>
              <p className="font-medium">{error.message || 'Không thể tải lịch sử chạy'}</p>
            </div>
          ) : (
            <TestExecutionViewer
              projectId={projectId}
              testCase={testCase}
              stepsArr={displaySteps}
              screenshots={screenshots}
              error={error}
              status={status}
              durationMs={durationMs}
              bugReportId={bugReportId}
              isSaved={isSaved}
              focusedStepIndex={focusedStepIndex}
              onFocusStep={setFocusedStepIndex}
              currentStepIndex={null}
              lastRunningStepIndex={null}
              liveFrame={null}
              browserBarUrl={browserBarUrl}
              isReadOnly={true}
              onStartRun={() => {}}
              onReset={() => {}}
              onSaveRun={() => {}}
              isRunning={false}
              runId={runId}
              agentToken={null}
              isLocalUrl={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
