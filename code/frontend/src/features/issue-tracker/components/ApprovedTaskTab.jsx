import { useState } from 'react'
import { AlertCircle, CheckCircle2, CheckSquare, CircleDot, Plus, Square, Trash2 } from 'lucide-react'

const priorityConfig = {
  high: { label: 'Cao', color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100/50' },
  medium: { label: 'Vừa', color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100/50' },
  low: { label: 'Thấp', color: 'text-slate-500 bg-slate-50 border-slate-100' },
}

function normalizePriority(priority) {
  const value = String(priority || '').toLowerCase()
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

export function ApprovedTaskTab({
  checklist = [],
  onToggleCheck,
  onRemoveItem,
  onAddItem,
  adding = false,
}) {
  const [newItem, setNewItem] = useState('')

  async function handleAddItem(event) {
    event?.preventDefault()
    if (!newItem.trim() || adding) return
    await onAddItem(newItem.trim())
    setNewItem('')
  }

  if (!checklist.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <CircleDot size={40} className="mb-3 opacity-40 text-[#0ea5e9]" />
        <p className="text-sm font-semibold">Chưa có task nào được thông qua.</p>
        <p className="text-xs mt-1 text-slate-400 font-medium">
          Leader duyệt đề xuất để tạo checklist thực thi chính thức.
        </p>
      </div>
    )
  }

  const done = checklist.filter((item) => item.done).length
  const total = checklist.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const allDone = done === total && total > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs text-slate-500 font-bold px-1 uppercase tracking-wider">
        Task được thông qua ({total})
      </div>

      <div className={`rounded-xl border transition-all ${allDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                Checklist
              </span>
              <p className="mt-2 text-sm text-slate-800 font-semibold leading-snug">
                Danh sách các yêu cầu đã được chốt để triển khai
              </p>
            </div>
            {allDone && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0 font-semibold">
                <CheckCircle2 size={12} /> Hoàn thành
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0 font-semibold">
              {done}/{total} ({pct}%)
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1.5">
            {checklist.map((item) => {
              const text = item.content || item.text || ''
              const priority = normalizePriority(item.priority)

              return (
                <div
                  key={item.id || text}
                  className={`flex items-center gap-2 group px-3 py-2 rounded-lg transition-colors ${
                    item.done ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleCheck(item.id)}
                    className={`shrink-0 transition-colors cursor-pointer ${
                      item.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'
                    }`}
                  >
                    {item.done ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>

                  <span className={`flex-1 text-sm leading-snug ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {text}
                  </span>

                  <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityConfig[priority].color}`}>
                    {priorityConfig[priority].label}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity cursor-pointer p-1"
                  >
                    <Trash2 size={13} />
                  </button>

                  {!item.done && (
                    <AlertCircle
                      size={13}
                      className={`shrink-0 opacity-60 group-hover:opacity-0 transition-opacity ${
                        priority === 'high' ? 'text-red-400' : priority === 'medium' ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              placeholder="Thêm checklist item mới..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newItem.trim() || adding}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ApprovedTaskTab
