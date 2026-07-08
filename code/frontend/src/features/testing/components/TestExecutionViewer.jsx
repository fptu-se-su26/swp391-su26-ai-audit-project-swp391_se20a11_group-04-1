import {
  Play, CheckCircle, XCircle, Loader, AlertTriangle,
  Save, MonitorPlay, Image, ChevronLeft, ChevronRight,
  X, Copy, Check, Zap
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import AiAnalyzeButton from './AiAnalyzeButton';

/* ─── Utility ────────────────────────────────────────────────────── */
export function getScreenshotForStep(stepIndex, screenshots) {
  if (!screenshots || screenshots.length === 0) return null;
  const rx = new RegExp(`step-${stepIndex + 1}-after(?:[^0-9]|$)`);
  return screenshots.find(ss => ss.filename && rx.test(ss.filename)) || null;
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS = {
  IDLE: { dot: '#8e8e93', bg: 'rgba(142,142,147,0.12)', text: '#6e6e73', label: 'Ready' },
  RUNNING: { dot: '#007aff', bg: 'rgba(0,122,255,0.10)', text: '#0071e3', label: 'Running' },
  PASS: { dot: '#34c759', bg: 'rgba(52,199,89,0.10)', text: '#248a3d', label: 'Passed' },
  FAIL: { dot: '#ff3b30', bg: 'rgba(255,59,48,0.10)', text: '#c0392b', label: 'Failed' },
  ERROR: { dot: '#ff3b30', bg: 'rgba(255,59,48,0.10)', text: '#c0392b', label: 'Error' },
  CANCELLED: { dot: '#ff9500', bg: 'rgba(255,149,0,0.10)', text: '#b25000', label: 'Cancelled' },
};

/* ─── StatusChip ─────────────────────────────────────────────────── */
export function StatusChip({ status, durationMs }) {
  const cfg = STATUS[status] || STATUS.IDLE;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all"
      style={{ background: cfg.bg, border: `1px solid ${cfg.dot}28` }}>
      <span className="relative flex h-[7px] w-[7px] shrink-0">
        {status === 'RUNNING' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: cfg.dot }} />
        )}
        <span className="relative inline-flex rounded-full h-[7px] w-[7px]"
          style={{ background: cfg.dot }} />
      </span>
      <span className="text-[11px] font-semibold tracking-wide" style={{ color: cfg.text }}>
        {cfg.label}{durationMs && !['IDLE', 'RUNNING'].includes(status) ? ` · ${durationMs}ms` : ''}
      </span>
    </div>
  );
}

/* ─── StepTile ───────────────────────────────────────────────────── */
function StepTile({ step, index, stepStatus, isFocused, isFinished, isRunning,
  error, screenshots, totalSteps, onFocus, onViewScreenshot }) {
  const isActive = stepStatus === 'RUNNING';
  const isPass = stepStatus === 'PASS';
  const isFail = stepStatus === 'FAIL';
  const ss = isFinished ? getScreenshotForStep(index, screenshots) : null;
  const ssIdx = ss && screenshots ? screenshots.indexOf(ss) : -1;
  const isLast = index === totalSteps - 1;

  let tileBg = 'rgba(255,255,255,0.50)', tileBorder = 'rgba(255,255,255,0.45)';
  let tileShadow = '0 2px 8px rgba(0,0,0,0.04)';
  let numBg = '#f2f2f7', numColor = '#8e8e93', textColor = '#3a3a3c', leftBar = 'transparent';

  if (isActive) {
    tileBg = 'rgba(0,122,255,0.08)'; tileBorder = 'rgba(0,122,255,0.25)';
    tileShadow = '0 0 0 3px rgba(0,122,255,0.12), 0 4px 16px rgba(0,122,255,0.1)';
    numBg = '#007aff'; numColor = '#fff'; textColor = '#0071e3'; leftBar = '#007aff';
  } else if (isPass) {
    tileBg = 'rgba(52,199,89,0.07)'; tileBorder = 'rgba(52,199,89,0.20)';
    numBg = '#34c759'; numColor = '#fff'; textColor = '#1a1a1a'; leftBar = '#34c759';
  } else if (isFail) {
    tileBg = 'rgba(255,59,48,0.07)'; tileBorder = 'rgba(255,59,48,0.22)';
    tileShadow = '0 0 0 2px rgba(255,59,48,0.10), 0 4px 16px rgba(255,59,48,0.08)';
    numBg = '#ff3b30'; numColor = '#fff'; textColor = '#c0392b'; leftBar = '#ff3b30';
  }
  if (isFocused && !isActive) {
    tileBorder = 'rgba(79,124,255,0.50)';
    tileShadow = '0 0 0 3px rgba(79,124,255,0.14), ' + tileShadow;
  }

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-[18px] top-[40px] w-[2px] bottom-0 z-0"
          style={{ background: isPass ? 'rgba(52,199,89,0.25)' : 'rgba(0,0,0,0.06)', height: 'calc(100% - 8px)' }} />
      )}
      <div
        onClick={() => !isRunning && isFinished && onFocus(index)}
        className="group relative z-10 flex items-start gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200"
        style={{
          background: tileBg, border: `1px solid ${tileBorder}`, boxShadow: tileShadow,
          cursor: !isRunning && isFinished ? 'pointer' : 'default',
          transform: isFocused ? 'translateY(-1px) scale(1.005)' : undefined,
          transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          borderLeft: leftBar !== 'transparent' ? `3px solid ${leftBar}` : undefined,
        }}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold"
          style={{
            background: numBg, color: numColor, transition: 'all 0.2s',
            boxShadow: isActive ? '0 0 0 4px rgba(0,122,255,0.15)' : undefined
          }}>
          {isActive ? <Loader size={11} className="animate-spin" /> :
            isPass ? <CheckCircle size={11} /> :
              isFail ? <XCircle size={11} /> : (index + 1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium leading-snug" style={{ color: textColor }}>
            {step.description || step.action}
          </div>
          {step.action && (
            <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#aeaeb2' }}>
              {step.action}{step.selector ? ` · ${step.selector}` : ''}
            </div>
          )}
        </div>
        {isFinished && ss && (
          <button
            onClick={e => { e.stopPropagation(); onViewScreenshot(ssIdx >= 0 ? ssIdx : 0); }}
            className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
            style={{ background: 'rgba(79,124,255,0.12)', color: '#4f7cff' }}
            title="View screenshot"
          >
            <Image size={11} />
          </button>
        )}
      </div>
      {isFail && error && (
        <div className="ml-9 mt-1.5 mb-1 px-3 py-2.5 rounded-xl text-[11px] font-mono leading-relaxed"
          style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)', color: '#c0392b' }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#ff3b30' }}>Error Details</div>
          <div style={{ color: '#6d2b28' }}>{error.message}</div>
          <div className="mt-2 font-sans font-semibold text-[10px] italic" style={{ color: '#ff3b30' }}>
            Execution stopped at Step {index + 1}.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AgentCommandCard ───────────────────────────────────────────── */
function AgentCommandCard({ agentToken }) {
  const [copied, setCopied] = useState(false);
  const cmd = `npx devtrack-agent@latest --token=${agentToken}`;
  const handleCopy = () => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="mx-5 mt-3 px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.22)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#ff9500' }} />
          <span className="text-[11px] font-semibold" style={{ color: '#b25000' }}>Localhost Agent Required</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: 'rgba(255,149,0,0.12)', color: '#b25000', border: '1px solid rgba(255,149,0,0.20)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff9500' }} />
          Waiting for connection
        </div>
      </div>
      <p className="text-[11px] mb-3" style={{ color: '#6e6e73' }}>
        This URL is localhost. Run the DevTrack Local Agent on your machine to execute tests.
      </p>
      {agentToken ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <code className="flex-1 text-[11px] font-mono overflow-x-auto whitespace-nowrap" style={{ color: '#1c7c41' }}>{cmd}</code>
          <button onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: copied ? 'rgba(52,199,89,0.12)' : 'rgba(0,0,0,0.06)',
              border: copied ? '1px solid rgba(52,199,89,0.30)' : '1px solid rgba(0,0,0,0.08)',
              color: copied ? '#248a3d' : '#3a3a3c',
            }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
      ) : (
        <p className="text-[11px] animate-pulse" style={{ color: '#ff9500' }}>Fetching agent token…</p>
      )}
    </div>
  );
}

/* ─── ResultBanner ───────────────────────────────────────────────── */
function ResultBanner({ status, error, lastRunningStepIndex, stepsArr, runId, isRunning }) {
  if (isRunning || status === 'IDLE') return null;
  if (status === 'PASS') return (
    <div className="mt-3 px-4 py-3 rounded-2xl flex items-center gap-3"
      style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.22)' }}>
      <CheckCircle size={18} style={{ color: '#34c759' }} />
      <div>
        <div className="text-[13px] font-semibold" style={{ color: '#248a3d' }}>All Steps Passed</div>
        <div className="text-[11px] mt-0.5" style={{ color: '#6e6e73' }}>Test case completed successfully.</div>
      </div>
    </div>
  );
  const effectiveFailed = (error?.failedStepIndex !== undefined && error?.failedStepIndex !== null)
    ? error.failedStepIndex : lastRunningStepIndex;
  if (status === 'FAIL' || status === 'ERROR') {
    const failObj = effectiveFailed !== null ? stepsArr?.[effectiveFailed] : null;
    return (
      <div className="mt-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.20)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle size={18} style={{ color: '#ff3b30' }} />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: '#c0392b' }}>Test Case Failed</div>
              {failObj && <div className="text-[11px] mt-0.5" style={{ color: '#6e6e73' }}>At: {failObj.description || failObj.action}</div>}
            </div>
          </div>
          {runId && <AiAnalyzeButton testRunId={runId} />}
        </div>
      </div>
    );
  }
  if (status === 'CANCELLED') return (
    <div className="mt-3 px-3 py-2.5 rounded-2xl flex items-center gap-3"
      style={{ background: 'rgba(255,149,0,0.09)', border: '1px solid rgba(255,149,0,0.20)' }}>
      <AlertTriangle size={15} style={{ color: '#ff9500' }} />
      <span className="text-[12px] font-medium" style={{ color: '#b25000' }}>Test was cancelled.</span>
    </div>
  );
  return null;
}

/* ─── macOS BrowserChrome ────────────────────────────────────────── */
function BrowserChrome({ url, isRunning, children }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden"
      style={{
        borderRadius: 18,
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 2px 12px rgba(99,102,241,0.06), 0 1px 0 rgba(255,255,255,0.95) inset',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
        transform: isRunning ? 'scale(1.002)' : 'scale(1)',
      }}>
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ background: 'rgba(255,255,255,0.60)', borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
        <div className="flex gap-[6px]">
          {[['#ff5f57'], ['#febc2e'], ['#28c840']].map(([c], i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-[5px] rounded-[10px]"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04) inset'
          }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: '#34c759', flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="flex-1 text-[11px] font-medium truncate"
            style={{ color: '#3a3a3c', fontFamily: 'SF Mono, ui-monospace, monospace' }}>
            {url || 'about:blank'}
          </span>
          {isRunning && (
            <span className="w-3 h-3 rounded-full animate-pulse shrink-0"
              style={{ background: '#007aff20', border: '1px solid #007aff40' }} />
          )}
        </div>
        <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
          style={{ background: 'rgba(79,124,255,0.10)', color: '#4f7cff', border: '1px solid rgba(79,124,255,0.18)' }}>
          Playwright
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function TestExecutionViewer({
  projectId, testCase, stepsArr, screenshots, error, status, durationMs,
  bugReportId, isSaved, focusedStepIndex, onFocusStep,
  currentStepIndex, lastRunningStepIndex, liveFrame, browserBarUrl,
  isReadOnly = false, onStartRun, onReset, onSaveRun,
  isRunning, runId, agentToken, isLocalUrl
}) {
  const [selectedSsIdx, setSelectedSsIdx] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [leftPct, setLeftPct] = useState(33);
  const containerRef = useRef(null);

  useEffect(() => {
    const fn = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (selectedSsIdx === null || !screenshots) return;
    const fn = (e) => {
      if (e.key === 'ArrowRight') setSelectedSsIdx(p => Math.min(p + 1, screenshots.length - 1));
      else if (e.key === 'ArrowLeft') setSelectedSsIdx(p => Math.max(p - 1, 0));
      else if (e.key === 'Escape') { e.stopPropagation(); setSelectedSsIdx(null); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [selectedSsIdx, screenshots]);

  const handleDrag = (e) => {
    if (e.buttons !== 1) return;
    const c = containerRef.current;
    if (!c) return;
    const p = ((e.clientX - c.getBoundingClientRect().left) / c.offsetWidth) * 100;
    if (p > 20 && p < 55) setLeftPct(p);
  };

  const isFinished = !isRunning && status !== 'IDLE';
  const latestSs = screenshots?.length > 0 ? screenshots[screenshots.length - 1] : null;
  const isWide = windowWidth >= 1024;
  const effectiveFailedIdx = (error?.failedStepIndex !== undefined && error?.failedStepIndex !== null)
    ? error.failedStepIndex : (status === 'FAIL' ? lastRunningStepIndex : null);

  return (
    <div className="relative w-full flex flex-col overflow-hidden"
      style={{
        height: '85vh', minHeight: 560, borderRadius: 28,
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 2px 16px rgba(99,102,241,0.07), 0 1px 0 rgba(255,255,255,0.95) inset',
      }}>

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.18) 0%, transparent 70%)', filter: 'blur(24px)' }} />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(124,77,255,0.14) 0%, transparent 70%)', filter: 'blur(24px)' }} />
      </div>

      {/* ── Header toolbar ── */}
      <div className="relative flex items-center gap-4 px-5 py-3 shrink-0"
        style={{ background: 'rgba(255,255,255,0.60)', borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
        <div className="flex gap-[6px]">
          {[['#ff5f57'], ['#febc2e'], ['#28c840']].map(([c], i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[13px] font-semibold" style={{ color: '#3a3a3c' }}>
            {isReadOnly ? 'Historical Execution Viewer' : 'Playwright Live Execution'}
          </span>
        </div>
        <StatusChip status={status} durationMs={durationMs} />
      </div>

      {/* Localhost agent banner */}
      {isLocalUrl && !isReadOnly && <AgentCommandCard agentToken={agentToken} />}

      {/* ── Main split layout ── */}
      <div ref={containerRef}
        className="flex flex-1 min-h-0 gap-0 relative overflow-hidden"
        style={{ flexDirection: isWide ? 'row' : 'column' }}
        onMouseMove={handleDrag}
      >

        {/* ══ LEFT: Steps panel ══ */}
        <div className="flex flex-col overflow-hidden"
          style={{ width: isWide ? `${leftPct}%` : '100%', minWidth: 220 }}>

          {/* Panel header */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <CheckCircle size={13} style={{ color: '#aeaeb2' }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#aeaeb2' }}>Steps</span>
            {stepsArr?.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#8e8e93' }}>
                {stepsArr.length}
              </span>
            )}
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.08) transparent' }}>

            {(!stepsArr || stepsArr.length === 0) && !isRunning && (
              <div className="py-10 text-center text-[12px]" style={{ color: '#aeaeb2' }}>
                Click Run to begin…
              </div>
            )}

            {(stepsArr || []).map((step, i) => {
              let stepStatus = step.status || null;
              if (!stepStatus) {
                if (status === 'RUNNING') {
                  if (currentStepIndex !== null) {
                    if (i < currentStepIndex) stepStatus = 'PASS';
                    else if (i === currentStepIndex) stepStatus = 'RUNNING';
                  }
                } else if (status === 'PASS') {
                  stepStatus = 'PASS';
                } else if (status === 'FAIL' || status === 'ERROR') {
                  if (effectiveFailedIdx !== null) {
                    if (i < effectiveFailedIdx) stepStatus = 'PASS';
                    else if (i === effectiveFailedIdx) stepStatus = 'FAIL';
                  } else if (i === 0) stepStatus = 'FAIL';
                }
              }
              
              const stepError = step.error ? { message: step.error } : (stepStatus === 'FAIL' ? error : null);

              return (
                <StepTile
                  key={i}
                  step={step}
                  index={i}
                  stepStatus={stepStatus}
                  isFocused={focusedStepIndex === i}
                  isFinished={isFinished}
                  isRunning={isRunning}
                  error={stepError}
                  screenshots={screenshots}
                  totalSteps={(stepsArr || []).length}
                  onFocus={onFocusStep}
                  onViewScreenshot={setSelectedSsIdx}
                />
              );
            })}

            {/* Non-step error */}
            {error && !isRunning &&
              (error.failedStepIndex === undefined || error.failedStepIndex === null) &&
              lastRunningStepIndex === null && (
                <div className="mt-2 px-3 py-2.5 rounded-2xl text-[11px] font-mono"
                  style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.18)', color: '#c0392b' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={12} style={{ color: '#ff3b30' }} />
                    <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: '#ff3b30' }}>Execution Error</span>
                    {runId && <div className="ml-auto"><AiAnalyzeButton testRunId={runId} /></div>}
                  </div>
                  <div className="whitespace-pre-wrap">{error.message}</div>
                </div>
              )}

            {/* Bug hint */}
            {bugReportId && (
              <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-2xl text-[11px]"
                style={{ background: 'rgba(255,149,0,0.09)', border: '1px solid rgba(255,149,0,0.20)', color: '#b25000' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={11} style={{ color: '#ff9500' }} />
                  Auto-created Bug Report #{bugReportId}
                </div>
                {projectId && (
                  <Link to={`/projects/${projectId}/bugs/${bugReportId}`}
                    className="hover:underline font-semibold"
                    style={{ color: '#b25000' }}>
                    View Bug Report
                  </Link>
                )}
              </div>
            )}

            <ResultBanner
              status={status} error={error}
              lastRunningStepIndex={lastRunningStepIndex}
              stepsArr={stepsArr} runId={runId} isRunning={isRunning}
            />
          </div>
        </div>

        {/* Drag divider */}
        <div className="hidden lg:flex w-3 cursor-col-resize items-center justify-center shrink-0 group z-10">
          <div className="h-10 w-[3px] rounded-full transition-all duration-200 group-hover:h-20"
            style={{ background: 'rgba(0,0,0,0.10)' }} />
        </div>

        {/* ══ RIGHT: Browser preview ══ */}
        <div className="flex flex-col p-4 gap-3 min-h-0 overflow-hidden"
          style={{ width: isWide ? `${100 - leftPct}%` : '100%' }}>

          <div className="flex items-center gap-2 shrink-0">
            <MonitorPlay size={12} style={{ color: '#aeaeb2' }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#aeaeb2' }}>Browser Preview</span>
          </div>

          <BrowserChrome url={browserBarUrl} isRunning={isRunning}>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {(() => {
                if (isRunning && liveFrame) return (
                  <img src={`data:image/jpeg;base64,${liveFrame}`} alt="Live stream"
                    className="max-w-full max-h-full object-contain rounded-xl"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)', transition: 'opacity 0.075s' }} />
                );
                if (isRunning) return (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ background: 'rgba(0,122,255,0.3)' }} />
                      <div className="relative w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.25)' }}>
                        <Loader size={20} className="animate-spin" style={{ color: '#007aff' }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-center" style={{ color: '#3a3a3c' }}>Launching Chromium</p>
                      <p className="text-[11px] text-center mt-0.5" style={{ color: '#aeaeb2' }}>Setting up browser environment…</p>
                    </div>
                  </div>
                );
                if (status === 'IDLE') return (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <MonitorPlay size={28} style={{ color: '#c7c7cc' }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-center" style={{ color: '#8e8e93' }}>
                        {isReadOnly ? 'No execution data' : 'Ready to run'}
                      </p>
                      {!isReadOnly && (
                        <p className="text-[11px] text-center mt-0.5" style={{ color: '#c7c7cc' }}>
                          Click Run Test to start execution
                        </p>
                      )}
                    </div>
                  </div>
                );
                if (focusedStepIndex !== null) {
                  const fss = getScreenshotForStep(focusedStepIndex, screenshots);
                  if (fss) return (
                    <img src={fss.url} alt={fss.filename}
                      className="max-w-full max-h-full object-contain rounded-xl"
                      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)', transition: 'opacity 0.25s' }} />
                  );
                  return (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <MonitorPlay size={22} style={{ color: '#c7c7cc' }} />
                      </div>
                      <p className="text-[12px]" style={{ color: '#aeaeb2' }}>No screenshot for this step</p>
                    </div>
                  );
                }
                if (latestSs) return (
                  <img src={latestSs.url} alt={latestSs.filename}
                    className="max-w-full max-h-full object-contain rounded-xl"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)', transition: 'opacity 0.25s' }} />
                );
                return (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={28} style={{ color: '#c7c7cc' }} />
                    <p className="text-[12px] font-medium" style={{ color: '#aeaeb2' }}>Execution complete</p>
                  </div>
                );
              })()}
            </div>
          </BrowserChrome>

          {/* Thumbnail strip */}
          {screenshots?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 shrink-0"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}>
              {screenshots.map((ss, i) => (
                <img key={i} src={ss.url} alt={ss.filename}
                  onClick={() => setSelectedSsIdx(i)}
                  className="h-11 w-auto rounded-xl object-cover cursor-pointer transition-all duration-150"
                  style={{
                    border: selectedSsIdx === i ? '2px solid #4f7cff' : '1px solid rgba(0,0,0,0.10)',
                    opacity: selectedSsIdx === i ? 1 : 0.6,
                    boxShadow: selectedSsIdx === i ? '0 0 0 3px rgba(79,124,255,0.20)' : 'none',
                    transform: selectedSsIdx === i ? 'scale(1.05)' : 'scale(1)',
                  }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className="relative flex items-center gap-2.5 px-5 py-3 shrink-0"
        style={{ background: 'rgba(255,255,255,0.60)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <StatusChip status={status} durationMs={durationMs} />
        <div className="flex-1" />

        {/* Reset */}
        {!isReadOnly && status !== 'IDLE' && (
          <button onClick={onReset}
            className="px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150"
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', color: '#6e6e73' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; e.currentTarget.style.color = '#3a3a3c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#6e6e73'; }}>
            Reset
          </button>
        )}

        {/* Save result */}
        {!isReadOnly && ['PASS', 'FAIL'].includes(status) && !isSaved && (
          <button onClick={onSaveRun}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150"
            style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.25)', color: '#248a3d' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,199,89,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,199,89,0.10)'; }}>
            <Save size={12} /> Save Result
          </button>
        )}

        {!isReadOnly && isSaved && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-medium"
            style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.20)', color: '#248a3d' }}>
            <CheckCircle size={12} /> Saved
          </div>
        )}

        {/* Run Test button */}
        {!isReadOnly && (
          <button
            onClick={onStartRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200"
            style={isRunning ? {
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: '#aeaeb2',
              cursor: 'not-allowed',
            } : {
              background: 'linear-gradient(135deg, #4f7cff 0%, #7c4dff 100%)',
              border: '1px solid rgba(79,124,255,0.40)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(79,124,255,0.30), 0 1px 0 rgba(255,255,255,0.25) inset',
            }}
            onMouseEnter={e => { if (!isRunning) { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,124,255,0.40), 0 1px 0 rgba(255,255,255,0.25) inset'; } }}
            onMouseLeave={e => { if (!isRunning) { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,124,255,0.30), 0 1px 0 rgba(255,255,255,0.25) inset'; } }}
          >
            {isRunning
              ? <><Loader size={13} className="animate-spin" /> Running…</>
              : <><Zap size={13} /> Run Test</>}
          </button>
        )}
      </div>

      {/* ── Screenshot lightbox ── */}
      {selectedSsIdx !== null && screenshots && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">

            <button onClick={() => setSelectedSsIdx(null)}
              className="absolute top-0 right-0 p-2 rounded-full z-10 transition-all"
              style={{
                background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.08)',
                color: '#3a3a3c', boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}>
              <X size={20} />
            </button>

            {selectedSsIdx > 0 && (
              <button onClick={() => setSelectedSsIdx(p => p - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full z-10 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.08)',
                  color: '#3a3a3c', boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; }}>
                <ChevronLeft size={28} />
              </button>
            )}

            {selectedSsIdx < screenshots.length - 1 && (
              <button onClick={() => setSelectedSsIdx(p => p + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full z-10 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.08)',
                  color: '#3a3a3c', boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.75)'; }}>
                <ChevronRight size={28} />
              </button>
            )}

            <img src={screenshots[selectedSsIdx].url} alt={screenshots[selectedSsIdx].filename}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.25)' }} />

            <div className="absolute bottom-4 px-4 py-1.5 rounded-full text-[12px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(0,0,0,0.08)',
                color: '#3a3a3c', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
              }}>
              {screenshots[selectedSsIdx].filename} · {selectedSsIdx + 1} / {screenshots.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
