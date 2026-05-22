/**
 * Generates initials from a full name.
 * E.g., "Nguyễn Thanh Đạt" -> "ND" or "Anh Dung" -> "AD"
 * 
 * @param {string} fullName 
 * @returns {string} Initials in uppercase
 */
export function getInitials(fullName) {
  if (!fullName) return 'U'
  const trimmed = fullName.trim()
  if (!trimmed) return 'U'

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return (first + last).toUpperCase()
}

/**
 * Generates a stable background color for an avatar based on name hashing.
 * 
 * @param {string} fullName 
 * @returns {string} Tailwind CSS background class combined with text color
 */
export function getAvatarColor(fullName) {
  const colors = [
    'bg-indigo-700 text-white',
    'bg-emerald-700 text-white',
    'bg-amber-700 text-white',
    'bg-pink-700 text-white',
    'bg-purple-700 text-white',
    'bg-teal-700 text-white',
    'bg-rose-700 text-white',
    'bg-blue-700 text-white',
  ]

  if (!fullName) return colors[0]

  let hash = 0
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}
