import React from 'react';
import { NodeResizer } from '@xyflow/react';

const SystemBoundaryNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer 
        minWidth={200} 
        minHeight={200} 
        isVisible={selected} 
        lineStyle={{ borderColor: '#000000', pointerEvents: 'none' }} 
        handleStyle={{ width: 8, height: 8, backgroundColor: '#000000', pointerEvents: 'all' }} 
      />
      {/* Visual background and border */}
      <div className="w-full h-full border-[1.5px] border-solid border-black/40 bg-black/5 rounded-xl transition-all hover:border-black/80 !pointer-events-none"></div>
      
      {/* Title */}
      <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
        <span className="text-black text-[15px] font-bold !pointer-events-auto cursor-pointer px-4 py-1 inline-block" title="Click here to select the System Boundary">
          {data.label}
        </span>
      </div>

      {/* Clickable Borders (Invisible, 16px thick for easy clicking) */}
      <div className="absolute top-[-8px] left-[-8px] right-[-8px] h-[16px] !pointer-events-auto cursor-pointer rounded-t-xl" title="Click to select"></div>
      <div className="absolute bottom-[-8px] left-[-8px] right-[-8px] h-[16px] !pointer-events-auto cursor-pointer rounded-b-xl" title="Click to select"></div>
      <div className="absolute top-[-8px] bottom-[-8px] left-[-8px] w-[16px] !pointer-events-auto cursor-pointer rounded-l-xl" title="Click to select"></div>
      <div className="absolute top-[-8px] bottom-[-8px] right-[-8px] w-[16px] !pointer-events-auto cursor-pointer rounded-r-xl" title="Click to select"></div>
    </>
  );
};

export default SystemBoundaryNode;
