import React from 'react';

const STATUS_COLOR = {
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
    SYSTEM_ERROR: 'bg-red-500',
    TIMED_OUT: 'bg-orange-500',
    RUNNING: 'bg-blue-500 animate-pulse',
    PENDING: 'bg-gray-300',
};

const STATUS_LABEL = {
    COMPLETED: (r) => r.failedCount > 0 ? 'FAIL' : 'PASS',
    SYSTEM_ERROR: () => 'ERROR',
    CANCELLED: () => 'CANCELLED',
    TIMED_OUT: () => 'TIMED OUT',
    RUNNING: () => 'ĐANG CHẠY',
    PENDING: () => 'ĐANG CHỜ',
};

export default function TestRunHistoryTimeline({ history, loading }) {
    if (loading) return <div className="text-[11px] text-gray-500">Đang tải...</div>;
    
    if (!history?.length) return (
        <div className="text-[11px] text-gray-500 italic">Chưa có lịch sử run được lưu.</div>
    );

    return (
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-4">
            {history.map((run) => {
                const uiStatus = STATUS_LABEL[run.status]?.(run) || run.status;
                const dotColor = run.status === 'COMPLETED' && run.failedCount > 0
                    ? 'bg-red-500' : STATUS_COLOR[run.status] || 'bg-gray-400';

                return (
                    <div key={run.id} className="relative pl-5">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${dotColor}`} />
                        
                        <div className="flex justify-between items-start mb-0.5">
                            <span className="font-semibold text-xs text-gray-800">{uiStatus}</span>
                            <span className="text-[10px] text-gray-500">
                                {run.startedAt ? new Date(run.startedAt).toLocaleString('vi-VN') : '--'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-gray-600">
                            {run.durationMs && <span>{(run.durationMs / 1000).toFixed(1)}s</span>}
                            {run.passedCount > 0 && <span className="text-green-600 font-medium">{run.passedCount} pass</span>}
                            {run.failedCount > 0 && <span className="text-red-600 font-medium">{run.failedCount} fail</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
