import React, { useEffect, useRef } from 'react';
import { useTraceability } from './TraceabilityContext';

const HubNode = ({ level, colorClass, shadowClass, label }) => {
  const { registerHub, activePath } = useTraceability();
  const hubRef = useRef(null);
  
  useEffect(() => {
    registerHub(level, hubRef.current);
    return () => registerHub(level, null);
  }, [level, registerHub]);

  // Determine if this hub is on the active path
  // The active path always goes up to the root, so if activePath exists, all hubs from root down to activePath.level are technically active.
  // We'll simplify: if any active path exists, we highlight if the level matches or is "above" it in the tree.
  // Actually, for a simple hub, we can just glow if it matches the activePath's level or is active globally.
  const levels = ['Requirement', 'Use Cases', 'Tasks', 'Tests', 'Evidence'];
  const myIndex = levels.indexOf(level);
  const activeIndex = activePath ? levels.indexOf(activePath.level) : -1;
  
  const isActive = activePath && myIndex <= activeIndex;
  const isFaded = activePath && myIndex > activeIndex;

  return (
    <div 
      ref={hubRef}
      className={`relative z-20 transition-all duration-300 flex items-center justify-center cursor-help 
        bg-[#f8fafc] px-3 py-1 text-[11px] font-bold uppercase tracking-widest
        ${colorClass || 'text-slate-500'}
        ${isFaded ? 'opacity-40 grayscale' : 'opacity-100'}
        ${isActive ? 'scale-105 drop-shadow-sm' : ''}
      `}
      title={label}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 h-[1px] bg-slate-300"></span>
        {label}
        <span className="w-4 h-[1px] bg-slate-300"></span>
      </div>
    </div>
  );
};

export default HubNode;
