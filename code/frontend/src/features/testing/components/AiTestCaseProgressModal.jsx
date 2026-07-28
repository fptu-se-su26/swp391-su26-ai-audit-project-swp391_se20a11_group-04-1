import { useState, useEffect, useRef, useCallback } from 'react'
import { testCaseService } from '../services/testCaseService'

/* ── Design tokens ── */
const C = {
  primary: 'var(--project-theme, #1E707D)',
  primaryDark: '#165964',
  primaryLt: 'var(--project-theme-light, #D7EEF1)',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPri: '#111827',
  textSec: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#1D9E75',
  successBg: '#E1F5EE',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBdr: '#FECACA',
  stepActive: '#185FA5',
  stepActiveBg: '#EFF6FF',
  iconBg: '#EEEDFE',
  iconColor: '#3C3489',
}

const STEPS = [
  { id: 1, title: 'Analyze Requirement' },
  { id: 2, title: 'Generate Test Cases' },
  { id: 3, title: 'AI Quality Review' },
]

const STEP_DETAILS = {
  1: { title: 'Analyzing requirement...', detail: 'Reading requirement details and acceptance criteria' },
  2: { title: 'Generating test cases...', detail: 'Creating test scenarios, steps, and expected results' },
  3: { title: 'AI reviewing quality...', detail: 'Reviewing coverage, edge cases, and test completeness' },
  4: { title: 'Finalizing...', detail: 'Saving generated test cases to staging' },
}

export default function AiTestCaseProgressModal({ isOpen, projectId, payload, onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [progressWidth, setProgressWidth] = useState(0)
  const [errorMessage, setErrorMessage] = useState(null)
  const [hasPendingError, setHasPendingError] = useState(false)
  const abortRef = useRef(null)
  const hasCompletedRef = useRef(false)
  const resultRef = useRef(null)
  const timerRef1 = useRef(null)
  const timerRef2 = useRef(null)

  const startGeneration = useCallback(async (forceDiscard = false) => {
    if (!projectId || !payload) return

    setCurrentStep(1)
    setProgressWidth(0)
    setErrorMessage(null)
    setHasPendingError(false)
    hasCompletedRef.current = false
    resultRef.current = null

    // Create AbortController
    abortRef.current = new AbortController()

    try {
      const currentPayload = { ...payload, discardExisting: forceDiscard || payload.discardExisting }
      const data = await testCaseService.generateTestCaseWithAi(projectId, currentPayload, {
        signal: abortRef.current.signal,
      })

      // Check if aborted during the request
      if (abortRef.current?.signal.aborted) return

      resultRef.current = data
      setCurrentStep(4) // Success state
      setProgressWidth(100)
    } catch (err) {
      // Silently return on cancel
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || abortRef.current?.signal.aborted) {
        return
      }
      setErrorMessage(err.response?.data?.message || err.message || 'An error occurred during generation.')
      if (err.response?.data?.errorCode === 'PENDING_EXISTS') {
        setHasPendingError(true)
      }
    }
  }, [projectId, payload])

  // Start generation + step simulation when modal opens
  useEffect(() => {
    if (!isOpen) return

    startGeneration()

    // Step auto-advance timers
    const timer1 = setTimeout(() => setCurrentStep(prev => prev < 2 ? 2 : prev), 3000)
    const timer2 = setTimeout(() => setCurrentStep(prev => prev < 3 ? 3 : prev), 9000)

    // Simulated progress bar
    const progressInterval = setInterval(() => {
      setProgressWidth(prev => {
        if (prev < 90) return prev + Math.random() * 5
        return prev
      })
    }, 500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearInterval(progressInterval)
    }
  }, [isOpen, startGeneration])

  // Auto-close on success after 1.5s
  useEffect(() => {
    if (currentStep === 4 && !hasCompletedRef.current && resultRef.current) {
      hasCompletedRef.current = true
      const timeout = setTimeout(() => {
        onComplete?.(resultRef.current.generationId, resultRef.current)
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [currentStep, onComplete])

  // Stop timers/progress on error
  useEffect(() => {
    if (errorMessage) {
      setProgressWidth(prev => prev) // Freeze progress
    }
  }, [errorMessage])

  // Effect to clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef1.current)
      clearTimeout(timerRef2.current)
    }
  }, [])

  if (!isOpen) return null

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    onClose?.()
  }

  const handleRetry = (discard = false) => {
    if (currentStep < 4 && !errorMessage) return; // Prevent spam
    
    clearTimeout(timerRef1.current)
    clearTimeout(timerRef2.current)
    
    startGeneration(discard)
    
    // Restart step simulation is handled inside startGeneration setting step 1,
    // we just need to re-trigger the timers.
    timerRef1.current = setTimeout(() => setCurrentStep(prev => prev < 2 ? 2 : prev), 3000)
    timerRef2.current = setTimeout(() => setCurrentStep(prev => prev < 3 ? 3 : prev), 9000)
  }

  const getStepStatus = (stepId) => {
    if (errorMessage) {
      // On error, mark completed steps, current as active (frozen)
      if (currentStep > stepId) return 'completed'
      if (currentStep === stepId) return 'error'
      return 'waiting'
    }
    if (currentStep > stepId || currentStep === 4) return 'completed'
    if (currentStep === stepId) return 'active'
    return 'waiting'
  }

  const currentDetails = errorMessage
    ? { title: 'Generation failed', detail: errorMessage }
    : (STEP_DETAILS[currentStep] || STEP_DETAILS[3])

  /* ── Success State ── */
  if (currentStep === 4 && !errorMessage) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15,20,35,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16, fontFamily: 'Inter,-apple-system,sans-serif',
      }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: 440,
          padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'tcProgressFadeIn 0.5s ease',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: C.successBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.success }}>check</span>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPri, margin: '0 0 4px', textAlign: 'center' }}>
            Test Cases Generated!
          </h2>
          <p style={{ fontSize: 13, color: C.textSec, margin: 0, textAlign: 'center' }}>
            Redirecting to review...
          </p>
        </div>
      </div>
    )
  }

  /* ── Loading / Error State ── */
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,20,35,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16, fontFamily: 'Inter,-apple-system,sans-serif',
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: 440,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'tcProgressFadeIn 0.3s ease',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: C.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.iconColor }}>auto_awesome</span>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPri, margin: 0, lineHeight: 1.3 }}>
                Generating Test Cases...
              </h2>
              <p style={{ fontSize: 12, color: C.textSec, margin: '2px 0 0' }}>
                AI is analyzing your requirement
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            style={{
              width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`,
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.textSec, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Step Indicators */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          {STEPS.map((step) => {
            const status = getStepStatus(step.id)
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, width: 80 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  background: status === 'completed' ? C.successBg
                    : status === 'active' ? C.stepActiveBg
                    : status === 'error' ? C.dangerBg
                    : C.surface,
                  border: status === 'completed' ? 'none'
                    : status === 'active' ? `2px solid ${C.stepActive}`
                    : status === 'error' ? `2px solid ${C.danger}`
                    : `1.5px solid ${C.border}`,
                }}>
                  {status === 'completed' ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.success }}>check</span>
                  ) : status === 'active' ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.stepActive, animation: 'tcSpin 1s linear infinite' }}>sync</span>
                  ) : status === 'error' ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.danger }}>error</span>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 500 }}>{step.id}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, textAlign: 'center', marginTop: 8,
                  color: status === 'completed' ? C.success
                    : status === 'active' ? C.stepActive
                    : status === 'error' ? C.danger
                    : C.textMuted,
                  fontWeight: (status === 'completed' || status === 'active' || status === 'error') ? 500 : 400,
                }}>
                  {step.title}
                </span>
              </div>
            )
          })}

          {/* Connecting Lines */}
          <div style={{
            position: 'absolute', top: 40, left: 60, right: 60, height: 2,
            display: 'flex', alignItems: 'center', zIndex: 0,
          }}>
            <div style={{
              height: '100%', flex: 1, transition: 'all 0.5s ease',
              background: getStepStatus(1) === 'completed' ? C.success : 'transparent',
              borderTop: getStepStatus(1) === 'completed' ? 'none' : `2px dashed ${C.border}`,
            }} />
            <div style={{
              height: '100%', flex: 1, transition: 'all 0.5s ease',
              background: getStepStatus(2) === 'completed' ? C.success : 'transparent',
              borderTop: getStepStatus(2) === 'completed' ? 'none' : `2px dashed ${C.border}`,
            }} />
          </div>
        </div>

        {/* Current Step Status Box */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{
            background: errorMessage ? C.dangerBg : C.bg,
            border: `1px solid ${errorMessage ? C.dangerBdr : C.border}`,
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {errorMessage ? (
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.danger, flexShrink: 0 }}>error</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.stepActive, flexShrink: 0, animation: 'tcSpin 1s linear infinite' }}>sync</span>
            )}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: errorMessage ? C.danger : C.textPri, margin: 0 }}>
                {currentDetails.title}
              </h3>
              <p style={{ fontSize: 12, color: errorMessage ? C.danger : C.textSec, margin: '2px 0 0', wordBreak: 'break-all', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                {currentDetails.detail}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar (hidden on error) */}
        {!errorMessage && (
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.textSec }}>Processing...</span>
              <span style={{ fontSize: 12, color: C.textSec }}>
                {Math.min(Math.round(progressWidth), 100)}%
              </span>
            </div>
            <div style={{ width: '100%', background: C.border, height: 6, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: `linear-gradient(to right, ${C.stepActive}, ${C.iconColor})`,
                transition: 'width 0.3s ease-out',
                width: `${progressWidth}%`,
              }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid #F3F4F6` }}>
          {errorMessage ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textPri, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Close
              </button>
              {hasPendingError ? (
                <button
                  onClick={() => handleRetry(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: C.danger, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                  Discard & Regenerate
                </button>
              ) : (
                <button
                  onClick={() => handleRetry(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                  Retry
                </button>
              )}
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, margin: 0 }}>
              Please wait, this usually takes 15–30 seconds
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tcSpin { 100% { transform: rotate(360deg); } }
        @keyframes tcProgressFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
