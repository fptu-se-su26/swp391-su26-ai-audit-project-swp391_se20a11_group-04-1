import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

export default function SprintSummary({
  selectedSprint,
  summary,
  riskTaskCount,
  tasksLoading,
  burndownData,
  distributionData,
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sprint Summary</h2>
        <span className="text-xs font-semibold text-slate-500">
          {tasksLoading ? 'Updating tasks...' : `${summary.total} tasks tracked`}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900">{selectedSprint.name}</h3>
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${summary.health >= 75 ? 'bg-emerald-100 text-emerald-800' : summary.health >= 45 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                SLA health {summary.health}%
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              {selectedSprint.goal || 'No sprint goal specified.'}
            </p>
          </div>
          <div className="w-full lg:w-80">
            <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
              <span>Progress</span>
              <span className="text-slate-900">{summary.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: `${summary.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Done', value: `${summary.done}/${summary.total}`, icon: 'check_circle', tone: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Blocked', value: summary.blocked, icon: 'block', tone: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Overdue', value: summary.overdue, icon: 'schedule', tone: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Penalty', value: summary.penalty, icon: 'gavel', tone: 'text-rose-700', bg: 'bg-rose-50/50' },
            { label: 'Risk tasks', value: riskTaskCount, icon: 'warning', tone: 'text-slate-700', bg: 'bg-slate-100' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {metric.label}
                </p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg}`}>
                  <span className={`material-symbols-outlined text-[18px] ${metric.tone}`}>{metric.icon}</span>
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500">Burndown</h3>
          <div className="h-64">
            {summary.total === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No tasks assigned to this sprint.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData} margin={{ top: 5, right: 12, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#0f172a" name="Actual" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500">Task Distribution</h3>
          <div className="h-64">
            {distributionData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No task status data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
