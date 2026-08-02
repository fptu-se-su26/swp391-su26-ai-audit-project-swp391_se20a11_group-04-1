/**
 * StatusBadge — compact status pill for test cases.
 * NOT_RUN: neutral gray-blue
 * PASS:    green
 * FAIL:    red
 * BLOCKED: amber
 */
const statusConfig = {
  PASS: {
    label: 'Pass',
    style: { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' },
    dot: '#059669',
  },
  FAIL: {
    label: 'Fail',
    style: { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' },
    dot: '#EF4444',
  },
  NOT_RUN: {
    label: 'Not Run',
    style: { background: '#F8FAFC', color: '#64748B', border: '1px solid #CBD5E1' },
    dot: '#94A3B8',
  },
  BLOCKED: {
    label: 'Blocked',
    style: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
    dot: '#D97706',
  },
}

export default function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.NOT_RUN
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, lineHeight: 1,
      whiteSpace: 'nowrap',
      ...cfg.style,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}
