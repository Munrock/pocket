import { create } from 'zustand'

/* ─── Types ───────────────────────────────────────────────────────── */

export type ColourScheme = 'dark' | 'light'

export interface Bookmark {
  /** Unique id */
  id: string
  /** Time in seconds */
  time: number
}

export interface VideoEntry {
  videoId: string
  title: string
  /** ISO timestamp of last play */
  lastPlayed: string
  favourite: boolean
}

export type TileFraction = 2 | 3 | 4 | 5 | 6 | 7

/** IDs of all available buttons the user can place in main or submenu */
export type ButtonId =
  | 'playPause'
  | 'forward'
  | 'backward'
  | 'addBookmark'
  | 'removeBookmark'
  | 'speedUp'
  | 'slowDown'
  | 'autoLoop'
  | 'manualLoop'
  | 'settings'
  | 'submenu'
  | 'favourite'
  | 'openYouTube'
  | 'zoomIn'
  | 'zoomOut'

export const DEFAULT_MAIN_BUTTONS: ButtonId[] = [
  'playPause',
  'forward',
  'backward',
  'addBookmark',
  'removeBookmark',
  'speedUp',
  'slowDown',
  'autoLoop',
  'manualLoop',
  'settings',
  'submenu',
]

export const DEFAULT_SUBMENU_BUTTONS: ButtonId[] = [
  'favourite',
  'openYouTube',
  'zoomIn',
  'zoomOut',
]

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

/* ─── State shape ─────────────────────────────────────────────────── */

export interface PocketState {
  /* Preferences */
  colourScheme: ColourScheme
  tileFraction: TileFraction
  tileSize: number
  preRollDuration: number
  timelineRows: number
  mainButtons: ButtonId[]
  submenuButtons: ButtonId[]

  /* Video history */
  videos: VideoEntry[]

  /* Player state (transient) */
  currentVideoId: string | null
  playing: boolean
  currentTime: number
  duration: number
  playbackRate: number
  embedBlocked: boolean

  /* Bookmarks (per-video, keyed by videoId) */
  bookmarksByVideo: Record<string, Bookmark[]>

  /* Loop */
  looping: boolean
  loopStart: Bookmark | null
  loopEnd: Bookmark | null

  /* Manual-loop picking state */
  manualLoopPicking: boolean
  manualLoopFirstPoint: number | null

  /* Submenu visibility */
  submenuOpen: boolean

  /* Actions */
  setColourScheme: (scheme: ColourScheme) => void
  setTileFraction: (f: TileFraction) => void
  setPreRollDuration: (d: number) => void
  setTimelineRows: (r: number) => void
  setMainButtons: (ids: ButtonId[]) => void
  setSubmenuButtons: (ids: ButtonId[]) => void

  addVideo: (videoId: string, title: string) => void
  toggleFavourite: (videoId: string) => void
  removeVideo: (videoId: string) => void

  setCurrentVideoId: (id: string | null) => void
  setPlaying: (p: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setPlaybackRate: (r: number) => void
  setEmbedBlocked: (b: boolean) => void
  speedUp: () => void
  slowDown: () => void

  getBookmarks: () => Bookmark[]
  addBookmark: (time: number) => void
  removeBookmarkNearTime: (time: number) => void

  engageAutoLoop: () => void
  engageManualLoop: () => void
  handleManualLoopTap: (time: number) => void
  clearLoop: () => void

  toggleSubmenu: () => void
  closeSubmenu: () => void
}

/* ─── LocalStorage helpers ────────────────────────────────────────── */

const STORAGE_KEY = 'pocket_state'

interface PersistedState {
  colourScheme: ColourScheme
  tileFraction: TileFraction
  tileSize: number
  preRollDuration: number
  timelineRows: number
  mainButtons: ButtonId[]
  submenuButtons: ButtonId[]
  videos: VideoEntry[]
  bookmarksByVideo: Record<string, Bookmark[]>
}

function loadPersisted(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<PersistedState>
  } catch { /* ignore */ }
  return {}
}

function persist(state: PocketState) {
  const data: PersistedState = {
    colourScheme: state.colourScheme,
    tileFraction: state.tileFraction,
    tileSize: state.tileSize,
    preRollDuration: state.preRollDuration,
    timelineRows: state.timelineRows,
    mainButtons: state.mainButtons,
    submenuButtons: state.submenuButtons,
    videos: state.videos,
    bookmarksByVideo: state.bookmarksByVideo,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function computeTileSize(fraction: TileFraction): number {
  return Math.floor(window.innerWidth / fraction)
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/* ─── Store ───────────────────────────────────────────────────────── */

const saved = loadPersisted()
const initialFraction: TileFraction = saved.tileFraction ?? 4

export const useStore = create<PocketState>((set, get) => ({
  /* Preferences */
  colourScheme: saved.colourScheme ?? 'dark',
  tileFraction: initialFraction,
  tileSize: saved.tileSize ?? computeTileSize(initialFraction),
  preRollDuration: saved.preRollDuration ?? 3,
  timelineRows: saved.timelineRows ?? 1,
  mainButtons: saved.mainButtons ?? DEFAULT_MAIN_BUTTONS,
  submenuButtons: saved.submenuButtons ?? DEFAULT_SUBMENU_BUTTONS,

  /* Video history */
  videos: saved.videos ?? [],

  /* Player (transient) */
  currentVideoId: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  embedBlocked: false,

  /* Bookmarks */
  bookmarksByVideo: saved.bookmarksByVideo ?? {},

  /* Loop */
  looping: false,
  loopStart: null,
  loopEnd: null,
  manualLoopPicking: false,
  manualLoopFirstPoint: null,

  /* Submenu */
  submenuOpen: false,

  /* ── Actions ──────────────────────────────────────────────────── */

  setColourScheme: (scheme) => {
    document.documentElement.setAttribute('data-theme', scheme)
    set({ colourScheme: scheme })
    persist(get())
  },

  setTileFraction: (f) => {
    set({ tileFraction: f, tileSize: computeTileSize(f) })
    persist(get())
  },

  setPreRollDuration: (d) => {
    set({ preRollDuration: Math.max(1, Math.min(10, d)) })
    persist(get())
  },

  setTimelineRows: (r) => {
    set({ timelineRows: Math.max(1, r) })
    persist(get())
  },

  setMainButtons: (ids) => {
    set({ mainButtons: ids })
    persist(get())
  },

  setSubmenuButtons: (ids) => {
    set({ submenuButtons: ids })
    persist(get())
  },

  /* Video history */
  addVideo: (videoId, title) => {
    const videos = get().videos.filter((v) => v.videoId !== videoId)
    const existing = get().videos.find((v) => v.videoId === videoId)
    const entry: VideoEntry = {
      videoId,
      title: title || videoId,
      lastPlayed: new Date().toISOString(),
      favourite: existing?.favourite ?? false,
    }
    videos.unshift(entry)
    // Keep max 26 non-favourite entries + all favourites
    const favourites = videos.filter((v) => v.favourite)
    const history = videos.filter((v) => !v.favourite).slice(0, 26)
    set({ videos: [...favourites, ...history] })
    persist(get())
  },

  toggleFavourite: (videoId) => {
    const videos = get().videos.map((v) => {
      if (v.videoId !== videoId) return v
      const nowFavourite = !v.favourite
      return {
        ...v,
        favourite: nowFavourite,
        // If unfavouriting, push to top of history by updating lastPlayed
        lastPlayed: nowFavourite ? v.lastPlayed : new Date().toISOString(),
      }
    })
    // Re-sort: favourites first, then by lastPlayed descending
    const favourites = videos.filter((v) => v.favourite)
    const history = videos.filter((v) => !v.favourite)
    history.sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
    set({ videos: [...favourites, ...history.slice(0, 26)] })
    persist(get())
  },

  removeVideo: (videoId) => {
    set({ videos: get().videos.filter((v) => v.videoId !== videoId) })
    persist(get())
  },

  /* Player state */
  setCurrentVideoId: (id) => set({ currentVideoId: id }),
  setPlaying: (p) => set({ playing: p }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  setEmbedBlocked: (b) => set({ embedBlocked: b }),

  speedUp: () => {
    const current = get().playbackRate
    const idx = PLAYBACK_RATES.indexOf(current as typeof PLAYBACK_RATES[number])
    const next = idx === -1 || idx === PLAYBACK_RATES.length - 1 ? 0 : idx + 1
    set({ playbackRate: PLAYBACK_RATES[next] })
  },

  slowDown: () => {
    const current = get().playbackRate
    const idx = PLAYBACK_RATES.indexOf(current as typeof PLAYBACK_RATES[number])
    const next = idx <= 0 ? PLAYBACK_RATES.length - 1 : idx - 1
    set({ playbackRate: PLAYBACK_RATES[next] })
  },

  /* Bookmarks */
  getBookmarks: () => {
    const vid = get().currentVideoId
    if (!vid) return []
    return [...(get().bookmarksByVideo[vid] ?? [])].sort((a, b) => a.time - b.time)
  },

  addBookmark: (time) => {
    const vid = get().currentVideoId
    if (!vid) return
    const existing = get().bookmarksByVideo[vid] ?? []
    const bookmark: Bookmark = { id: makeId(), time: Math.round(time * 10) / 10 }
    set({
      bookmarksByVideo: {
        ...get().bookmarksByVideo,
        [vid]: [...existing, bookmark].sort((a, b) => a.time - b.time),
      },
    })
    persist(get())
  },

  removeBookmarkNearTime: (time) => {
    const vid = get().currentVideoId
    if (!vid) return
    const existing = get().bookmarksByVideo[vid] ?? []
    if (existing.length === 0) return
    let closest = existing[0]
    for (const b of existing) {
      if (Math.abs(b.time - time) < Math.abs(closest.time - time)) closest = b
    }
    set({
      bookmarksByVideo: {
        ...get().bookmarksByVideo,
        [vid]: existing.filter((b) => b.id !== closest.id),
      },
    })
    persist(get())
  },

  /* Loop */
  engageAutoLoop: () => {
    const time = get().currentTime
    const bookmarks = get().getBookmarks()
    const duration = get().duration

    // Find nearest bookmark before and after
    let loopStart: Bookmark | null = null
    let loopEnd: Bookmark | null = null

    for (const b of bookmarks) {
      if (b.time <= time) loopStart = b
    }
    for (const b of bookmarks) {
      if (b.time > time) {
        loopEnd = b
        break
      }
    }

    // Use start/end of video as pseudo-bookmarks
    if (!loopStart) loopStart = { id: '__start', time: 0 }
    if (!loopEnd) loopEnd = { id: '__end', time: duration }

    set({ looping: true, loopStart, loopEnd, manualLoopPicking: false, manualLoopFirstPoint: null })
  },

  engageManualLoop: () => {
    set({
      looping: false,
      loopStart: null,
      loopEnd: null,
      manualLoopPicking: true,
      manualLoopFirstPoint: null,
    })
  },

  handleManualLoopTap: (time: number) => {
    const state = get()
    if (!state.manualLoopPicking) return

    const bookmarks = state.getBookmarks()

    // If tap is within 2s of an existing bookmark, snap to it
    let point: Bookmark | null = null
    for (const b of bookmarks) {
      if (Math.abs(b.time - time) <= 2) {
        point = b
        break
      }
    }

    if (!point) {
      // Create new bookmark
      const id = makeId()
      const roundedTime = Math.round(time * 10) / 10
      point = { id, time: roundedTime }
      const vid = state.currentVideoId
      if (vid) {
        const existing = state.bookmarksByVideo[vid] ?? []
        set({
          bookmarksByVideo: {
            ...state.bookmarksByVideo,
            [vid]: [...existing, point].sort((a, b) => a.time - b.time),
          },
        })
      }
    }

    if (state.manualLoopFirstPoint === null) {
      set({ manualLoopFirstPoint: point.time })
    } else {
      const first = state.manualLoopFirstPoint
      const second = point.time
      const startTime = Math.min(first, second)
      const endTime = Math.max(first, second)

      // Find or create bookmarks for the start/end
      const allBookmarks = get().getBookmarks()
      const loopStart = allBookmarks.find((b) => Math.abs(b.time - startTime) < 0.5) ?? { id: makeId(), time: startTime }
      const loopEnd = allBookmarks.find((b) => Math.abs(b.time - endTime) < 0.5) ?? { id: makeId(), time: endTime }

      set({
        looping: true,
        loopStart,
        loopEnd,
        manualLoopPicking: false,
        manualLoopFirstPoint: null,
      })
    }
    persist(get())
  },

  clearLoop: () => {
    set({
      looping: false,
      loopStart: null,
      loopEnd: null,
      manualLoopPicking: false,
      manualLoopFirstPoint: null,
    })
  },

  toggleSubmenu: () => set({ submenuOpen: !get().submenuOpen }),
  closeSubmenu: () => set({ submenuOpen: false }),
}))
