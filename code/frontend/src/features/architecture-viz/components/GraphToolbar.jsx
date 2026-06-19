import React, { useState } from 'react'
import { useArchitectureStore } from '../store/architectureStore'
import { useReactFlow } from '@xyflow/react'

export default function GraphToolbar({ onSearch }) {
  const { physicsEnabled, togglePhysics } = useArchitectureStore()
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [searchVal, setSearchVal] = useState('')

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchVal(val)
    if (onSearch) onSearch(val)
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-surface border border-outline-variant/30 rounded-xl shadow-sm w-full">
      <div className="relative flex-1 max-w-xs w-full">
        <span className="material-icons-outlined absolute left-3 top-2.5 text-on-surface-variant/60 text-lg">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm thành phần..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-on-surface-variant/50"
        />
      </div>

      <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
        <button
          onClick={togglePhysics}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
            physicsEnabled
              ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
              : 'bg-surface hover:bg-surface-container-highest text-on-surface border-outline-variant/50'
          }`}
          title="Bật/Tắt chế độ vật lý Obsidian mode"
        >
          <span className="material-icons-outlined text-sm">settings_input_antenna</span>
          <span>Obsidian Physics: {physicsEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <div className="h-6 w-px bg-outline-variant/50 mx-1"></div>

        <button
          onClick={() => zoomIn()}
          className="p-2 bg-surface hover:bg-surface-container-highest border border-outline-variant/50 rounded-lg text-on-surface transition-colors"
          title="Phóng to"
        >
          <span className="material-icons-outlined text-sm">add</span>
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-2 bg-surface hover:bg-surface-container-highest border border-outline-variant/50 rounded-lg text-on-surface transition-colors"
          title="Thu nhỏ"
        >
          <span className="material-icons-outlined text-sm">remove</span>
        </button>
        <button
          onClick={() => fitView({ padding: 0.2, duration: 800 })}
          className="p-2 bg-surface hover:bg-surface-container-highest border border-outline-variant/50 rounded-lg text-on-surface transition-colors"
          title="Căn giữa màn hình"
        >
          <span className="material-icons-outlined text-sm">fullscreen</span>
        </button>
      </div>
    </div>
  )
}
