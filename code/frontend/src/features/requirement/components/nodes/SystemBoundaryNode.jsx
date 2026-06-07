import React from 'react';

const SystemBoundaryNode = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="absolute top-2 left-0 right-0 text-center">
        <span className="text-[#4A90D9] text-[15px] font-bold">
          {data.label}
        </span>
      </div>
    </div>
  );
};

export default SystemBoundaryNode;
