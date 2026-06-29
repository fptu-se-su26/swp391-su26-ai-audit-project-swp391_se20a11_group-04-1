/**
 * TypeBadge — Hiển thị loại test case (UI / API / Manual / Unit / Integration)
 */
export default function TypeBadge({ type }) {
  return (
    <span className="font-label-md text-[10px] uppercase tracking-wider bg-surface-container-high px-2 py-1 rounded text-secondary">
      {type}
    </span>
  )
}
