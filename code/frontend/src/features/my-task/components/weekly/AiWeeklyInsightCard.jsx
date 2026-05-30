/**
 * AiWeeklyInsightCard - Card AI Predictive Analysis nền navy
 * Props:
 *   insight: {
 *     velocityWarning: string | null,   // e.g. "team may fall behind by 2 days"
 *     overloadedMember: string | null,  // e.g. "Hoa.PT is overloaded with 8 tasks"
 *     suggestions: string[],            // list gợi ý
 *     alerts: string[],                 // list cảnh báo
 *   }
 *   onViewReport: function
 */

const AiWeeklyInsightCard = ({ insight = {}, onViewReport }) => {
  const {
    velocityWarning,
    overloadedMember,
    suggestions = [],
    alerts = [],
  } = insight

  const hasContent = velocityWarning || overloadedMember || suggestions.length > 0 || alerts.length > 0

  return (
    <div className="bg-[#1E3A5F] text-white rounded-xl p-4 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-primary-fixed text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span className="text-xs font-bold tracking-widest uppercase text-primary-fixed-dim">
            AI PREDICTIVE ANALYSIS
          </span>
        </div>

        {/* Main insight text */}
        {hasContent ? (
          <>
            <p className="text-sm leading-relaxed mb-4 text-primary-fixed">
              {velocityWarning && <span>{velocityWarning} </span>}
              {overloadedMember && <span>{overloadedMember}</span>}
              {!velocityWarning && !overloadedMember && (
                <span>Tiến độ tuần này đang ổn định. Không có cảnh báo nghiêm trọng.</span>
              )}
            </p>

            {/* Suggestions + Alerts */}
            {(suggestions.length > 0 || alerts.length > 0) && (
              <ul className="text-[11px] space-y-2 text-surface-container-highest mb-6">
                {suggestions.map((s, i) => (
                  <li key={`s-${i}`} className="flex gap-2">
                    <span className="text-primary-fixed-dim shrink-0">●</span>
                    <span>Suggestion: {s}</span>
                  </li>
                ))}
                {alerts.map((a, i) => (
                  <li key={`a-${i}`} className="flex gap-2">
                    <span className="text-[#ffb596] shrink-0">●</span>
                    <span>Alert: {a}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm leading-relaxed mb-6 text-primary-fixed">
            Chưa đủ dữ liệu để phân tích. Hãy thêm task và deadline vào sprint.
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={onViewReport}
          className="w-full py-2.5 bg-primary-container text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          View Full Report
        </button>
      </div>
    </div>
  )
}

export default AiWeeklyInsightCard
