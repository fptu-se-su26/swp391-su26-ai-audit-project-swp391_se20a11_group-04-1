/**
 * TypeBadge — Hiển thị loại test case với màu phân biệt rõ ràng
 *
 * UI          → teal/primary
 * API         → violet/purple
 * UNIT        → blue
 * INTEGRATION → orange
 * MANUAL      → slate
 */
const TYPE_CONFIG = {
  UI: {
    bg:     'rgba(30,112,125,0.12)',
    color:  '#1E707D',
    border: 'rgba(30,112,125,0.25)',
    dot:    '#1E707D',
  },
  API: {
    bg:     'rgba(124,58,237,0.10)',
    color:  '#7C3AED',
    border: 'rgba(124,58,237,0.22)',
    dot:    '#7C3AED',
  },
  UNIT: {
    bg:     'rgba(59,130,246,0.10)',
    color:  '#2563EB',
    border: 'rgba(59,130,246,0.22)',
    dot:    '#2563EB',
  },
  INTEGRATION: {
    bg:     'rgba(245,158,11,0.10)',
    color:  '#D97706',
    border: 'rgba(245,158,11,0.22)',
    dot:    '#F59E0B',
  },
  MANUAL: {
    bg:     'rgba(100,116,139,0.10)',
    color:  '#475569',
    border: 'rgba(100,116,139,0.22)',
    dot:    '#64748B',
  },
}

export default function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type?.toUpperCase()] || TYPE_CONFIG.MANUAL
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           5,
      padding:       '3px 8px',
      borderRadius:  6,
      background:    cfg.bg,
      border:        `1px solid ${cfg.border}`,
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color:         cfg.color,
      fontFamily:    'Inter,-apple-system,sans-serif',
      whiteSpace:    'nowrap',
    }}>
      <span style={{
        width:        5, height: 5, borderRadius: '50%',
        background:   cfg.dot, flexShrink: 0,
        boxShadow:    `0 0 4px ${cfg.dot}`,
      }} />
      {type}
    </span>
  )
}
