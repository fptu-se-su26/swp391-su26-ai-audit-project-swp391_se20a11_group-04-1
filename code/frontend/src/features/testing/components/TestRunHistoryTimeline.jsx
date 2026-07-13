import React from 'react';

const STATUS_COLOR = {
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
    SYSTEM_ERROR: 'bg-red-500',
    TIMED_OUT: 'bg-orange-500',
    RUNNING: 'bg-[#1E707D] animate-pulse',
    PENDING: 'bg-gray-300',
    // API Result statuses
    PASSED: 'bg-green-500',
    FAILED: 'bg-red-500',
    ERROR: 'bg-red-500'
};

const STATUS_LABEL = {
    COMPLETED: (r) => {
        if (r.failedCount > 0) return 'FAIL';
        if (r.passedCount > 0) return 'PASS';
        // fallback: cả failedCount và passedCount đều 0 (data cũ bị bug)
        // → dùng failedCount từ executions nếu có, không thì PASS
        return 'PASS';
    },
    SYSTEM_ERROR: () => 'ERROR',
    CANCELLED: () => 'CANCELLED',
    TIMED_OUT: () => 'TIMED OUT',
    RUNNING: () => 'ĐANG CHẠY',
    PENDING: () => 'ĐANG CHỜ',
    // API Result statuses
    PASSED: () => 'PASS',
    FAILED: () => 'FAIL',
    ERROR: () => 'ERROR'
};

export default function TestRunHistoryTimeline({ history, loading, onHistoryClick }) {
    if (loading) return <div className="text-[11px] text-gray-500">Đang tải...</div>;
    
    if (!history?.length) return (
        <div className="text-[11px] text-gray-500 italic">Chưa có lịch sử run được lưu.</div>
    );

    return (
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-4">
            {history.map((run) => {
                const isApiResult = 'statusCode' in run || 'responseTimeMs' in run;
                
                const uiStatus = STATUS_LABEL[run.status]?.(run) || run.status;
                let dotColor = STATUS_COLOR[run.status] || 'bg-gray-400';
                
                if (run.status === 'COMPLETED' && run.failedCount > 0) {
                    dotColor = 'bg-red-500';
                }

                const timestamp = run.executedAt || run.startedAt;
                const duration = run.responseTimeMs || run.durationMs;

                return (
                    <div 
                        key={run.id} 
                        className="relative pl-5 cursor-pointer hover:bg-gray-50 transition-colors rounded-md p-2 -ml-3 group"
                        onClick={() => onHistoryClick && !isApiResult && onHistoryClick(run.id)}
                    >
                        <div className={`absolute left-[-11px] top-3 w-4 h-4 rounded-full border-2 border-white ${dotColor} group-hover:scale-110 transition-transform`} />
                        
                        <div className="flex justify-between items-start mb-0.5">
                            <span className="font-semibold text-xs text-gray-800">{uiStatus}</span>
                            <span className="text-[10px] text-gray-500">
                                {timestamp ? new Date(timestamp).toLocaleString('vi-VN') : '--'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-gray-600">
                            {duration !== undefined && duration !== null && (
                                <span>{isApiResult ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}</span>
                            )}
                            {isApiResult && run.statusCode && <span>Status: {run.statusCode}</span>}
                            {!isApiResult && run.passedCount > 0 && <span className="text-green-600 font-medium">{run.passedCount} pass</span>}
                            {!isApiResult && run.failedCount > 0 && <span className="text-red-600 font-medium">{run.failedCount} fail</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
