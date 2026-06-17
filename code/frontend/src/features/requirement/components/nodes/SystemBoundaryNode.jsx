import React from 'react';
import { NodeResizer } from '@xyflow/react';

const SystemBoundaryNode = ({ data, selected }) => {
  return (
    <>
      <NodeResizer minWidth={200} minHeight={200} isVisible={selected} lineStyle={{ borderColor: '#000000' }} handleStyle={{ width: 8, height: 8, backgroundColor: '#000000' }} />
      <div className="w-full h-full border-[1.5px] border-solid border-black/40 bg-black/5 rounded-xl transition-all hover:border-black/80">
        <div className="absolute top-2 left-0 right-0 text-center">
          <span className="text-black text-[15px] font-bold">
            {data.label}
          </span>
        </div>
      </div>
    </>
  );
};

export default SystemBoundaryNode;
