const statusConfig = {
  DONE: {
    label: 'Done',
    dot: 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.45)]',
    text: 'text-[#047857]',
    pill: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.45)]',
    text: 'text-[#92400e]',
    pill: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/20',
  },
  AT_RISK: {
    label: 'At Risk',
    dot: 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse',
    text: 'text-error',
    pill: 'bg-error-container text-on-error-container border-error/20',
  },
  NOT_STARTED: {
    label: 'Not Started',
    dot: 'bg-outline',
    text: 'text-on-surface-variant',
    pill: 'bg-surface-container text-on-surface-variant border-outline-variant',
  },
}

export const getStatusConfig = (status) => statusConfig[status] || statusConfig.NOT_STARTED

export function StatusIndicator({ status, compact = false }) {
  const config = getStatusConfig(status)

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${config.pill}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
      <span className={`font-label-md text-[11px] uppercase font-black tracking-wider ${config.text}`}>
        {config.label}
      </span>
    </div>
  )
}

export default StatusIndicator
