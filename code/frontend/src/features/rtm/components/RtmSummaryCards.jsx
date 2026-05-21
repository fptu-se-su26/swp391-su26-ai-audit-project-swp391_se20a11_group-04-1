import StatusIndicator from './StatusIndicator'

const cards = [
  { key: 'totalRequirements', label: 'Requirements', icon: 'description', tone: 'text-primary' },
  { key: 'doneCount', label: 'Done', icon: 'check_circle', status: 'DONE' },
  { key: 'inProgressCount', label: 'In Progress', icon: 'pending', status: 'IN_PROGRESS' },
  { key: 'atRiskCount', label: 'At Risk', icon: 'warning', status: 'AT_RISK' },
]

export function RtmSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.key} className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-on-surface">{summary?.[card.key] ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center border border-outline-variant/40">
              <span className={`material-symbols-outlined text-xl ${card.tone || ''}`}>{card.icon}</span>
            </div>
          </div>
          {card.status && (
            <div className="mt-4">
              <StatusIndicator status={card.status} compact />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default RtmSummaryCards
