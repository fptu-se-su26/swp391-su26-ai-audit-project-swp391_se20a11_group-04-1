import { useTestRun } from '../hooks/useTestRun';
import { Play, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

export default function TestRunPanel({ testCase }) {
  const { status, steps, screenshots, error, durationMs, bugReportId, startRun, reset } =
    useTestRun(testCase.id);

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">

      {/* Header + Run button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Playwright Auto Run</h3>
        <div className="flex gap-2">
          {status !== 'IDLE' && (
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">
              Reset
            </button>
          )}
          <button
            onClick={startRun}
            disabled={status === 'RUNNING'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white 
                       rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       text-sm font-medium transition-all"
          >
            {status === 'RUNNING' ? (
              <><Loader size={14} className="animate-spin" /> Đang chạy...</>
            ) : (
              <><Play size={14} /> Chạy test</>
            )}
          </button>
        </div>
      </div>

      {/* Status badge */}
      {status !== 'IDLE' && (
        <StatusBadge status={status} durationMs={durationMs} />
      )}

      {/* Terminal — hiển thị từng step */}
      {steps.length > 0 && (
        <div className="bg-gray-900 rounded-md p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={step.status === 'PASS' ? 'text-green-400' : 'text-red-400'}>
                {step.status === 'PASS' ? '✓' : '✗'}
              </span>
              <span className="text-gray-200 flex-1">{step.title}</span>
              <span className="text-gray-500">{step.duration}ms</span>
            </div>
          ))}
          {status === 'RUNNING' && (
            <div className="text-gray-400 animate-pulse">▋</div>
          )}
        </div>
      )}

      {/* Lỗi */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
          <div className="flex items-center gap-2 text-red-700 font-medium">
            <AlertTriangle size={14} />
            {error.message}
          </div>
          {error.failedStep && (
            <div className="text-red-500 text-xs mt-1">Step lỗi: {error.failedStep}</div>
          )}
        </div>
      )}

      {/* Bug Report tự động */}
      {bugReportId && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 
                        border border-orange-200 rounded-md p-2">
          <AlertTriangle size={14} />
          Bug Report #{bugReportId} đã được tạo tự động
          <a href={`../bugs/${bugReportId}`} className="underline ml-auto text-xs">
            Xem →
          </a>
        </div>
      )}

      {/* Screenshots gallery */}
      {screenshots.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Screenshots ({screenshots.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {screenshots.map((ss, i) => (
              <a key={i} href={ss.url} target="_blank" rel="noreferrer">
                <img
                  src={ss.url}
                  alt={ss.filename}
                  className="h-24 w-auto rounded border border-gray-200 
                             hover:border-indigo-400 transition-colors cursor-zoom-in"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, durationMs }) {
  const config = {
    RUNNING: { color: 'bg-blue-100 text-blue-700', icon: <Loader size={12} className="animate-spin" />, label: 'Đang chạy...' },
    PASS:    { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} />, label: `PASS • ${durationMs}ms` },
    FAIL:    { color: 'bg-red-100 text-red-700',   icon: <XCircle size={12} />,    label: `FAIL • ${durationMs}ms` },
    ERROR:   { color: 'bg-gray-100 text-gray-700', icon: <AlertTriangle size={12} />, label: 'Lỗi hệ thống' },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium w-fit ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
}
