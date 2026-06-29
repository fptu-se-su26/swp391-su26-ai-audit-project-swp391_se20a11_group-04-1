import React from 'react';

const ICON_BG = `linear-gradient(135deg, #278A99 0%, #1E707D 100%)`;

const SectionTitle = ({ icon, children, className = '', style = {} }) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', ...style }}>
    <div style={{
      width:         '32px',
      height:        '32px',
      borderRadius:  '10px',
      background:    ICON_BG,
      display:       'flex',
      alignItems:    'center',
      justifyContent:'center',
      flexShrink:    0,
      boxShadow:     `0 4px 10px rgba(30,112,125,0.25)`,
    }}>
      <span className="material-symbols-outlined" style={{
        fontSize: '16px',
        color:    '#fff',
        fontVariationSettings: "'FILL' 1",
      }}>{icon}</span>
    </div>
    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>{children}</span>
  </div>
);

export default SectionTitle;
