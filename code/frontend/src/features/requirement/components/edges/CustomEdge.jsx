import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected,
  data
}) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  let edgePath = '', labelX = 0, labelY = 0;
  try {
    const bezierRes = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = bezierRes[0];
    labelX = bezierRes[1];
    labelY = bezierRes[2];
  } catch (err) {
    console.error('CustomEdge path calculation failed:', err);
    return null;
  }

  const isDependency = data?.relType === 'include' || data?.relType === 'extends';
  const finalStyle = isDependency ? { ...style, strokeDasharray: '5,5' } : style;
  const finalMarkerEnd = isDependency && !markerEnd ? { type: 'arrowclosed', width: 14, height: 14 } : markerEnd;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={finalMarkerEnd} style={finalStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              backgroundColor: 'white',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'gray',
              border: '1px solid #e5e7eb'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan z-50 animate-fade-in"
          >
             <div className="bg-white border border-gray-200 shadow-xl rounded-lg p-1.5 flex gap-1 items-center">
                 {(data?.relType === 'include' || data?.relType === 'extends') && (
                     <>
                         <div className="relative inline-block text-left">
                             <button 
                                 onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} 
                                 className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center font-bold font-mono text-[11px]" 
                                 title="Đổi loại (Include/Extend)"
                             >
                                &lt;&lt;{data.relType}&gt;&gt;
                             </button>
                             {isDropdownOpen && (
                                 <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded shadow-lg z-50">
                                     <button 
                                         className={`w-full text-left px-2 py-1 text-[11px] font-mono hover:bg-gray-100 ${data.relType === 'include' ? 'font-bold text-blue-600' : 'text-gray-700'}`}
                                         onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); data?.onEdgeAction(id, 'changeType', 'include'); }}
                                     >
                                         &lt;&lt;include&gt;&gt;
                                     </button>
                                     <button 
                                         className={`w-full text-left px-2 py-1 text-[11px] font-mono hover:bg-gray-100 ${data.relType === 'extends' ? 'font-bold text-blue-600' : 'text-gray-700'}`}
                                         onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); data?.onEdgeAction(id, 'changeType', 'extends'); }}
                                     >
                                         &lt;&lt;extends&gt;&gt;
                                     </button>
                                 </div>
                             )}
                         </div>
                         <div className="w-[1px] bg-gray-200 mx-1 h-4"></div>
                         <button onClick={(e) => { e.stopPropagation(); data?.onEdgeAction(id, 'reverse'); }} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center" title="Đảo chiều">
                            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                         </button>
                         <div className="w-[1px] bg-gray-200 mx-1 h-4"></div>
                     </>
                 )}
                 <button onClick={(e) => { e.stopPropagation(); data?.onEdgeAction(id, 'delete'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded flex items-center justify-center" title="Xóa dây nối">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                 </button>
             </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
