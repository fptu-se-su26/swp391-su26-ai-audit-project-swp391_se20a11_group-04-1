import React, { useState } from 'react';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const Button = ({ children, variant = 'primary', className = '', style = {}, ...props }) => {
  const [hov, setHov]   = useState(false);
  const [down, setDown] = useState(false);

  const base = {
    display:     'inline-flex',
    alignItems:  'center',
    gap:         8,
    padding:     '0 20px',
    height:      44,
    borderRadius: 12,
    fontSize:    14,
    fontWeight:  600,
    fontFamily:  'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
    cursor:      props.disabled ? 'not-allowed' : 'pointer',
    opacity:     props.disabled ? 0.5 : 1,
    border:      'none',
    transition:  `transform 150ms ${EASE}, box-shadow 150ms ${EASE}, background 150ms ${EASE}`,
    whiteSpace:  'nowrap',
  };

  /* ── Primary — 3D teal gradient ── */
  if (variant === 'primary') {
    const bg = down
      ? 'linear-gradient(180deg, #1E707D 0%, #165964 100%)'
      : hov
        ? 'linear-gradient(180deg, #2E9AAB 0%, #278A99 55%, #1E707D 100%)'
        : 'linear-gradient(180deg, #278A99 0%, #1E707D 55%, #165964 100%)';
    const shadow = down
      ? '0 4px 10px rgba(30,112,125,0.20)'
      : hov
        ? '0 12px 28px rgba(30,112,125,0.35), 0 0 16px rgba(78,198,216,0.20), inset 0 1px 0 rgba(255,255,255,0.25)'
        : '0 8px 20px rgba(30,112,125,0.25), 0 4px 10px rgba(30,112,125,0.15), inset 0 1px 0 rgba(255,255,255,0.30)';
    return (
      <button
        {...props}
        className={className}
        style={{
          ...base,
          background: bg,
          color:      '#fff',
          boxShadow:  shadow,
          transform:  down ? 'translateY(2px)' : hov ? 'translateY(-2px)' : 'translateY(0)',
          animation:  (!hov && !down) ? 'btnIdle 4.5s ease-in-out infinite' : 'none',
          ...style,
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); setDown(false); }}
        onMouseDown={() => setDown(true)}
        onMouseUp={() => setDown(false)}
      >
        {children}
      </button>
    );
  }

  /* ── Outline / secondary ── */
  if (variant === 'outline') {
    return (
      <button
        {...props}
        className={className}
        style={{
          ...base,
          background:  hov ? '#D7EEF1' : '#FFFFFF',
          color:       hov ? '#1E707D' : '#374151',
          border:      `1.5px solid ${hov ? '#1E707D' : '#D9E7E4'}`,
          boxShadow:   '0 2px 8px rgba(0,0,0,0.05)',
          transform:   hov ? 'translateY(-1px)' : 'translateY(0)',
          ...style,
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {children}
      </button>
    );
  }

  /* ── Danger ── */
  if (variant === 'danger') {
    return (
      <button
        {...props}
        className={className}
        style={{
          ...base,
          background:  hov ? '#FEE2E2' : '#FEF2F2',
          color:       '#EF4444',
          border:      `1.5px solid ${hov ? '#FCA5A5' : '#FECACA'}`,
          boxShadow:   '0 2px 8px rgba(0,0,0,0.05)',
          transform:   hov ? 'translateY(-1px)' : 'translateY(0)',
          ...style,
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {children}
      </button>
    );
  }

  /* ── Fallback ── */
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
