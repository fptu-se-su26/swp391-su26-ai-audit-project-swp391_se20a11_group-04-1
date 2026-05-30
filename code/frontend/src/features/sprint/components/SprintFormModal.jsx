import { useEffect, useState } from 'react'

const emptyForm = {
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED',
  capacityHours: '',
}

const SprintFormModal = ({ open, sprint, onClose, onSubmit, saving }) => {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(sprint ? {
      name: sprint.name || '',
      goal: sprint.goal || '',
      startDate: sprint.startDate || '',
      endDate: sprint.endDate || '',
      status: sprint.status || 'PLANNED',
      capacityHours: sprint.capacityHours ?? '',
    } : emptyForm)
  }, [open, sprint])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      capacityHours: form.capacityHours === '' ? null : Number(form.capacityHours),
    })
  }

  return (
    <div className="fixed inset-0 z-[80] bg-on-surface/45 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <form
        className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="px-6 py-5 border-b border-outline-variant flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">Sprint Planning</p>
            <h2 className="text-xl font-black text-on-surface">{sprint ? 'Edit Sprint' : 'Create Sprint'}</h2>
          </div>
          <button type="button" className="p-2 rounded-lg hover:bg-surface-container-high" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="md:col-span-2">
            <span className="text-xs font-bold uppercase text-on-surface-variant">Name</span>
            <input
              className="mt-1 w-full rounded-lg border-outline-variant bg-surface"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase text-on-surface-variant">Start Date</span>
            <input
              className="mt-1 w-full rounded-lg border-outline-variant bg-surface"
              type="date"
              value={form.startDate}
              onChange={(event) => update('startDate', event.target.value)}
              required
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase text-on-surface-variant">End Date</span>
            <input
              className="mt-1 w-full rounded-lg border-outline-variant bg-surface"
              type="date"
              value={form.endDate}
              onChange={(event) => update('endDate', event.target.value)}
              required
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase text-on-surface-variant">Status</span>
            <select className="mt-1 w-full rounded-lg border-outline-variant bg-surface" value={form.status} onChange={(event) => update('status', event.target.value)}>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase text-on-surface-variant">Capacity Hours</span>
            <input
              className="mt-1 w-full rounded-lg border-outline-variant bg-surface"
              type="number"
              min="0"
              step="0.5"
              value={form.capacityHours}
              onChange={(event) => update('capacityHours', event.target.value)}
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-bold uppercase text-on-surface-variant">Goal</span>
            <textarea
              className="mt-1 w-full rounded-lg border-outline-variant bg-surface min-h-28"
              value={form.goal}
              onChange={(event) => update('goal', event.target.value)}
              placeholder="Sprint outcome, scope, and focus"
            />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
          <button type="button" className="px-4 py-2 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high font-bold" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-black disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Sprint'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SprintFormModal
