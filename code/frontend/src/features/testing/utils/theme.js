export const C = {
  primary:     '#1E707D',
  primaryHov:  '#278A99',
  primaryDark: '#165964',
  primaryLt:   '#D7EEF1',
  accent:      '#4EC6D8',
  bg:          '#F8FAFC',
  surface:     '#FFFFFF',
  border:      '#E2E8F0', // Slightly softer border like Linear
  borderLt:    '#F1F5F9',
  textPri:     '#0F172A', // Slate 900
  textSec:     '#475569', // Slate 600
  textMuted:   '#94A3B8', // Slate 400
  
  success:     '#10B981', successBg: '#ECFDF5', successBdr: '#A7F3D0',
  danger:      '#EF4444', dangerBg:  '#FEF2F2', dangerBdr:  '#FECACA',
  warning:     '#F59E0B', warningBg: '#FFFBEB', warningBdr: '#FDE68A',
  info:        '#3B82F6', infoBg:    '#EFF6FF', infoBdr:    '#BFDBFE',
  notrun:      '#64748B', notrunBg:  '#F8FAFC', notrunBdr: '#E2E8F0',
  
  // Test Types
  typeUI:      '#10B981', typeUIBg: '#ECFDF5',
  typeAPI:     '#3B82F6', typeAPIBg: '#EFF6FF',
  typeUNIT:    '#8B5CF6', typeUNITBg: '#F5F3FF',
  typeMANUAL:  '#F59E0B', typeMANUALBg: '#FFFBEB',
}

export const T = {
  font: 'Inter, -apple-system, sans-serif',
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px'
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    drawer: '-4px 0 24px rgba(0,0,0,0.08)',
    hover: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  transition: {
    default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
