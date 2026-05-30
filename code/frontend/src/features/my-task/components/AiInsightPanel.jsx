/**
 * AiInsightPanel - Panel AI Insight màu navy (Daily View right panel)
 * Nhận data từ AiInsightResponse (backend đã build text sẵn)
 *
 * Props:
 *   stats: {
 *     overdue: number,
 *     velocityWarning: string | null,
 *     overloadedMember: string | null,  (từ aiInsight.overloadedMember)
 *     alerts: string[],
 *     suggestions: string[],
 *   }
 *   lastUpdated: string
 */
const AiInsightPanel = ({ stats = {}, lastUpdated = 'just now' }) => {
  const {
    overdue = 0,
    velocityWarning,
    overloadedMember,
    alerts = [],
    suggestions = [],
  } = stats

  const hasContent = velocityWarning || overloadedMember || alerts.length > 0

  return (
    <div className="bg-[#1E3A5F] p-5 rounded-xl text-white shadow-lg relative overflow-hidden h-[160px] shrink-0">
      {/* Background icon */}
      <div className="absolute -right-4 -top-4 opacity-10">
        <span
          className="material-symbols-outlined text-[100px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <h4 className="font-bold text-[11px] uppercase tracking-wider">AI INSIGHT</h4>
      </div>

      {/* Content */}
      <p className="text-[12px] leading-relaxed font-medium">
        {hasContent ? (
          <>
            {velocityWarning && (
              <span>
                Nhóm có{' '}
                <span className="text-[#ffdbcd] font-bold">{overdue} task quá hạn</span>.{' '}
              </span>
            )}
            {overloadedMember && (
              <span>
                Module{' '}
                <span className="text-[#ffdbcd] font-bold italic">
                  {overloadedMember}
                </span>{' '}
                đang bị bottleneck.
              </span>
            )}
            {alerts.length > 0 && !velocityWarning && !overloadedMember && (
              <span>{alerts[0]}</span>
            )}
          </>
        ) : (
          <span>Mọi thứ đang ổn. Không có cảnh báo nào hôm nay.</span>
        )}
      </p>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-white/20 flex justify-between items-center">
        <span className="text-[10px] opacity-70">{lastUpdated}</span>
        <button className="text-[10px] font-bold hover:underline">CHI TIẾT</button>
      </div>
    </div>
  )
}

export default AiInsightPanel
