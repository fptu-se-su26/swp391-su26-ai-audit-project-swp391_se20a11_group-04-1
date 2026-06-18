import React from 'react'

export default function KeyValueEditor({ items, onChange }) {
  const handleUpdate = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  const handleAdd = () => {
    onChange([...items, { key: '', value: '' }])
  }

  const handleRemove = (index) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    if (newItems.length === 0) {
      newItems.push({ key: '', value: '' })
    }
    onChange(newItems)
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center group">
          <input
            type="text"
            value={item.key}
            onChange={(e) => handleUpdate(idx, 'key', e.target.value)}
            placeholder="Key"
            className="w-1/3 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <button
            onClick={() => handleRemove(idx)}
            className="p-1.5 text-error opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-error-container hover:text-on-error-container"
            title="Remove row"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="self-start px-2 py-1.5 mt-1 text-sm font-medium text-primary hover:bg-primary-container/30 rounded transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        Add Row
      </button>
    </div>
  )
}
