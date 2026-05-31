import { Play, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { useTestRun } from '../hooks/useTestRun';
import { useEffect, useState } from 'react';

export default function LiveTestRunner({ testCase }) {
  const { status, runId, steps, screenshots, error, durationMs, bugReportId, startRun, reset } = useTestRun(testCase.id);
  const [liveFrame, setLiveFrame] = useState(null);
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(null);

  useEffect(() => {
    let ws;
    if (status === 'RUNNING' && runId) {
      ws = new WebSocket(`ws://localhost:4000/?runId=${runId}&role=client`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'frame') {
            setLiveFrame(msg.data);
          }
        } catch (e) {}
      };
    }
    return () => {
      if (ws) ws.close();
    };
  }, [status, runId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedScreenshotIndex === null || !screenshots) return;
      if (e.key === 'ArrowRight') {
        setSelectedScreenshotIndex((prev) => Math.min(prev + 1, screenshots.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setSelectedScreenshotIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setSelectedScreenshotIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScreenshotIndex, screenshots]);

  const isRunning = status === 'RUNNING';
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
          Playwright Live Execution
        </div>
        <div className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100">
          Playwright v1.44
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0">
        
        {/* Left Pane: Steps */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase text-gray-500 mb-3">
            <CheckCircle size={14} /> steps
          </div>
          
          <div className="space-y-1">
            {steps.length === 0 && !isRunning && (
              <div className="text-gray-400 text-xs italic py-2">Bấm Run để theo dõi quá trình chạy test...</div>
            )}
            
            {steps.map((step, i) => {
              const isStepRunning = step.status === 'RUNNING';
              const isPass = step.status === 'PASS';
              const isFail = step.status === 'FAIL';
              
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
              } else if (isFail) {
                bgColor = 'bg-red-50';
                borderColor = 'border-red-200';
                numBg = 'bg-red-500 text-white';
              }

              return (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-md border ${bgColor} ${borderColor} transition-colors`}>
                  <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5 ${numBg}`}>
                    {isStepRunning ? <Loader size={10} className="animate-spin" /> : 
                     isPass ? <CheckCircle size={10} /> : 
                     isFail ? <XCircle size={10} /> : (i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-[11px] font-medium ${isStepRunning ? 'text-blue-700' : isPass ? 'text-green-700' : isFail ? 'text-red-700' : 'text-gray-700'}`}>
                      {step.title}
                    </div>
                  </div>
                  {step.duration != null && (
                    <div className="font-mono text-[10px] text-gray-400 shrink-0 pt-0.5">
                      {step.duration}ms
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-xs">
              <div className="flex items-center gap-1.5 text-red-700 font-medium mb-1">
                <AlertTriangle size={14} /> Lỗi thực thi
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

        {/* Right Pane: Browser Preview */}
        <div className="p-4 bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase text-gray-500 mb-3">
            <Play size={14} /> headless browser screen
          </div>
          
          <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col min-h-[250px]">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200 shrink-0">
              <div className="text-gray-400 text-[10px]">◀</div>
              <div className="text-gray-400 text-[10px]">▶</div>
              <div className="flex-1 bg-white border border-gray-200 rounded px-2 py-0.5 font-mono text-[10px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                {latestScreenshot ? (testCase.base_url + (testCase.steps_structured?.find(s => s.action === 'goto')?.path || '')) : 'about:blank'}
              </div>
              <div className="text-gray-400 text-[10px]">↻</div>
            </div>
            
            {/* Screen content */}
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center p-2">
              {liveFrame ? (
                <img 
                  src={`data:image/jpeg;base64,${liveFrame}`} 
                  alt="Live Execution Stream"
                  className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm transition-opacity duration-75"
                />
              ) : latestScreenshot ? (
                <img 
                  src={latestScreenshot.url} 
                  alt={latestScreenshot.filename}
                  className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm transition-opacity duration-300"
                />
              ) : !isRunning && status === 'IDLE' ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Play size={14} /> Bấm Run để bắt đầu
                </div>
              ) : isRunning ? (
                <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                  <Loader size={20} className="animate-spin text-blue-500" />
                  Đang khởi động Chromium...
                </div>
              ) : null}
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

      {/* Screenshot Modal */}
      {selectedScreenshotIndex !== null && screenshots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-screen flex flex-col items-center justify-center p-4">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedScreenshotIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10 bg-black/40 rounded-full"
            >
              <XCircle size={32} />
            </button>
            
            {/* Previous Button */}
            {selectedScreenshotIndex > 0 && (
              <button 
                onClick={() => setSelectedScreenshotIndex(prev => prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
              >
                <div className="w-8 h-8 flex items-center justify-center text-2xl font-bold">◀</div>
              </button>
            )}

            {/* Next Button */}
            {selectedScreenshotIndex < screenshots.length - 1 && (
              <button 
                onClick={() => setSelectedScreenshotIndex(prev => prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
              >
                <div className="w-8 h-8 flex items-center justify-center text-2xl font-bold">▶</div>
              </button>
            )}

            {/* Image */}
            <img 
              src={screenshots[selectedScreenshotIndex].url} 
              alt={screenshots[selectedScreenshotIndex].filename} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-gray-700"
            />
            
            {/* Caption */}
            <div className="absolute bottom-4 text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-full">
              {screenshots[selectedScreenshotIndex].filename} ({selectedScreenshotIndex + 1} / {screenshots.length})
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 shrink-0">
        <StatusChip status={status} durationMs={durationMs} />
        
        {status !== 'IDLE' && (
          <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 ml-auto">
            Reset
          </button>
        )}
        
        <button
          onClick={startRun}
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
      </div>
    </div>
  );
}

function StatusChip({ status, durationMs }) {
  if (status === 'IDLE') {
    return <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold tracking-wider">IDLE</div>;
  }
  if (status === 'RUNNING') {
    return <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold tracking-wider">RUNNING</div>;
  }
  if (status === 'PASS') {
    return <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold tracking-wider">PASS • {durationMs}ms</div>;
  }
  if (status === 'FAIL') {
    return <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold tracking-wider">FAIL • {durationMs}ms</div>;
  }
  return <div className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold tracking-wider">{status}</div>;
}
