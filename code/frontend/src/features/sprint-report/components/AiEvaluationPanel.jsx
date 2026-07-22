import React, { useMemo, useState } from 'react'

const SECTION_META = {
  'Performance Summary': { icon: 'bar_chart', color: 'text-blue-600' },
  Strengths: { icon: 'thumb_up', color: 'text-emerald-600' },
  'Areas for Improvement': { icon: 'edit_note', color: 'text-amber-600' },
  'Potential Risks': { icon: 'warning', color: 'text-rose-600' },
}

const renderInlineMarkdown = (value) => {
  const parts = String(value || '').split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('***') && part.endsWith('***')) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(3, -3)}
        </strong>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }

    return part
  })
}

export default function AiEvaluationPanel({ text, onChange, editable = false }) {
  const [isEditing, setIsEditing] = useState(false)

  const sections = useMemo(() => {
    const result = []
    const lines = (text || '').split('\n')
    let current = null

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (current) result.push(current)
        current = { title: line.replace(/^#{2,3}\s+/, '').trim(), lines: [] }
      } else if (current) {
        current.lines.push(line)
      }
    }

    if (current) result.push(current)
    return result
  }, [text])

  if (editable && isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="h-48 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-700 shadow-inner outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-primary hover:underline">
          Back to preview
        </button>
      </div>
    )
  }

  if (sections.length === 0) {
    const lines = (text || '').split('\n').map((line) => line.trim()).filter(Boolean)
    return (
      <div className="space-y-2 rounded-lg border border-[#D9E7E4] bg-white p-3">
        {(lines.length ? lines : [text]).map((line, index) => {
          const isBullet = line.startsWith('- ')
          const content = isBullet ? line.slice(2) : line

          return (
            <p key={index} className="text-[13px] leading-6 text-slate-700">
              {isBullet && <span className="mr-2 text-[#1E707D]">&bull;</span>}
              {renderInlineMarkdown(content)}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {sections.map((section) => {
          const meta = SECTION_META[section.title] || { icon: 'info', color: 'text-slate-600' }
          const bodyLines = section.lines.filter((line) => line.trim())

          return (
            <div key={section.title} className="rounded-lg border border-[#D9E7E4] bg-white p-3">
              <h4 className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>
                <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                {section.title}
              </h4>
              <ul className="space-y-1.5">
                {bodyLines.map((line, index) => {
                  const isBullet = line.startsWith('- ')
                  const content = isBullet ? line.slice(2) : line

                  return (
                    <li key={index} className="text-[13px] leading-relaxed text-slate-700">
                      {isBullet ? (
                        <span className="flex gap-2">
                          <span className={`mt-0.5 shrink-0 ${meta.color}`}>&bull;</span>
                          <span>{renderInlineMarkdown(content)}</span>
                        </span>
                      ) : (
                        <span>{renderInlineMarkdown(content)}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
      {editable && (
        <button onClick={() => setIsEditing(true)} className="mt-2 text-xs font-bold text-slate-500 hover:text-primary hover:underline">
          Edit before pinging
        </button>
      )}
    </div>
  )
}
