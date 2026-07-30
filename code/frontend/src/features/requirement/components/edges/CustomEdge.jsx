import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath, getSmoothStepPath, useReactFlow } from '@xyflow/react';

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
  const [dragPos, setDragPos] = React.useState(null);
  const { screenToFlowPosition } = useReactFlow();

  const handlePointerDown = (e) => {
      e.stopPropagation();
      const target = e.target;
      target.setPointerCapture(e.pointerId);
      
      const handlePointerMove = (eMove) => {
          const flowPos = screenToFlowPosition({ x: eMove.clientX, y: eMove.clientY });
          setDragPos(flowPos);
      };
      
      const handlePointerUp = (eUp) => {
          target.releasePointerCapture(eUp.pointerId);
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          
          const finalPos = screenToFlowPosition({ x: eUp.clientX, y: eUp.clientY });
          setDragPos(null);
          if (data?.onEdgeAction) {
              data.onEdgeAction(id, 'updateControlPoint', finalPos);
          }
      };
      
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
  };

  let edgePath = '', labelX = 0, labelY = 0;
  try {
    const cp = dragPos || data?.controlPoint;
    if (cp) {
        edgePath = `M ${sourceX} ${sourceY} L ${cp.x} ${cp.y} L ${targetX} ${targetY}`;
        labelX = cp.x;
        labelY = cp.y;
    } else {
        const pathParams = {
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        };
        if (data?.relType === 'actor-generalization') {
            // "dây nối tôi chỉ dc vẽ hình vuông vậy thôi" -> Simple L-Shape (1 corner)
            // Source is bottom, Target is left/right side.
            // Go straight down to targetY, then horizontal to targetX.
            edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${targetY} L ${targetX} ${targetY}`;
            labelX = sourceX + (targetX - sourceX) / 2;
            labelY = targetY;
        } else {
            const pathRes = getBezierPath(pathParams);
            edgePath = pathRes[0];
            labelX = pathRes[1];
            labelY = pathRes[2];
        }
    }
  } catch (err) {
    console.error('CustomEdge path calculation failed:', err);
    return null;
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
              pointerEvents: 'auto',
              cursor: 'grab',
            }}
            className={`nodrag nopan z-40 ${dragPos ? 'cursor-grabbing' : ''}`}
            onPointerDown={handlePointerDown}
          >
             <div className="w-2.5 h-2.5 bg-[#1E707D] rounded-sm shadow-md ring-2 ring-white hover:scale-125 transition-transform"></div>
          </div>
          <div
            style={{
              position: 'absolute',
              transform: `translate(10px, -110%) translate(${labelX}px,${labelY}px)`,
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
                                 className="px-2 py-1 text-[#1E707D] hover:bg-[#1E707D]/10 rounded flex items-center justify-center font-bold font-mono text-[11px]" 
                                 title="Đổi loại (Include/Extend)"
                             >
                                &lt;&lt;{data.relType}&gt;&gt;
                             </button>
                             {isDropdownOpen && (
                                 <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded shadow-lg z-50">
                                     <button 
                                         className={`w-full text-left px-2 py-1 text-[11px] font-mono hover:bg-gray-100 ${data.relType === 'include' ? 'font-bold text-[#1E707D]' : 'text-gray-700'}`}
                                         onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); data?.onEdgeAction(id, 'changeType', 'include'); }}
                                     >
                                         &lt;&lt;include&gt;&gt;
                                     </button>
                                     <button 
                                         className={`w-full text-left px-2 py-1 text-[11px] font-mono hover:bg-gray-100 ${data.relType === 'extends' ? 'font-bold text-[#1E707D]' : 'text-gray-700'}`}
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
