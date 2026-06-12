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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-on-surface">Sprint Summary</h2>
        <span className="text-xs font-semibold text-on-surface-variant">
          {tasksLoading ? 'Updating tasks...' : `${summary.total} tasks tracked`}
        </span>
      </div>

      <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-on-surface">{selectedSprint.name}</h3>
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${summary.health >= 75 ? 'bg-[#dcfce7] text-[#166534]' : summary.health >= 45 ? 'bg-[#fef08a] text-[#854d0e]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                SLA health {summary.health}%
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
              {selectedSprint.goal || 'No sprint goal specified.'}
            </p>
          </div>
          <div className="w-full lg:w-80">
            <div className="mb-1 flex justify-between text-xs font-bold text-on-surface-variant">
              <span>Progress</span>
              <span>{summary.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full rounded-full bg-primary" style={{ width: `${summary.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: 'Done', value: `${summary.done}/${summary.total}`, icon: 'check_circle', tone: 'text-[#166534]' },
            { label: 'Blocked', value: summary.blocked, icon: 'block', tone: 'text-error' },
            { label: 'Overdue', value: summary.overdue, icon: 'schedule', tone: 'text-[#854d0e]' },
            { label: 'Penalty', value: summary.penalty, icon: 'gavel', tone: 'text-[#991b1b]' },
            { label: 'Risk tasks', value: riskTaskCount, icon: 'warning', tone: 'text-primary' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg border border-outline-variant/60 bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                  {metric.label}
                </p>
                <span className={`material-symbols-outlined text-xl ${metric.tone}`}>{metric.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-black text-on-surface">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5">
          <h3 className="mb-4 text-sm font-black text-on-surface">Burndown</h3>
          <div className="h-60">
            {summary.total === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                No tasks assigned to this sprint.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#2563eb" name="Actual" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5">
          <h3 className="mb-4 text-sm font-black text-on-surface">Task Distribution</h3>
          <div className="h-60">
            {distributionData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
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
