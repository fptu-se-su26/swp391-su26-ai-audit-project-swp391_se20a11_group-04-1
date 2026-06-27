import React from 'react';

const FieldLabel = ({ children, className = '', style = {} }) => (
  <span className={className} style={{
    display:       'block',
    fontSize:      '10px',
    fontWeight:    600,
    color:         '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom:  '6px',
    ...style
  }}>
    {children}
  </span>
);

export default FieldLabel;
