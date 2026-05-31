import React, { useState, useEffect, useRef } from 'react';
import { testCaseService } from '../services/testCaseService';

const StatusBadge = ({ status }) => {
  const styles = {
    PASS: 'bg-green-100 text-green-800 border-green-200',
    FAIL: 'bg-red-100 text-red-800 border-red-200',
    RUNNING: 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse',
    ERROR: 'bg-gray-100 text-gray-800 border-gray-200',
    IDLE: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const labels = {
    PASS: 'Pass',
    FAIL: 'Fail',
    RUNNING: 'Running...',
    ERROR: 'Error',
    IDLE: 'Ready'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.IDLE}`}>
      {labels[status] || 'Unknown'}
    </span>
  );
};

const TypeBadge = ({ action }) => {
  const colors = {
    goto: 'bg-purple-100 text-purple-800',
    fill: 'bg-yellow-100 text-yellow-800',
    click: 'bg-indigo-100 text-indigo-800',
    expect_url: 'bg-teal-100 text-teal-800'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
      {action}
    </span>
  );
};

const StepRow = ({ step, stepResult, isRunning }) => {
  // Format target display
  let target = '';
  if (step.action === 'goto') target = step.path;
  else if (step.action === 'fill') target = `${step.selector} = "${step.value}"`;
  else if (step.action === 'click') target = step.selector;
  else if (step.action === 'expect_url') target = step.expected;

  const getStatusIcon = () => {
    if (!stepResult) {
      if (isRunning) return <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"></span>;
      return <span className="text-gray-300">—</span>;
    }
    if (stepResult.status === 'PASS') return <span className="text-green-500 font-bold">✓</span>;
    if (stepResult.status === 'FAIL') return <span className="text-red-500 font-bold">✗</span>;
    return <span className="text-gray-300">—</span>;
  };

  return (
    <div className="flex flex-col py-3 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 w-6">{step.order}.</span>
          <TypeBadge action={step.action} />
          {target && <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{target}</code>}
          <span className="text-sm text-gray-500 truncate max-w-sm" title={step.description}>{step.description}</span>
        </div>
        <div className="flex items-center gap-4">
          {stepResult && stepResult.durationMs != null && (
            <span className="text-xs text-gray-500 whitespace-nowrap">{stepResult.durationMs}ms</span>
          )}
          <div className="w-6 flex justify-center">{getStatusIcon()}</div>
        </div>
      </div>
      {stepResult && stepResult.error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2.5 rounded border border-red-100 ml-9 overflow-x-auto">
          {stepResult.error}
        </div>
      )}
    </div>
  );
};

const RunResultBanner = ({ runData }) => {
  if (!runData) return null;
  
  if (runData.status === 'ERROR') {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-sm font-medium text-red-800">Test Execution Failed</h3>
        <p className="mt-1 text-sm text-red-600">{runData.error || 'An unexpected error occurred before steps could be executed.'}</p>
      </div>
    );
  }

  if (runData.status === 'FAIL') {
    return (
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-medium text-orange-800">Test Failed</h3>
          <p className="mt-1 text-sm text-orange-600">One or more steps failed during execution.</p>
        </div>
        {runData.bugReportId && (
          <a href={`/bugs/${runData.bugReportId}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm whitespace-nowrap flex-shrink-0 transition-colors">
            Bug created #{runData.bugReportId} — view report
          </a>
        )}
      </div>
    );
  }
  
  if (runData.status === 'PASS') {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-sm font-medium text-green-800">Test Passed Successfully</h3>
      </div>
    );
  }

  return null;
};

const RunTestCase = ({ testCase }) => {
  const [runStatus, setRunStatus] = useState('IDLE'); // IDLE, RUNNING, PASS, FAIL, ERROR
  const [runId, setRunId] = useState(null);
  const [runData, setRunData] = useState(null);
  const pollIntervalRef = useRef(null);

  const startPolling = (id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await testCaseService.getTestRunStatus(id);
        setRunData(data);
        
        if (['PASS', 'FAIL', 'ERROR'].includes(data.status)) {
          setRunStatus(data.status);
          clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error("Error polling test status:", err);
        // On network error during polling, we don't crash, just keep trying
        // Or if it's a hard error, we might set status to ERROR
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleRun = async () => {
    if (!testCase || !testCase.id) return;
    
    try {
      setRunStatus('RUNNING');
      setRunData({ status: 'RUNNING', steps: [] });
      
      const data = await testCaseService.triggerTestRun(testCase.id);
      setRunId(data.runId);
      startPolling(data.runId);
    } catch (err) {
      setRunStatus('ERROR');
      setRunData({ status: 'ERROR', error: err.response?.data?.message || err.message, steps: [] });
    }
  };

  const isRunning = runStatus === 'RUNNING';

  if (!testCase) {
    return <div className="text-gray-500 italic p-4">No test case data provided</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Case Info Panel */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{testCase.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">{testCase.type}</span>
              <span className="flex items-center gap-1.5">
                Base URL: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">{testCase.baseUrl}</code>
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Steps</h3>
          
          {runStatus === 'ERROR' && (!runData?.steps || runData.steps.length === 0) ? (
             <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
               <p className="text-gray-500">Steps were not executed due to an error.</p>
             </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              {testCase.stepsStructured?.map((step) => {
                const stepResult = runData?.steps?.find(s => s.order === step.order);
                // In fail state, steps after the failed one are skipped (no result)
                return (
                  <StepRow 
                    key={step.order} 
                    step={step} 
                    stepResult={stepResult} 
                    isRunning={isRunning && !stepResult} 
                  />
                );
              })}
              {(!testCase.stepsStructured || testCase.stepsStructured.length === 0) && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No steps defined for this test case.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Run Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-fit">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Execution</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <StatusBadge status={runStatus} />
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || !testCase.stepsStructured?.length}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
              ${(isRunning || !testCase.stepsStructured?.length) 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                Running...
              </span>
            ) : (
              'Run Test Case'
            )}
          </button>

          {/* Results Summary */}
          {runData && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 mb-2">
                {runData.durationMs != null && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-medium text-gray-900">{(runData.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {runData.screenshots && runData.screenshots.length > 0 && (
                  <div>
                    <span className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Evidence</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {runData.screenshots.length} captured
                    </span>
                  </div>
                )}
              </div>
              
              <RunResultBanner runData={runData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunTestCase;
