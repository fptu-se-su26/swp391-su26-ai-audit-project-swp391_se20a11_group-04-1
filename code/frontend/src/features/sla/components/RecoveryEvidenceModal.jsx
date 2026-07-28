import React from 'react'

const MODE_LABELS = {
  AI_GENERATED: 'AI generated',
  AI_FAILED_FALLBACK: 'AI failed fallback',
  RULE_FALLBACK: 'Rule fallback',
}

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return '-'
  }
}

export default function RecoveryEvidenceModal({ plan, onClose }) {
  if (!plan) return null

  const generationMode = plan.generationMode || (plan.generatedSource === 'AI' ? 'AI_GENERATED' : 'RULE_FALLBACK')
  const hasScore = plan.scoreBeforeExecution != null || plan.scoreAfterExecution != null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Recovery Evidence
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Plan #{plan.id} - Task #{plan.taskId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close evidence modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">Evidence Snapshot</p>
              <p className="mt-1 text-lg font-bold text-on-surface">
                {plan.evidenceSnapshotId ? `#${plan.evidenceSnapshotId}` : 'Pending'}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">Sprint</p>
              <p className="mt-1 text-lg font-bold text-on-surface">
                {plan.sprintId ? `#${plan.sprintId}` : '-'}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">Generation</p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {MODE_LABELS[generationMode] || generationMode}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">Checked At</p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {formatDateTime(plan.effectivenessCheckedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-on-surface-variant">SLA Score</p>
                <p className="mt-1 text-xl font-bold text-on-surface">
                  {hasScore
                    ? `${plan.scoreBeforeExecution ?? '-'} -> ${plan.scoreAfterExecution ?? 'tracking'}`
                    : 'Tracking after execution'}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                plan.gateResult === 'PASSED'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : plan.gateResult === 'FAILED'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}>
                {plan.gateResult || 'INSUFFICIENT_DATA'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {plan.gateReason || 'Evidence will appear after the recovery effectiveness check runs.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-outline-variant p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
