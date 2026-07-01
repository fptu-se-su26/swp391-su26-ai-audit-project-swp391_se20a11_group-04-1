import React, { useState, useEffect } from 'react';
import { C, T } from '../utils/theme';

export default function SvgDonutChart({ 
  percentage, 
  color = C.success, 
  size = 80, 
  strokeWidth = 8, 
  label = null,
  tooltipData = null 
}) {
  const [offset, setOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Animation effect on mount
    setOffset(circumference);
    const timer = setTimeout(() => {
      setOffset(targetOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference, targetOffset]);

  return (
    <div 
      style={{ position: 'relative', width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={C.borderLt}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      {/* Center Label */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        pointerEvents: 'none'
      }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>
          {percentage}%
        </span>
        {label && (
          <span style={{ fontSize: size * 0.12, fontWeight: 600, color: C.textMuted, marginTop: 2 }}>
            {label}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {isHovered && tooltipData && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: 8, background: '#1E293B', color: '#FFF', padding: '8px 12px',
          borderRadius: 8, fontSize: 12, zIndex: 100,
          boxShadow: T.shadow.md, minWidth: 120,
          pointerEvents: 'none', animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #334155' }}>Breakdown</div>
          {tooltipData.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span style={{ color: '#94A3B8' }}>{d.label}</span>
              <span style={{ fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -4px); } to { opacity: 1; transform: translate(-50%, 0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
