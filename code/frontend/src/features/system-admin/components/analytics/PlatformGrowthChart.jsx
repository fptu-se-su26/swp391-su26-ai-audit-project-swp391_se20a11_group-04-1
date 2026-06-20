import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';
import { MOCK_CHART_DATA } from '../../utils/adminMockData';

const PlatformGrowthChart = () => {
  const [data, setData] = useState(MOCK_CHART_DATA);

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        const res = await adminService.getGrowth();
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
  }, []);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-sm text-body-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">trending_up</span> Platform Growth
        </h3>
        <div className="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
          <span className="text-xs font-label-md text-on-surface-variant">Last 6 Months</span>
          <span className="material-symbols-outlined text-xs text-on-surface-variant">keyboard_arrow_down</span>
        </div>
      </div>
      
      <div className="flex-1 w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: '600' }}
              labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="users" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
            <Area type="monotone" dataKey="projects" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorProjects)" />
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
