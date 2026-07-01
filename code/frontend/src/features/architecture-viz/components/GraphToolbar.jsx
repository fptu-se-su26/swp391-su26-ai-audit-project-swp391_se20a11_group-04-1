import React, { useState } from 'react'
import Card from '../../../components/ui/Card'

export default function GraphToolbar({ onSearch }) {
  const [searchVal, setSearchVal] = useState('')

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchVal(val)
    if (onSearch) onSearch(val)
  }

  return (
    <Card style={{ padding: '12px' }} className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
      <div className="relative flex-1 max-w-xs w-full">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/60 text-lg">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm thành phần..."
          value={searchVal}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-on-surface-variant/50"
        />
      </div>
    </Card>
  )
}
