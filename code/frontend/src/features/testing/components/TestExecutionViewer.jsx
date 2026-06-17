import { Play, CheckCircle, XCircle, Loader, AlertTriangle, Save, MousePointer2, MonitorPlay, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import AiAnalyzeButton from './AiAnalyzeButton';

/**
 * Ánh xạ step index (0-based) → screenshot object từ evidenceUrls.
 */
export function getScreenshotForStep(stepIndex, screenshots) {
  if (!screenshots || screenshots.length === 0) return null;
  const targetRegex = new RegExp(`step-${stepIndex + 1}-after(?:[^0-9]|$)`);
  return screenshots.find(ss => ss.filename && targetRegex.test(ss.filename)) || null;
}

export default function TestExecutionViewer({
  testCase,
  stepsArr,
  screenshots,
  error,
  status,
  durationMs,
  bugReportId,
  isSaved,
  // UI States
  focusedStepIndex,
  onFocusStep,
  currentStepIndex,
  lastRunningStepIndex,
  liveFrame,
  browserBarUrl,
  // Actions & Mode
  isReadOnly = false,
  onStartRun,
  onReset,
  onSaveRun,
  isRunning,
  runId,
  agentToken,
  isLocalUrl
}) {
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(null);
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedScreenshotIndex === null || !screenshots) return;
      if (e.key === 'ArrowRight') {
        setSelectedScreenshotIndex((prev) => Math.min(prev + 1, screenshots.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setSelectedScreenshotIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        setSelectedScreenshotIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScreenshotIndex, screenshots]);

  const handleDrag = (e) => {
    if (e.buttons !== 1) return; // Only trigger when mouse is held down
    const container = containerRef.current;
    if (!container) return;
    const newWidth = ((e.clientX - container.getBoundingClientRect().left) / container.offsetWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftPaneWidth(newWidth);
    }
  };

  const isFinished = !isRunning && status !== 'IDLE';
  const latestScreenshot = screenshots?.length > 0 ? screenshots[screenshots.length - 1] : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col font-sans text-[13px] min-h-[600px] xl:min-h-[700px]">
      
      {/* Topbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 text-center text-xs font-medium text-gray-500">
          {isReadOnly ? 'Historical Execution Viewer' : 'Playwright Live Execution'}
        </div>
        <div className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100">
          Playwright v1.44
        </div>
      </div>

      {/* Localhost Agent Banner */}
      {isLocalUrl && !isReadOnly && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                ⚠️ Cảnh báo Localhost
              </h3>
              <p className="mt-0.5 text-xs text-yellow-700">
                URL này là localhost. Bạn cần chạy DevTrack Local Agent trên máy để test có thể chạy được.
              </p>
            </div>
            {agentToken ? (
              <div className="flex items-center gap-2 bg-white p-1.5 pr-2 rounded-md border border-yellow-300 shadow-sm">
                <code className="px-2 py-1 bg-gray-900 text-green-400 rounded text-xs font-mono whitespace-nowrap">
                  npx devtrack-agent@latest --token={agentToken}
                </code>
                <button 
                  onClick={() => navigator.clipboard.writeText(`npx devtrack-agent@latest --token=${agentToken}`)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 transition-colors text-[11px] font-medium whitespace-nowrap"
                  title="Copy command"
                >
                  Copy
                </button>
              </div>
            ) : (
              <div className="text-xs text-yellow-600 animate-pulse font-medium">Đang lấy token...</div>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative flex-col lg:flex-row" onMouseMove={handleDrag}>
        
        {/* Left Pane: Steps */}
        <div style={{ width: windowWidth >= 1024 ? `${leftPaneWidth}%` : '100%' }} className="p-4 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase text-gray-500 mb-3">
            <CheckCircle size={14} /> steps
          </div>
          
          <div className="space-y-1">
            {(!testCase?.stepsStructured || testCase.stepsStructured.length === 0) && !isRunning && (
              <div className="text-gray-400 text-xs italic py-2">Bấm Run để theo dõi quá trình chạy test...</div>
            )}
            
            {(stepsArr || []).map((step, i) => {
                const effectiveFailedStepIndex = (error && error.failedStepIndex !== undefined && error.failedStepIndex !== null)
                  ? error.failedStepIndex
                  : (status === 'FAIL' ? lastRunningStepIndex : null);

                let stepStatus = null;
                if (status === 'RUNNING') {
                  if (currentStepIndex !== null) {
                    if (i < currentStepIndex) stepStatus = 'PASS';
                    else if (i === currentStepIndex) stepStatus = 'RUNNING';
                  }
                } else if (status === 'PASS') {
                  stepStatus = 'PASS';
                } else if (status === 'FAIL' || status === 'ERROR') {
                  if (effectiveFailedStepIndex !== null) {
                    if (i < effectiveFailedStepIndex) stepStatus = 'PASS';
                    else if (i === effectiveFailedStepIndex) stepStatus = 'FAIL';
                  } else {
                    if (i === 0) stepStatus = 'FAIL';
                  }
                }

                const isStepRunning = stepStatus === 'RUNNING';
                const isPass = stepStatus === 'PASS';
                const isFail = stepStatus === 'FAIL';
                const isFailedStep = isFail;

                let bgColor = 'bg-gray-50';
                let borderColor = 'border-transparent';
                let numBg = 'bg-gray-200 text-gray-500';
                
                if (isStepRunning) {
                  bgColor = 'bg-blue-50';
                  borderColor = 'border-blue-200';
                  numBg = 'bg-blue-500 text-white';
                } else if (isPass) {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-200';
                  numBg = 'bg-green-500 text-white';
                } else if (isFailedStep) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-200';
                  numBg = 'bg-red-500 text-white';
                }

                return (
                  <div key={i}>
                    <div
                      onClick={() => {
                        if (!isRunning && isFinished) onFocusStep(i);
                      }}
                      className={`flex items-start gap-2 p-2 rounded-md border transition-colors
                        ${!isRunning && isFinished ? 'cursor-pointer' : ''}
                        ${focusedStepIndex === i ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
                        ${bgColor} ${borderColor}`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5 ${numBg}`}>
                        {isStepRunning ? <Loader size={10} className="animate-spin" /> : 
                         isPass ? <CheckCircle size={10} /> : 
                         isFail ? <XCircle size={10} /> : (i + 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-[11px] font-medium ${isStepRunning ? 'text-blue-700' : isPass ? 'text-green-700' : isFail ? 'text-red-700' : 'text-gray-700'}`}>
                          {step.description || step.action}
                        </div>
                        {step.action && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {step.action} {step.selector ? `(${step.selector})` : ''}
                          </div>
                        )}
                      </div>
                      {/* Nút xem ảnh phóng to */}
                      {isFinished && (() => {
                        const ss = getScreenshotForStep(i, screenshots);
                        if (!ss) return null;
                        const ssIdx = screenshots.indexOf(ss);
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScreenshotIndex(ssIdx >= 0 ? ssIdx : 0);
                            }}
                            title="Xem ảnh chụp bước này"
                            className="shrink-0 ml-1 p-1 rounded hover:bg-white/60 text-gray-400 hover:text-indigo-500 transition-colors"
                          >
                            <Image size={12} />
                          </button>
                        );
                      })()}
                    </div>
                    {isFailedStep && error && (
                      <div className="ml-[34px] mt-2 bg-red-50 border border-red-200 rounded p-3 text-[11px] font-mono text-red-700 whitespace-pre-wrap">
                        <div className="mb-2">
                          <strong className="text-red-800 uppercase tracking-wide text-[10px]">Error Details:</strong>
                          <div className="mt-1">{error.message}</div>
                        </div>
                        <div className="mt-3 text-red-800/80 font-bold italic">
                          Execution stopped at Step {i + 1}.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Overall Status OVERVIEW at bottom */}
            {!isRunning && status === 'PASS' && (
              <div className="mt-5 p-3 bg-green-100 border border-green-300 rounded-md text-green-800 font-bold text-[14px]">
                🟢 TEST CASE PASSED
              </div>
            )}

            {!isRunning && (status === 'FAIL' || status === 'ERROR') && (() => {
              const effectiveFailedStepIndex = (error && error.failedStepIndex !== undefined && error.failedStepIndex !== null)
                ? error.failedStepIndex
                : lastRunningStepIndex;

              if (effectiveFailedStepIndex !== null && effectiveFailedStepIndex !== undefined) {
                const stepObj = stepsArr?.[effectiveFailedStepIndex];
                const failedTitle = stepObj?.description || stepObj?.action || `Step ${effectiveFailedStepIndex + 1}`;
                return (
                  <div className="mt-5 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[14px]">🔴 TEST CASE FAILED</div>
                      {runId && !isRunning && (
                        <AiAnalyzeButton testRunId={runId} />
                      )}
                    </div>
                    <div className="text-[13px] font-medium mt-1">
                      Failed Step: <span className="font-normal">{failedTitle}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="mt-5 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[14px]">🔴 TEST CASE FAILED</div>
                    {runId && !isRunning && (
                      <AiAnalyzeButton testRunId={runId} />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Global Error Message */}
          {error && ((error.failedStepIndex === undefined || error.failedStepIndex === null) && lastRunningStepIndex === null) && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-red-700 font-medium">
                  <AlertTriangle size={14} /> Lỗi thực thi
                </div>
                {runId && !isRunning && (
                  <AiAnalyzeButton testRunId={runId} />
                )}
              </div>
              <div className="text-red-600 font-mono text-[10px] whitespace-pre-wrap">{error.message}</div>
            </div>
          )}
          
          {/* Bug Report Hint */}
          {bugReportId && (
            <div className="mt-4 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-2">
              <AlertTriangle size={14} />
              Đã tạo tự động Bug Report #{bugReportId}
            </div>
          )}
        </div>

        {/* Drag Resizer */}
        <div className="hidden lg:flex w-2 cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500/50 items-center justify-center -ml-1 z-10 transition-colors">
          <div className="h-8 w-1 bg-gray-300 rounded-full" />
        </div>

        {/* Right Pane: Browser Preview */}
        <div style={{ width: windowWidth >= 1024 ? `${100 - leftPaneWidth}%` : '100%' }} className="p-4 bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase text-gray-500 mb-3">
            <Play size={14} /> headless browser screen
          </div>
          
          <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col min-h-[250px]">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200 shrink-0">
              <div className="text-gray-400 text-[10px]">◀</div>
              <div className="text-gray-400 text-[10px]">▶</div>
              <div className="flex-1 bg-white border border-gray-200 rounded px-2 py-0.5 font-mono text-[10px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                {browserBarUrl}
              </div>
              <div className="text-gray-400 text-[10px]">↻</div>
            </div>
            
            {/* Screen content */}
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center p-2">
              {(() => {
                if (isRunning) {
                  return liveFrame ? (
                    <img 
                      src={`data:image/jpeg;base64,${liveFrame}`} 
                      alt="Live Execution Stream"
                      className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm transition-opacity duration-75"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                      <Loader size={20} className="animate-spin text-blue-500" />
                      Đang khởi động Chromium...
                    </div>
                  );
                }

                if (status === 'IDLE') {
                  if (isReadOnly) {
                     return (
                       <div className="flex flex-col items-center justify-center text-gray-400">
                         <MonitorPlay size={32} className="mb-2 opacity-20" />
                         <span className="text-xs uppercase tracking-widest font-medium">Chưa có kết quả chạy</span>
                       </div>
                     );
                  }
                  return (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Play size={14} /> Bấm Run để bắt đầu
                    </div>
                  );
                }

                if (focusedStepIndex !== null) {
                  const focusedScreenshot = getScreenshotForStep(focusedStepIndex, screenshots);
                  if (focusedScreenshot) {
                    return (
                      <img 
                        src={focusedScreenshot.url} 
                        alt={focusedScreenshot.filename}
                        className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm transition-opacity duration-300"
                      />
                    );
                  } else {
                    return (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <MonitorPlay size={32} className="mb-2 opacity-20" />
                        <span className="text-xs uppercase tracking-widest font-medium text-center">Bước này không có ảnh chụp</span>
                      </div>
                    );
                  }
                }

                if (latestScreenshot) {
                  return (
                    <img 
                      src={latestScreenshot.url} 
                      alt={latestScreenshot.filename}
                      className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm transition-opacity duration-300"
                    />
                  );
                }

                return (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <MonitorPlay size={32} className="mb-2 opacity-20" />
                    <span className="text-xs uppercase tracking-widest font-medium">Hoàn Thành (Không có hình ảnh)</span>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Gallery thumbnails */}
          {screenshots?.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {screenshots.map((ss, i) => (
                <img 
                  key={i} 
                  src={ss.url} 
                  alt={ss.filename} 
                  onClick={() => setSelectedScreenshotIndex(i)}
                  className="h-14 w-auto border border-gray-300 rounded opacity-70 hover:opacity-100 cursor-pointer object-cover shadow-sm transition-opacity" 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Modal (Lightbox) - Z-index updated to 60 */}
      {selectedScreenshotIndex !== null && screenshots && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-screen flex flex-col items-center justify-center p-4">
            <button 
              onClick={() => setSelectedScreenshotIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-200 p-2 z-10 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
            >
              <X size={28} strokeWidth={2.5} />
            </button>
            
            {selectedScreenshotIndex > 0 && (
              <button 
                onClick={() => setSelectedScreenshotIndex(prev => prev - 1)}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all hover:scale-110 z-10"
              >
                <ChevronLeft size={36} strokeWidth={2.5} />
              </button>
            )}

            {selectedScreenshotIndex < screenshots.length - 1 && (
              <button 
                onClick={() => setSelectedScreenshotIndex(prev => prev + 1)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all hover:scale-110 z-10"
              >
                <ChevronRight size={36} strokeWidth={2.5} />
              </button>
            )}

            <img 
              src={screenshots[selectedScreenshotIndex].url} 
              alt={screenshots[selectedScreenshotIndex].filename} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-gray-700"
            />
            
            <div className="absolute bottom-4 text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-full">
              {screenshots[selectedScreenshotIndex].filename} ({selectedScreenshotIndex + 1} / {screenshots.length})
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 shrink-0">
        <StatusChip status={status} durationMs={durationMs} />
        
        {!isReadOnly && status !== 'IDLE' && (
          <button onClick={onReset} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 ml-auto">
            Reset
          </button>
        )}
        
        {!isReadOnly && ['PASS', 'FAIL'].includes(status) && !isSaved && (
          <button
            onClick={onSaveRun}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 shadow-sm ml-2"
          >
            <Save size={12} /> LƯU KẾT QUẢ
          </button>
        )}

        {!isReadOnly && isSaved && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium text-teal-700 bg-teal-50 ml-2">
            <CheckCircle size={12} /> Đã lưu
          </div>
        )}

        {!isReadOnly && (
          <button
            onClick={onStartRun}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'IDLE' ? 'ml-auto' : ''} ${
              isRunning 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            {isRunning ? (
              <><Loader size={12} className="animate-spin" /> RUNNING...</>
            ) : (
              <><Play size={12} /> RUN TEST</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusChip({ status, durationMs }) {
  if (status === 'IDLE') {
    return <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold tracking-wider">IDLE</div>;
  }
  if (status === 'RUNNING') {
    return <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold tracking-wider">RUNNING</div>;
  }
  if (status === 'PASS' || status === 'COMPLETED') {
    return <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold tracking-wider">PASS • {durationMs}ms</div>;
  }
  if (status === 'FAIL') {
    return <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold tracking-wider">FAIL • {durationMs}ms</div>;
  }
  return <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold tracking-wider">{status}</div>;
}
