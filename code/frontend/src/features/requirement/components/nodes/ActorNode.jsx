import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

const ActorNode = ({ data, id, isConnectable, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => {
      setName(data.label);
  }, [data.label]);

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const submitName = () => {
      setIsEditing(false);
      if (name.trim() !== data.label && data.onNameUpdate) {
          data.onNameUpdate(id, name.trim());
      } else {
          setName(data.label);
      }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          submitName();
      } else if (e.key === 'Escape') {
          setIsEditing(false);
          setName(data.label);
      }
  };

  // Hiệu ứng Pulse Highlight khi mới tạo
  const isNew = data.isNew;

  return (
    <div 
        className={`relative group flex flex-col items-center min-w-[80px] p-2 rounded transition-all ${isNew ? 'animate-pulse ring-2 ring-yellow-400' : ''}`} 
        onDoubleClick={handleDoubleClick}
    >
      <NodeToolbar isVisible={selected && !isEditing} position={Position.Top}>
          <button 
             onClick={(e) => { e.stopPropagation(); if (data.onDelete) data.onDelete(id); }}
             className="bg-white text-red-500 border border-red-200 shadow-md rounded-full p-1 flex items-center justify-center hover:bg-red-50 transition-colors"
             title="Xóa Actor"
          >
             <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
      </NodeToolbar>

      {/* Handles: Hiển thị mờ, sáng lên và to ra khi hover vào Actor */}
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#1E707D] border-2 border-white opacity-0 group-hover:opacity-100 hover:!scale-150 hover:!bg-[#1E707D] transition-all duration-200 cursor-crosshair z-10" style={{ right: -6, top: '50%' }} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#1E707D] border-2 border-white opacity-0 group-hover:opacity-100 hover:!scale-150 hover:!bg-[#1E707D] transition-all duration-200 cursor-crosshair z-10" style={{ left: -6, top: '50%' }} />
      <Handle type="source" position={Position.Top} id="top" isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#1E707D] border-2 border-white opacity-0 group-hover:opacity-100 hover:!scale-150 hover:!bg-[#1E707D] transition-all duration-200 cursor-crosshair z-10" style={{ top: -6, left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} className="!w-3 !h-3 !bg-[#1E707D] border-2 border-white opacity-0 group-hover:opacity-100 hover:!scale-150 hover:!bg-[#1E707D] transition-all duration-200 cursor-crosshair z-10" style={{ bottom: -6, left: '50%' }} />
      
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
        <div className="mt-2 flex justify-center">
          {isEditing ? (
              <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={submitName}
                  onKeyDown={handleKeyDown}
                  className="text-sm font-semibold text-gray-800 text-center whitespace-nowrap bg-white border border-[#1E707D]/20 rounded px-1 outline-none w-auto"
                  style={{ minWidth: '80px' }}
              />
          ) : (
              <div className="text-sm font-semibold text-gray-800 text-center whitespace-nowrap px-1 cursor-text select-none">
                {data.label}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorNode;
