/**
 * Extract a YouTube video ID from various URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Plain video ID (11 chars)
 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try as URL
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]
      return isValidVideoId(id) ? id : null
    }
    if (url.hostname.includes('youtube.com')) {
      // /watch?v=ID
      const vParam = url.searchParams.get('v')
      if (vParam && isValidVideoId(vParam)) return vParam
      // /embed/ID or /shorts/ID
      const segments = url.pathname.split('/')
      const idx = segments.indexOf('embed') !== -1
        ? segments.indexOf('embed')
        : segments.indexOf('shorts')
      if (idx !== -1 && segments[idx + 1]) {
        const id = segments[idx + 1]
        if (isValidVideoId(id)) return id
      }
    }
  } catch {
    // Not a URL, try as plain ID
  }

  if (isValidVideoId(trimmed)) return trimmed
  return null
}

function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Format seconds to mm:ss or h:mm:ss
 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}
