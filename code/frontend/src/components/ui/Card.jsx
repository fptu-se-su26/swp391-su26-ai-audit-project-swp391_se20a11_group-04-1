import React, { useState } from 'react';

const CARD = {
  background:   '#FFFFFF',
  border:       '1px solid #D9E7E4',
  borderRadius: '20px',
  boxShadow:    '0 12px 30px rgba(0,0,0,0.06), 0 2px 6px rgba(30,112,125,0.04)',
  padding:      '24px',
  transition:   'transform 250ms ease, box-shadow 250ms ease',
};

const Card = ({ children, className = '', style = {}, ...props }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      className={className}
      style={{
        ...CARD,
        transform:  hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:  hovered
          ? '0 20px 48px rgba(30,112,125,0.12)'
          : CARD.boxShadow,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
