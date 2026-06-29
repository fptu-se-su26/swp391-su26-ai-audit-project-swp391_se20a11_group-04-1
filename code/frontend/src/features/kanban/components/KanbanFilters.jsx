const SelectFilter = ({ icon, label, value, options, onChange }) => (
  <label className="flex items-center space-x-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant">
    {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="bg-transparent border-none text-sm font-semibold text-on-background focus:ring-0 p-0 pr-6 outline-none"
    >
      <option value="ALL">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
)

const KanbanFilters = ({ filters, filterOptions, onFilterChange }) => {
  return (
    <div className="px-6 py-3 border-b border-outline-variant bg-surface-container-lowest shrink-0 z-10">
      <div className="flex flex-wrap gap-3 items-center">
        <SelectFilter
          icon="speed"
          label="All Sprints"
          value={filters.sprint}
          options={filterOptions.sprints}
          onChange={(value) => onFilterChange('sprint', value)}
        />
        <div className="hidden md:block h-6 w-px bg-outline-variant mx-1" />
        <SelectFilter
          label="All Assignees"
          value={filters.assignee}
          options={filterOptions.assignees}
          onChange={(value) => onFilterChange('assignee', value)}
        />
        <SelectFilter
          label="All Requirements"
          value={filters.requirement}
          options={filterOptions.requirements}
          onChange={(value) => onFilterChange('requirement', value)}
        />
        <SelectFilter
          label="All Priorities"
          value={filters.priority}
          options={filterOptions.priorities}
          onChange={(value) => onFilterChange('priority', value)}
        />
      </div>
    </div>
  )
}

export default KanbanFilters
