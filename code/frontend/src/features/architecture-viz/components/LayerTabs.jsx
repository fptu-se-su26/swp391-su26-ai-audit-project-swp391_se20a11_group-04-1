import React from 'react'
import { useArchitectureStore } from '../store/architectureStore'

export default function LayerTabs() {
  const { layer, setLayer, focusNodeId, setFocusNodeId, resetBreadcrumbs } = useArchitectureStore()

  const handleTabChange = (targetLayer) => {
    if (targetLayer === 'OVERVIEW') {
      resetBreadcrumbs()
    } else {
      setLayer(targetLayer)
      if (targetLayer === 'MODULE' && focusNodeId && !focusNodeId.startsWith('pkg:') && !focusNodeId.startsWith('file:')) {
        setFocusNodeId(null)
      }
      if (targetLayer === 'FLOW' && focusNodeId && !focusNodeId.startsWith('cls:')) {
        setFocusNodeId(null)
      }
    }
  }

  const tabs = [
    { id: 'OVERVIEW', label: '1. Tổng quan hệ thống', icon: 'splitscreen' },
    { id: 'MODULE', label: '2. Cấu trúc Module', icon: 'view_module' },
    { id: 'FLOW', label: '3. Luồng xử lý', icon: 'lan' }
  ]

  return (
    <div className="flex space-x-1 p-1 bg-surface-container-high rounded-xl border border-outline-variant/30 w-full md:w-auto">
      {tabs.map((tab) => {
        const isActive = layer === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full md:w-auto ${
              isActive
                ? 'bg-surface text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
            }`}
          >
            <span className="material-icons-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
