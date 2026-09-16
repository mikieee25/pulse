const ACTIVE_WINDOW_MS = 5 * 60 * 1000

export function isActiveNow(lastSeenAt: string | null, now = new Date()) {
  if (!lastSeenAt) return false
  const seen = new Date(lastSeenAt).getTime()
  const current = now.getTime()
  return Number.isFinite(seen) && current >= seen && current - seen <= ACTIVE_WINDOW_MS
}

export function formatLastSeen(lastSeenAt: string | null, now = new Date()) {
  if (!lastSeenAt) return "Never"
  const delta = Math.max(0, now.getTime() - new Date(lastSeenAt).getTime())
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return "Just now"
  if (minutes === 1) return "1 minute ago"
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}
