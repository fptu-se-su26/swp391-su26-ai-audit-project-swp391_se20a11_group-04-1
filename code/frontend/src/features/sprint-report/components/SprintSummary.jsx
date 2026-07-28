import {
  Cell,
  Legend,
  Line,
  ComposedChart,
  Bar,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import SprintKpiBar from './SprintKpiBar'

export default function SprintSummary({
  selectedSprint,
  summary,
  riskTaskCount,
  tasksLoading,
  burndownData,
  distributionData,
  displayMetrics,
}) {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-[#D9E7E4] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-black text-slate-900">{selectedSprint.name}</h2>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${summary.health >= 75 ? 'bg-[#dcfce7] text-[#166534]' : summary.health >= 45 ? 'bg-[#fef08a] text-[#854d0e]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                SLA {summary.health}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {tasksLoading ? 'Updating...' : `${summary.total} tasks tracked`}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">
              {selectedSprint.goal || 'No sprint goal specified.'}
            </p>
          </div>
          <div className="w-full lg:w-72">
            <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Progress</span>
              <span>{summary.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#D7EEF1]">
              <div className="h-full rounded-full bg-[#1E707D]" style={{ width: `${summary.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <SprintKpiBar summary={summary} displayMetrics={displayMetrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#D9E7E4] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-[#165964]">Burndown</h3>
          <div className="h-56">
            {summary.total === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No tasks assigned to this sprint.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={burndownData} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="actual" fill="#2563eb" name="Actual" maxBarSize={40} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#D9E7E4] bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-[#165964]">Task Distribution</h3>
          <div className="h-56">
            {distributionData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No task status data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
