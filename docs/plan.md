# Pocket

A web app providing streamlined playback controls of YouTube videos for musicians.

Designed for musicians to listen to and play back YouTube music videos, for playback and rehearsal. Primarily targets **mobile devices** (portrait, touch).

## Terminology

| Term | Meaning |
|---|---|
| **Favourite** | A saved video (star icon), shown at the top of the Front view list |
| **Bookmark** | A timestamp marker on the timeline, used for navigation and looping |

## Key Features

### Respects YouTube ToS

Does not attempt to embed videos that have prohibited embedding. When a video disallows embedding (YouTube IFrame API error code 101/150), the player area displays a link to watch the video on YouTube. Provides a link back to YouTube in addition to the embedded video's "Watch on YouTube" link.

### Persistence

All data (video history, favourites, bookmarks, settings) is stored in `localStorage` only (per-browser, no backend).

### PWA support

The app is a Progressive Web App. `vite-plugin-pwa` provides home-screen installation and caches the app shell so controls remain responsive even when the network stalls. Video streaming still requires a connection, but the UI never freezes.

## Main UI

### Small embedded video

Maximises the available space for playback controls by making the video small (1 tile in height).

### Large playback controls

Designed to be easy to use for a musician that has an instrument in one or both hands. The whole viewport is split into square tiles, the size of which are customisable. Each button and screen element occupies an entire tile. No margins between tiles.
The only exception is the second timeline (second in addition to the one rendered in the YouTube video), which is vertically narrow (but still tall enough to be easy to tap without 'fat fingering' neighbouring buttons) and spans the whole width of the screen.
The YouTube video takes up one or more tiles depending on its aspect ratio.

### Buttons

- Play/pause
- Forward — skip the playhead forward to the next bookmark within 10 seconds, or skip forward 10 seconds if there are no such bookmarks.
- Backward — skip the playhead backward to the previous bookmark within 10 seconds, or skip backward 10 seconds if there are no such bookmarks.
- Place bookmark at the playhead — creates a new button showing the time index. User can tap the button to jump to the bookmarked time index with a **pre-roll**: playback resumes from a configurable number of seconds before the bookmark (default 3 s), fading in from 0 volume back to original volume by the time the playhead reaches the bookmark. Pre-roll is applied when the musician manually skips to a bookmark. During looping, pre-roll applies only on the first pass to give the musician time to ready their instrument; subsequent loop iterations have no pre-roll.
- Remove bookmark closest to the playhead.
- Speed up
- Slow down
- Auto Loop — tap to engage. The nearest bookmark *before* the current playhead becomes `loopStart`; the nearest bookmark *after* becomes `loopEnd` (the start and end of the video act as pseudo-bookmarks). Looping begins immediately.
- Manual Loop — tap to engage, then tap any two bookmarks on the timeline. The app assigns them to `loopStart`/`loopEnd` by timeline position and begins looping.
- Settings (opens a new UI)
- Submenu (hides the main buttons and shows the submenu buttons)
  - Favourite/unfavourite the song
  - Open in YouTube (exit link)
  - Zoom in (splits the timeline into more rows, each covering a shorter time-span)
  - Zoom out (reduces the number of timeline rows)

While a loop is active, both the Auto Loop and Manual Loop buttons become **Clear Loop** buttons (`looping = false`, `loopStart`/`loopEnd` cleared). The two modes are mutually exclusive — engaging one always clears the previous loop.

#### Loop state model

```ts
looping:   boolean          // whether the looper is currently engaged
loopStart: Bookmark | null  // earlier boundary
loopEnd:   Bookmark | null  // later boundary
```

### Button movability

All buttons can be moved between the main UI and the submenu via Settings, except the Submenu button itself.

### Keyboard / pedal accessibility

A musician may connect a USB foot pedal (which typically emulates a keyboard key). The app should support keyboard shortcuts mapped to controls (e.g. `Space` = play/pause, `←`/`→` = backward/forward, `[`/`]` = speed down/up). Specific bindings to be defined during implementation.

## Front view

Shows:

- Text entry for a video link.

- List of videos, starting with favourited videos and then previously played videos. Uses a standard list layout (not the tile layout of the main UI). Tapping and holding a video favourites/unfavourites it (unfavouriting tags a video as "just played" so it goes to the top of history in case of accidental unfavouriting).

- Dark/light mode toggle.

- Extremely spartan layout: no app title.

## Settings

- User can switch dark/light mode
- User can adjust tile size, and the default number of rows in the timeline
- User can adjust **pre-roll duration** (default 3 s, range 1–10 s)
- User can move buttons between the main UI and submenu UI
- **Preserve pitch** toggle (stretch goal) — when on, pitch-compensates audio during speed changes via the Web Audio API so the key stays correct at reduced speed

## Stretch goals

- **Pitch preservation when changing speed** — at reduced speed the pitch drops, making it harder to match notes by ear. A "preserve pitch" toggle in Settings would run audio through the Web Audio API (e.g. `soundtouch-js`) to restore the original pitch. Significant engineering task; do not block the MVP.

## Package selection

### Core runtime dependencies

| Package | Version | Reason |
|---|---|---|
| `react-youtube` | `^10` | Thin React wrapper around the YouTube IFrame Player API. Provides a ref-accessible player object with the full `YT.Player` interface. No API key required. |
| `zustand` | `^5` | Lightweight, hook-based state management for cross-component state (bookmarks, loop mode, speed, tile size, button layout). |
| `react-router-dom` | `^7` | Three distinct views (Front, Player, Settings) need routing. |

### Development dependencies

| Package | Version | Reason |
|---|---|---|
| `vite-plugin-pwa` | `^0.21` | PWA support — generates a service worker and web manifest from Vite config. |
| `@types/youtube` | `^0.0.x` | TypeScript types for the `YT` global injected by the IFrame API. |

### Stretch-goal packages

| Package | Reason |
|---|---|
| `soundtouch-js` | Pitch-preserving playback speed. Evaluate before committing — Web Audio API adds complexity and may have latency on mobile. |
| `vitest` + `@testing-library/react` | Unit and component testing. Add when the first non-trivial component is built. |
| `idb` | Typed IndexedDB wrapper. Upgrade from `localStorage` if bookmarks/history data grows large. |

### Packages explicitly not recommended

| Package | Reason to avoid |
|---|---|
| `@mui/material` / `antd` / `chakra-ui` | The tile-based layout is bespoke; a generic component library would fight the grid and add bloat. CSS Grid + custom properties is the right approach. |
| `axios` | `fetch` is sufficient for the single oEmbed pre-check call. |
| `date-fns` / `dayjs` | Time values are plain seconds; no date library is needed. |

## Suggested implementation order

1. **Routing skeleton** — three routes (Front, Player, Settings) with stub components.
2. **Zustand store** — define the state shape (preferences, history, favourites, player state, bookmarks, loop state).
3. **Front view** — URL input, history list, dark/light toggle.
4. **Player view** — `react-youtube` embed, timeline, play/pause/seek, bookmarks, speed.
5. **Loop logic** — auto-loop and manual loop modes.
6. **Settings view** — tile size, pre-roll duration, button layout editor.
7. **PWA manifest + service worker** — `vite-plugin-pwa`.
8. **Pitch preservation** (stretch) — Web Audio API integration.
