import { useState } from 'react'
import Card from '../../../components/ui/Card'
import { SELECTOR_ACTIONS } from '../utils/uiStepUtils'

// ── Design tokens (mirrored from TestCaseDetailPage) ──────────
const C = {
  primary:      '#1E707D',
  primaryLight: '#D7EEF1',
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  border:       '#D9E7E4',
  borderLight:  '#EBF5F7',
  textPri:      '#1F2937',
  textSec:      '#6B7280',
  textMuted:    '#9CA3AF',
  danger:       '#EF4444',
}

const ICON_BG = 'linear-gradient(135deg, #2b99a8, #1e707d)'

/**
 * TestExecutionStepsCard
 *
 * Renders the bounded, vertically-scrollable Test Execution Steps table.
 * Height is constrained to clamp(320px, 46vh, 520px) by default and can
 * be toggled to min(72vh, 760px) via the Expand button.
 *
 * Props:
 *   testCase  – the full test case object (used only for testCase.type)
 *   steps     – normalizeUiSteps result (already prepared by the parent)
 */
export default function TestExecutionStepsCard({ testCase, steps }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const stepsToRender = steps || []
  const stepCount = stepsToRender.length

  const viewportHeight = isExpanded
    ? 'min(72vh, 760px)'
    : 'clamp(320px, 46vh, 520px)'

  return (
    <Card>
      {/* ── Section header ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '18px',
        flexWrap:       'wrap',
        gap:            '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon */}
          <div style={{
            width:          '32px',
            height:         '32px',
            borderRadius:   '10px',
            background:     ICON_BG,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      '0 4px 10px rgba(30,112,125,0.25)',
          }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', color: '#fff', fontVariationSettings: "'FILL' 1" }}
            >
              format_list_numbered
            </span>
          </div>

          {/* Title */}
          <span style={{ fontSize: '15px', fontWeight: 700, color: C.textPri }}>
            Test Execution Steps
          </span>

          {/* Step count badge */}
          {stepCount > 0 && (
            <span style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              padding:         '2px 9px',
              borderRadius:    '99px',
              background:      C.primaryLight,
              color:           C.primary,
              fontSize:        '11px',
              fontWeight:      700,
              letterSpacing:   '0.03em',
              lineHeight:      1.5,
            }}>
              {stepCount} {stepCount === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>

        {/* Expand / Collapse toggle — only shown when there are steps */}
        {stepCount > 0 && (
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '5px',
              padding:         '5px 12px',
              borderRadius:    '10px',
              border:          `1px solid ${C.border}`,
              background:      C.bg,
              color:           C.textSec,
              fontSize:        '12px',
              fontWeight:      600,
              cursor:          'pointer',
              transition:      'background 150ms, color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.primaryLight
              e.currentTarget.style.color = C.primary
              e.currentTarget.style.borderColor = C.primary
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = C.bg
              e.currentTarget.style.color = C.textSec
              e.currentTarget.style.borderColor = C.border
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '15px' }}
            >
              {isExpanded ? 'unfold_less' : 'unfold_more'}
            </span>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* ── Scrollable viewport ── */}
      <div style={{
        maxHeight:          viewportHeight,
        overflowY:          'auto',
        overflowX:          'auto',
        overscrollBehavior: 'contain',
        scrollbarGutter:    'stable',
        borderRadius:       '12px',
        border:             `1px solid ${C.border}`,
        /* Subtle bottom shadow to reinforce the scroll container */
        boxShadow:          'inset 0 -6px 8px -6px rgba(0,0,0,0.06)',
        transition:         'max-height 280ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <table style={{
          width:           '100%',
          borderCollapse:  'separate',
          borderSpacing:   0,
          fontSize:        '13px',
        }}>
          <thead>
            <tr>
              <th style={{
                position:       'sticky',
                top:            0,
                zIndex:         2,
                background:     C.bg,
                padding:        '10px 16px',
                textAlign:      'left',
                fontSize:       '10px',
                fontWeight:     700,
                color:          C.textMuted,
                textTransform:  'uppercase',
                letterSpacing:  '0.08em',
                width:          '60px',
                /* Crisp bottom line that content rows slide under */
                borderBottom:   `1px solid ${C.border}`,
                /* Prevent content rows from peeking above on some browsers */
                boxShadow:      '0 1px 0 0 ' + C.border,
              }}>
                Step
              </th>
              <th style={{
                position:       'sticky',
                top:            0,
                zIndex:         2,
                background:     C.bg,
                padding:        '10px 16px',
                textAlign:      'left',
                fontSize:       '10px',
                fontWeight:     700,
                color:          C.textMuted,
                textTransform:  'uppercase',
                letterSpacing:  '0.08em',
                borderBottom:   `1px solid ${C.border}`,
                boxShadow:      '0 1px 0 0 ' + C.border,
              }}>
                Action / Description
              </th>
            </tr>
          </thead>

          <tbody>
            {stepsToRender.length > 0 ? (
              stepsToRender.map((step, idx) => (
                <tr
                  key={step.id || idx}
                  style={{ borderBottom: `1px solid ${C.borderLight}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Step number */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <span style={{
                      display:         'inline-flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      width:           '26px',
                      height:          '26px',
                      borderRadius:    '8px',
                      background:      C.primaryLight,
                      color:           C.primary,
                      fontSize:        '12px',
                      fontWeight:      700,
                      flexShrink:      0,
                    }}>
                      {step.order || step.stepNumber || idx + 1}
                    </span>
                  </td>

                  {/* Step details */}
                  <td style={{
                    padding:        '12px 16px',
                    color:          C.textPri,
                    /* Prevent long selectors / paths from forcing horizontal page growth */
                    maxWidth:       0,       /* trick: allows table-cell to shrink + wrap */
                    overflowWrap:   'anywhere',
                    wordBreak:      'break-word',
                  }}>
                    {testCase.type === 'UI' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Action badge */}
                        <span style={{
                          fontSize:       '10px',
                          fontWeight:     700,
                          color:          C.primary,
                          textTransform:  'uppercase',
                          letterSpacing:  '0.06em',
                          background:     C.primaryLight,
                          padding:        '2px 8px',
                          borderRadius:   '6px',
                          alignSelf:      'flex-start',
                          flexShrink:     0,
                        }}>
                          {step.action}
                        </span>

                        {/* path */}
                        {step.path && (
                          <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            Path:{' '}
                            <code style={{
                              background:   C.bg,
                              padding:      '1px 6px',
                              borderRadius: '4px',
                              fontSize:     '11px',
                              overflowWrap: 'anywhere',
                              wordBreak:    'break-word',
                            }}>
                              {step.path}
                            </code>
                          </span>
                        )}
                        {step.action === 'goto' && !step.path && (
                          <span style={{ color: C.danger, fontSize: '12px', fontWeight: 600 }}>Path: missing</span>
                        )}

                        {/* selector */}
                        {step.selector && (
                          <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            Selector:{' '}
                            <code style={{
                              background:   C.bg,
                              padding:      '1px 6px',
                              borderRadius: '4px',
                              fontSize:     '11px',
                              overflowWrap: 'anywhere',
                              wordBreak:    'break-word',
                            }}>
                              {step.selector}
                            </code>
                          </span>
                        )}
                        {SELECTOR_ACTIONS.has(step.action) && !step.selector && (
                          <span style={{ color: C.danger, fontSize: '12px', fontWeight: 600 }}>Selector: missing</span>
                        )}

                        {/* value */}
                        {step.value && (
                          <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            Value:{' '}
                            <code style={{
                              background:   C.bg,
                              padding:      '1px 6px',
                              borderRadius: '4px',
                              fontSize:     '11px',
                              overflowWrap: 'anywhere',
                              wordBreak:    'break-word',
                            }}>
                              {step.value}
                            </code>
                          </span>
                        )}
                        {['fill', 'select'].includes(step.action) && !step.value && (
                          <span style={{ color: C.danger, fontSize: '12px', fontWeight: 600 }}>Value: missing</span>
                        )}

                        {/* expected */}
                        {step.expected && (
                          <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            Expected:{' '}
                            <code style={{
                              background:   C.bg,
                              padding:      '1px 6px',
                              borderRadius: '4px',
                              fontSize:     '11px',
                              overflowWrap: 'anywhere',
                              wordBreak:    'break-word',
                            }}>
                              {step.expected}
                            </code>
                          </span>
                        )}
                        {['expect_url', 'expect_text'].includes(step.action) && !step.expected && (
                          <span style={{ color: C.danger, fontSize: '12px', fontWeight: 600 }}>Expected: missing</span>
                        )}

                        {/* description */}
                        {step.description && (
                          <span style={{
                            fontSize:     '12px',
                            color:        C.textSec,
                            fontStyle:    'italic',
                            overflowWrap: 'anywhere',
                            wordBreak:    'break-word',
                          }}>
                            {step.description}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* MANUAL test case — plain description */
                      <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {step.description}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{
                  padding:   '24px',
                  textAlign: 'center',
                  color:     C.textMuted,
                  fontSize:  '13px',
                }}>
                  {testCase.type === 'UI'
                    ? 'This test case has no automation steps configured.'
                    : 'No steps defined.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
