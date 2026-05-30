/**
 * SprintBanner - Banner thông tin sprint hiện tại
 * Props:
 *   sprint: { name, startDate, endDate, goal, daysLeft }
 *   Nếu không có sprint → hiển thị placeholder
 */
const SprintBanner = ({ sprint }) => {
  if (!sprint) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant">info</span>
        <span className="text-sm text-on-surface-variant">Chưa có sprint nào đang hoạt động</span>
      </div>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
      {/* Left: Sprint info */}
      <div className="flex items-center gap-3">
        <span className="bg-primary-container text-white px-3 py-1 rounded-md text-xs font-bold tracking-tight uppercase">
          {sprint.name || 'Sprint'}
        </span>
        <span className="text-sm text-on-surface font-semibold">
          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
        </span>
        {sprint.daysLeft !== undefined && (
          <span className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full text-[11px] font-bold">
            {sprint.daysLeft > 0 ? `${sprint.daysLeft} days left` : 'Ended'}
          </span>
        )}
      </div>

      {/* Right: Sprint goal */}
      {sprint.goal && (
        <div className="flex items-center gap-3 text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-dashed border-outline-variant max-w-md">
          <span className="material-symbols-outlined text-primary text-[20px]">target</span>
          <span className="text-sm">
            <strong>Sprint Goal:</strong> {sprint.goal}
          </span>
        </div>
      )}
    </div>
  )
}

export default SprintBanner
