import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

const UseCaseNode = ({ data, id, isConnectable, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => {
      setName(data.label);
  }, [data.label]);

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
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

  // State
  const isIsolated = data.isIsolated;
  const isNew = data.isNew;

  return (
    <div 
        className={`relative group transition-all duration-500 ease-in-out ${isNew ? 'animate-pulse ring-4 ring-yellow-400 rounded-[50px]' : ''}`}
        onDoubleClick={handleDoubleClick}
    >
      <NodeToolbar isVisible={selected && !isEditing} position={Position.Top}>
          <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-full p-1">
            <button 
               onClick={(e) => { e.stopPropagation(); if (data.onDelete) data.onDelete(id); }}
               className="text-red-500 hover:bg-red-50 rounded-full p-1 flex items-center justify-center transition-colors"
               title="Xóa Use Case"
            >
               <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
      </NodeToolbar>

      {/* Handles: Đã ẩn hoàn toàn nhưng vẫn hoạt động nhờ ConnectionMode.Loose */}
      {/* Source handles act as both source and target in Loose mode */}
      <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} className="!w-2 !h-2 !bg-transparent border-none opacity-0" style={{ right: -4, top: '50%' }} />
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} className="!w-2 !h-2 !bg-transparent border-none opacity-0" style={{ left: -4, top: '50%' }} />
      <Handle type="source" position={Position.Top} id="top" isConnectable={isConnectable} className="!w-2 !h-2 !bg-transparent border-none opacity-0" style={{ top: -4, left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={isConnectable} className="!w-2 !h-2 !bg-transparent border-none opacity-0" style={{ bottom: -4, left: '50%' }} />
      
      <div className={`flex items-center justify-center px-4 py-2 bg-white rounded-[50px] shadow-sm min-w-[120px] min-h-[40px] text-center max-w-[200px] border-2 transition-colors duration-500 ease-in-out ${isIsolated ? 'border-red-500 shadow-red-200' : 'border-black'}`}>
        {isEditing ? (
            <textarea
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={submitName}
                onKeyDown={handleKeyDown}
                className="text-sm font-medium text-gray-800 text-center bg-transparent border-none outline-none resize-none overflow-hidden w-full h-full"
                rows={Math.max(1, name.split('\n').length)}
                style={{ minHeight: '20px' }}
            />
        ) : (
            <span className="text-sm font-medium text-gray-800 break-words cursor-text select-none">
              {data.label}
            </span>
        )}
      </div>
    </div>
  );
};

export default UseCaseNode;
