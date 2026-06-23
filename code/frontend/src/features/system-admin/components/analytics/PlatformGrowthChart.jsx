import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';
import { MOCK_CHART_DATA } from '../../utils/adminMockData';

const PlatformGrowthChart = () => {
  const [data, setData] = useState(MOCK_CHART_DATA);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        const res = await adminService.getGrowth(year);
        if (res.data?.success) {
          const backendData = res.data.data;
          // Transform backend format { labels: [...], users: [...], projects: [...] } to Recharts format
          if (backendData.labels && backendData.users && backendData.projects) {
            const chartData = backendData.labels.map((label, index) => ({
              name: label,
              users: backendData.users[index] || 0,
              projects: backendData.projects[index] || 0
            }));
            setData(chartData);
          }
        }
      } catch (err) {
        console.error("Failed to load growth chart data", err);
      }
    };
    fetchGrowthData();
  }, [year]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-sm text-body-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">trending_up</span> Platform Growth
        </h3>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high transition-colors px-4 py-2 rounded-lg text-on-surface text-sm font-medium"
          >
            Year {year}
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-32 bg-surface-container-high rounded-xl shadow-lg border border-outline-variant overflow-hidden z-10">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <button
                  key={y}
                  onClick={() => {
                    setYear(y);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/10 transition-colors ${year === y ? 'text-primary font-medium bg-primary/5' : 'text-on-surface'}`}
                >
                  Year {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full" style={{ height: '256px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 10, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, dataMax => Math.ceil(dataMax * 1.2) || 5]} allowDecimals={false} width={30} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: '600' }}
              labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="users" stroke="#22C55E" fillOpacity={0.2} fill="#22C55E" strokeWidth={3} isAnimationActive={false} />
            <Area type="monotone" dataKey="projects" stroke="#3B82F6" fillOpacity={0.2} fill="#3B82F6" strokeWidth={3} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-6 mt-6 border-t border-outline-variant pt-4 justify-center">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
          <span className="font-body-md text-[11px] text-on-surface">Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span className="font-body-md text-[11px] text-on-surface">Users</span>
        </div>
      </div>
    </div>
  );
};

export default PlatformGrowthChart;
