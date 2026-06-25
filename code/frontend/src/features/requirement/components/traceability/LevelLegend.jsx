import React from 'react';

const LevelLegend = () => {
  const levels = [
    { name: 'Requirement', color: 'bg-[#1E707D]' },
    { name: 'Use Case', color: 'bg-cyan-500' },
    { name: 'Task', color: 'bg-amber-500' },
    { name: 'Test', color: 'bg-emerald-500' },
  ];

  return (
    <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-200/60 shadow-sm flex items-center gap-4 z-50">
      {levels.map((level, i) => (
        <React.Fragment key={level.name}>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${level.color}`} />
            <span className="text-xs font-medium text-slate-600">{level.name}</span>
          </div>
          {i < levels.length - 1 && (
            <span className="text-slate-300 text-[10px]">●</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LevelLegend;
