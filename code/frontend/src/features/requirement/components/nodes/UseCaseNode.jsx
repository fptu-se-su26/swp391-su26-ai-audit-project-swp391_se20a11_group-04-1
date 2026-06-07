import React from 'react';
import { Handle, Position } from '@xyflow/react';

const UseCaseNode = ({ data, isConnectable }) => {
  return (
    <div className="relative group">
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Left} id="left-s" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="target" position={Position.Right} id="right-t" isConnectable={isConnectable} style={{ opacity: 0, width: 1, height: 1 }} />
      
      <div className="flex items-center justify-center px-4 py-2 bg-white border border-blue-500 rounded-[50px] shadow-sm min-w-[120px] min-h-[40px] text-center max-w-[200px]">
        <span className="text-sm font-medium text-gray-800 break-words">
          {data.label}
        </span>
      </div>
    </div>
  );
};

export default UseCaseNode;
