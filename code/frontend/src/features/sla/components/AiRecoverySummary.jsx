import React, { useState } from 'react'

export function AiRecoverySummary({ planDetailsJson, fallbackSummary }) {
  const [expanded, setExpanded] = useState(false)

  if (!planDetailsJson) {
    return (
      <p className="text-sm leading-relaxed text-on-surface">
        {fallbackSummary || 'No summary was generated for this recovery plan.'}
      </p>
    )
  }

  let details = null
  try {
    details = JSON.parse(planDetailsJson)
  } catch (e) {
    return (
      <p className="text-sm leading-relaxed text-on-surface">
        {fallbackSummary || 'No summary was generated for this recovery plan.'}
      </p>
    )
  }

  if (!details || !details.selectedPlan) {
    return (
      <p className="text-sm leading-relaxed text-on-surface">
        {fallbackSummary || 'No summary was generated for this recovery plan.'}
      </p>
    )
  }

  const { rootCause, selectedPlan, verifier } = details

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-container-low p-3">
          <h4 className="mb-1 text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">psychiatry</span>
            Nguyên nhân
          </h4>
          <p className="text-sm text-on-surface leading-snug">
            {rootCause?.type ? rootCause.type.replace(/_/g, ' ') : 'Unknown'}
          </p>
        </div>
        
        <div className="rounded-lg bg-surface-container-low p-3">
          <h4 className="mb-1 text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">strategy</span>
            Kế hoạch
          </h4>
          <p className="text-sm text-on-surface leading-snug">
            {selectedPlan.strategy || 'No explicit strategy provided'}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-[#eaf2ff] p-3 border-l-4 border-[#1463d9]">
        <h4 className="mb-1 text-xs font-bold text-[#1463d9] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          Việc ngay
        </h4>
        <ul className="list-disc pl-4 text-sm text-on-surface space-y-1">
          {selectedPlan.actions?.slice(0, 3).map((action, idx) => (
            <li key={idx}>
              <span className="font-medium">{action.actionDetails || action.message || action.rationale || action.actionType || action.type}</span>
              {action.checklistItems && action.checklistItems.length > 0 && (
                <span className="text-on-surface-variant"> — {action.checklistItems[0]}</span>
              )}
            </li>
          )) || <li>No immediate actions specified</li>}
        </ul>
      </div>

      <div className="rounded-lg bg-surface-container-low p-3">
        <h4 className="mb-1 text-xs font-bold text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          Theo dõi
        </h4>
        <p className="text-sm text-on-surface mb-1">
          <span className="font-medium text-[#16794d]">Success:</span> {selectedPlan.successCondition || 'N/A'}
        </p>
        <p className="text-sm text-on-surface">
          <span className="font-medium text-[#bb3232]">Fallback:</span> {selectedPlan.fallbackCondition || 'N/A'}
        </p>
      </div>

      <div className="mt-2 pt-2 border-t border-outline-variant/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          {expanded ? 'Hide Details' : 'Show Evidence & Verification'}
          <span className="material-symbols-outlined text-[14px]">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        
        {expanded && (
          <div className="mt-3 space-y-3 text-xs">
            {rootCause?.evidenceRefs && rootCause.evidenceRefs.length > 0 && (
              <div>
                <strong className="text-on-surface-variant">Evidence:</strong>
                <ul className="list-disc pl-4 text-on-surface mt-1">
                  {rootCause.evidenceRefs.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {verifier && (
              <div>
                <strong className="text-on-surface-variant">Verification (Confidence: {selectedPlan.confidence}):</strong>
                {verifier.valid ? (
                  <p className="text-[#16794d] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Plan passed all constraints
                  </p>
                ) : (
                  <div className="mt-1">
                    <p className="text-[#bb3232] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Plan had violations
                    </p>
                    {verifier.violations && verifier.violations.length > 0 && (
                      <ul className="list-disc pl-4 text-on-surface mt-1">
                        {verifier.violations.map((v, idx) => (
                          <li key={idx}>{v}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
