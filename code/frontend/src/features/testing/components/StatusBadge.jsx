/**
 * StatusBadge — Hiển thị trạng thái test case (Pass / Fail / Not Run / Blocked)
 * Mapping màu sắc theo thiết kế testcase.html
 */
const statusConfig = {
  PASS: {
    label: 'Pass',
    bgClass: 'bg-secondary-container',
    textClass: 'text-on-secondary-container',
    dotClass: 'bg-primary-container',
  },
  FAIL: {
    label: 'Fail',
    bgClass: 'bg-error-container',
    textClass: 'text-on-error-container',
    dotClass: 'bg-error',
  },
  NOT_RUN: {
    label: 'Not Run',
    bgClass: 'bg-surface-variant',
    textClass: 'text-on-surface-variant',
    dotClass: 'bg-outline',
  },
  BLOCKED: {
    label: 'Blocked',
    bgClass: 'bg-tertiary-fixed',
    textClass: 'text-on-tertiary-fixed',
    dotClass: 'bg-tertiary',
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.NOT_RUN

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}></span>
      {config.label}
    </span>
  )
}
