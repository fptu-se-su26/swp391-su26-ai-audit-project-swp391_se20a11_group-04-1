import { useState } from 'react'
import { testCaseService } from '../services/testCaseService'

/**
 * TestCaseFilterBar — Bar bộ lọc (Search, Status, Type)
 */
export default function TestCaseFilterBar({ filters, onFilterChange, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack_md gap-stack_md">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-transparent focus:border-primary focus:ring-2 focus:ring-primary-container rounded font-body-md text-body-md text-on-surface placeholder:text-outline transition-all outline-none"
          placeholder="Search test cases..."
        />
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-stack_sm">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-secondary text-sm cursor-pointer hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>Filter</span>
        </div>
        
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ status: e.target.value || null })}
          className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-secondary text-sm cursor-pointer hover:bg-surface-container-low transition-colors outline-none focus:ring-2 focus:ring-primary-container"
        >
          <option value="">Status: All</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
          <option value="NOT_RUN">Not Run</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        <select
          value={filters.type || ''}
          onChange={(e) => onFilterChange({ type: e.target.value || null })}
          className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-secondary text-sm cursor-pointer hover:bg-surface-container-low transition-colors outline-none focus:ring-2 focus:ring-primary-container"
        >
          <option value="">Type: All</option>
          <option value="UI">UI</option>
          <option value="API">API</option>
          <option value="UNIT">Unit</option>
          <option value="INTEGRATION">Integration</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>
    </div>
  )
}
