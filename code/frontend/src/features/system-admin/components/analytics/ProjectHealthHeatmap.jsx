import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';

const ProjectHealthHeatmap = () => {
  const [data, setData] = useState({
    activeCount: 0,
    slowCount: 0,
    inactiveCount: 0,
    projectsList: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      setIsLoading(true);
      try {
        const res = await adminService.getProjectHealth(year);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load project health data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealth();
  }, [year]);

  const totalProjects = data.activeCount + data.slowCount + data.inactiveCount;

  const pieData = [
    { name: 'Active', value: data.activeCount, color: '#22C55E' },
    { name: 'Slow', value: data.slowCount, color: '#F59E0B' },
    { name: 'Inactive', value: data.inactiveCount, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const percentage = Math.round((pData.value / totalProjects) * 100) || 0;
      return (
        <div className="bg-surface-container-high px-3 py-2 rounded-lg shadow-xl border border-outline-variant text-xs font-medium z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pData.color }}></div>
            <span className="text-on-surface">{pData.name}: {pData.value} projects ({percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredProjects = (data.projectsList || []).filter(p => {
    if (statusFilter === 'All') return true;
    return p.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-headline-sm text-body-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1E707D]">donut_large</span> Project Health
        </h3>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-lg text-on-surface text-xs font-medium border border-outline-variant/30"
          >
            Year {year}
            <span className="material-symbols-outlined text-base">expand_more</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-32 bg-surface-container-high rounded-xl shadow-lg border border-outline-variant overflow-hidden z-20">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <button
                  key={y}
                  onClick={() => {
                    setYear(y);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1E707D]/10 transition-colors ${year === y ? 'text-[#1E707D] font-medium bg-[#1E707D]/5' : 'text-on-surface'}`}
                >
                  Year {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[320px]">
        
        {/* Left Side: Donut Chart */}
        <div className="w-full lg:w-1/2 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-outline-variant/50">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">Loading data...</div>
          ) : (
            <>
              <div className="relative flex-1 min-h-[180px]">
                {totalProjects === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">No projects found</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        stroke="none"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {totalProjects > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-headline-md text-on-surface">{totalProjects}</span>
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Projects</span>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-col gap-2">
                {[
                  { label: 'Active', count: data.activeCount, color: 'bg-[#22C55E]' },
                  { label: 'Slow', count: data.slowCount, color: 'bg-[#F59E0B]' },
                  { label: 'Inactive', count: data.inactiveCount, color: 'bg-[#EF4444]' },
                ].map(item => {
                  const pct = totalProjects > 0 ? Math.round((item.count / totalProjects) * 100) : 0;
                  return (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                        <span className="text-on-surface-variant font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-on-surface font-bold w-6 text-right">{item.count}</span>
                        <span className="text-on-surface-variant w-10 text-right">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Actionable List */}
        <div className="w-full lg:w-1/2 flex flex-col bg-surface-container-lowest">
          <div className="px-5 py-3 flex items-center justify-between border-b border-outline-variant/30">
            <h4 className="font-label-md text-on-surface flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              Needs Attention
            </h4>
            <div className="flex gap-1 bg-surface-container-low p-0.5 rounded text-[10px]">
              {['All', 'Active', 'Slow', 'Inactive'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-1.5 py-0.5 tracking-wide font-medium rounded transition-colors ${statusFilter === tab ? 'bg-surface-container-lowest text-[#1E707D] shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[250px] lg:max-h-[320px] custom-scrollbar p-1.5">
            {isLoading ? (
              <div className="text-center text-on-surface-variant text-xs py-4">Loading...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center text-on-surface-variant text-xs py-4">No projects in this status.</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredProjects.map((proj, idx) => {
                  let statusColor = 'text-green-600 bg-green-500/10';
                  let statusLabel = 'Active';
                  if (proj.status === 'slow') {
                    statusColor = 'text-amber-600 bg-amber-500/10';
                    statusLabel = `Slow ${proj.daysInactive}d`;
                  } else if (proj.status === 'inactive') {
                    statusColor = 'text-red-600 bg-red-500/10';
                    statusLabel = `Inactive ${proj.daysInactive}d`;
                  }

                  return (
                    <div key={proj.id} className="p-2.5 rounded-md hover:bg-surface-container-low transition-colors group flex items-start justify-between gap-3 border border-transparent hover:border-outline-variant/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-label-md text-on-surface truncate text-[13px]">{idx + 1}. {proj.name}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm ${statusColor} whitespace-nowrap`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span> {proj.mentorName}</span>
                          <span className="text-outline-variant/40">•</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span> {proj.membersCount} members</span>
                        </div>
                      </div>
                      <button className="text-[#1E707D] opacity-0 group-hover:opacity-100 transition-opacity flex items-center font-label-sm text-[11px] hover:underline whitespace-nowrap mt-1">
                        View <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHealthHeatmap;
