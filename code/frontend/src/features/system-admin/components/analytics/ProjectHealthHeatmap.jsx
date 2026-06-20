import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const ProjectHealthHeatmap = () => {
  const [data, setData] = useState({
    activeCount: 98,
    slowCount: 31,
    inactiveCount: 13,
    heatmap: []
  });

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await adminService.getProjectHealth();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load heatmap data", err);
      }
    };
    fetchHeatmap();
  }, []);

  const totalProjects = data.activeCount + data.slowCount + data.inactiveCount;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-sm text-body-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">grid_view</span> Project Health Heatmap
        </h3>
        <span className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider">{totalProjects} projects total</span>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        {data.heatmap.length > 0 ? (
          <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] mb-6">
            {data.heatmap.map((sq, i) => {
              let bgColor = '#22C55E';
              if (sq.status === 'slow') bgColor = '#F59E0B';
              if (sq.status === 'inactive') bgColor = '#EF4444';

              return (
                <div key={i} className="w-[14px] h-[14px] rounded-[3px] cursor-pointer relative group/square" style={{ backgroundColor: bgColor }}>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#001945] text-white text-[10px] rounded shadow-xl opacity-0 group-hover/square:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                    {sq.tooltip}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-on-surface-variant mb-6">Loading heatmap...</div>
        )}
      </div>
      
      <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
          <span className="text-[11px] font-label-md text-on-surface-variant">Active <span className="text-on-surface font-bold">{data.activeCount}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
          <span className="text-[11px] font-label-md text-on-surface-variant">Slow <span className="text-on-surface font-bold">{data.slowCount}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
          <span className="text-[11px] font-label-md text-on-surface-variant">Inactive <span className="text-on-surface font-bold">{data.inactiveCount}</span></span>
        </div>
      </div>
    </div>
  );
};

export default ProjectHealthHeatmap;
