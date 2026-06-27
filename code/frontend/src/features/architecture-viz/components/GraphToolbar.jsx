import React, { useState } from 'react'
import { useArchitectureStore } from '../store/architectureStore'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

export default function GraphToolbar({ onSearch, onZoomIn, onZoomOut, onFitView }) {
  const { physicsEnabled, togglePhysics } = useArchitectureStore()
  const [searchVal, setSearchVal] = useState('')

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchVal(val)
    if (onSearch) onSearch(val)
  }

  return (
    <Card style={{ padding: '12px' }} className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
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
        <Button
          variant={physicsEnabled ? 'primary' : 'outline'}
          onClick={togglePhysics}
          title="Bật/Tắt chế độ vật lý Obsidian mode"
        >
          <span className="material-icons-outlined text-sm">settings_input_antenna</span>
          <span>Obsidian Physics: {physicsEnabled ? 'ON' : 'OFF'}</span>
        </Button>

        <div className="h-6 w-px bg-outline-variant/50 mx-1"></div>

        <Button
          variant="outline"
          onClick={() => onZoomIn?.()}
          title="Phóng to"
          style={{ padding: '8px' }}
        >
          <span className="material-icons-outlined text-sm">add</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => onZoomOut?.()}
          title="Thu nhỏ"
          style={{ padding: '8px' }}
        >
          <span className="material-icons-outlined text-sm">remove</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => onFitView?.({ padding: 0.2, duration: 800 })}
          title="Căn giữa màn hình"
          style={{ padding: '8px' }}
        >
          <span className="material-icons-outlined text-sm">fit_screen</span>
        </Button>
      </div>
    </Card>
  )
}
