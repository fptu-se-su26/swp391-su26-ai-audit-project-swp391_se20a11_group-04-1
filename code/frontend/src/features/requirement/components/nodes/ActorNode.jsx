import React from 'react';
import { Handle, Position } from '@xyflow/react';

const ActorNode = ({ data, isConnectable }) => {
  return (
    <div className="flex flex-col items-center min-w-[80px]">
      {/* Target handles on both sides */}
      <Handle type="target" position={Position.Left} id="left-target" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="target" position={Position.Right} id="right-target" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      
      {/* Source handles on both sides */}
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      
      <div className="flex flex-col items-center">
        {/* SVG Stickman */}
        <svg width="30" height="50" viewBox="0 0 30 50">
          <circle cx="15" cy="10" r="8" stroke="black" strokeWidth="2" fill="transparent" />
          <line x1="15" y1="18" x2="15" y2="35" stroke="black" strokeWidth="2" />
          <line x1="15" y1="22" x2="0" y2="30" stroke="black" strokeWidth="2" />
          <line x1="15" y1="22" x2="30" y2="30" stroke="black" strokeWidth="2" />
          <line x1="15" y1="35" x2="5" y2="50" stroke="black" strokeWidth="2" />
          <line x1="15" y1="35" x2="25" y2="50" stroke="black" strokeWidth="2" />
        </svg>
        <div className="mt-2 text-sm font-semibold text-gray-800 text-center whitespace-nowrap">
          {data.label}
        </div>
      </div>
    </div>
  );
};

export default ActorNode;
