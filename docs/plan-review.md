# Plan Review — Pocket

## Summary

The plan describes a tile-based, musician-focused YouTube playback web app.
The core idea is strong: large, easy-to-tap controls designed for someone who
has an instrument in their hands. The document is clear enough to start from,
but several areas need clarification before implementation begins.  The
sections below cover:

1. [Suggested changes / improvements](#1-suggested-changes--improvements)
2. [Clarifications needed](#2-clarifications-needed)
3. [Package selection](#3-package-selection)

---

## 1. Suggested changes / improvements

### 1.1 Disambiguate "bookmark"

The word *bookmark* is used for two completely different things:

| Concept | What it means in the plan |
|---|---|
| **Song bookmark** | A favourite video (stored in the Front view list) |
| **Timestamp bookmark** | A playhead marker used for looping |

Using the same word for both will create confusion throughout the code and UI.
**Suggestion:** call the video-level concept a **favourite** (star icon) and
reserve *bookmark* exclusively for timestamp markers.

### 1.2 Pitch preservation when changing speed

Musicians change speed to slow down difficult passages.  At reduced speed the
pitch drops, which makes it harder to match notes by ear and prevents singing
along.  Almost every purpose-built musician tool (Transcribe!, Amazing Slow
Downer, etc.) applies pitch compensation.

The YouTube IFrame API exposes `setPlaybackRate()` but the underlying HTML5
`<video>` element does not pitch-compensate on its own.  **Suggestion:** add a
**"preserve pitch"** toggle in Settings.  When on, run the audio through the
Web Audio API (`AudioContext` → `AudioWorklet` or a library such as
[`soundtouch-js`](https://github.com/cutterbl/SoundTouchJS)) to restore the
original pitch.  This is a significant engineering task; flag it as a stretch
goal so it does not block the MVP.

### 1.3 Fade-in duration should be configurable

The plan specifies a 3-second fade-in before a timestamp bookmark.  For fast
passages 3 seconds is too long; for slow, complex passages it may be too short.
**Suggestion:** expose a **pre-roll duration** setting (default 3 s, range
1–10 s) in Settings alongside tile size.

### 1.4 Loop modes need a clearer mental model

Two overlapping loop concepts are described:

- **Auto-loop** — loops between the bookmarks immediately before and after the
  current playhead.
- **Set Loop** — user manually selects two bookmarks as start/end points.

It is not clear what happens when both are active, or which takes precedence.
**Suggestion:** make these mutually exclusive and represent them as a single
`loopMode: 'auto' | 'manual' | 'off'` state value.

### 1.5 "Add / remove timeline rows" is a zoom, not row management

Splitting the timeline into multiple rows so each row covers a shorter
time-span is effectively **horizontal zoom**.  Calling the buttons
"Add/remove timeline rows" is technically accurate but unintuitive.
**Suggestion:** label them **Zoom in / Zoom out** and note in the plan that the
implementation is "add/remove rows" so future developers understand the mapping.

### 1.6 Front view: dynamic list height

The plan says show "enough previously played videos to reach a full screen".
This ties the list length to the tile size setting, meaning a resize or
tile-size change must recompute the list.  **Suggestion:** confirm this is the
intended behaviour and note it explicitly, because it affects how the history
is queried from storage (it cannot simply be a fixed-length slice).

### 1.7 PWA / offline / installability

The use case (musician, one or both hands occupied, possibly in a rehearsal
space with poor connectivity) is an ideal fit for a **Progressive Web App**.
Adding `vite-plugin-pwa` gives home-screen installation and caches the app
shell so controls remain responsive even when the network stalls.  Video
streaming itself still requires a connection, but the UI never freezes.
**Suggestion:** add PWA support from the start; it is trivial to add early and
painful to retrofit later.

### 1.8 Keyboard / pedal accessibility

Large touch targets are the primary accessibility concern, but a musician might
also connect a USB foot pedal (which typically emulates a keyboard key).
**Suggestion:** document which keyboard shortcuts map to which controls
(e.g. `Space` = play/pause, `←`/`→` = backward/forward, `[`/`]` = speed
down/up).  These can be added in a later iteration but should be designed in
from the start.

---

## 2. Clarifications needed

### 2.1 How is "prohibited embedding" detected?

The plan says the app should not attempt to embed videos that have prohibited
embedding.  The YouTube IFrame API fires error code **101** or **150** when a
video disallows embedding.  Should the app:

- (a) React to the error after the player loads and show a "Watch on YouTube"
  fallback, or
- (b) Check the oEmbed endpoint *before* rendering the player to avoid a flash
  of the error state?

Option (b) requires a network request to
`https://www.youtube.com/oembed?url=…&format=json` before loading the player.

### 2.2 Target device / viewport

Is this primarily a **mobile** app (portrait, touch), a **desktop** app
(landscape, mouse/touch), or fully responsive?  The tile-based layout with
large buttons strongly implies mobile, but the YouTube player and timeline may
be more comfortable on a larger screen.

### 2.3 Forward/backward skip logic

> "Forward (10 seconds or to the next bookmark, whichever is closest)"

"Closest" is ambiguous when the next bookmark is *further* than 10 s away.
Should the button always jump to whichever destination is *closer to the
current playhead*, i.e.:

- next-bookmark distance < 10 s → jump to bookmark
- next-bookmark distance ≥ 10 s → jump +10 s

Or does "closest" mean "jump to the nearest upcoming bookmark if one exists
within 10 s, otherwise +10 s"?  These produce the same result, but stating it
unambiguously avoids a bug.

### 2.4 Bookmark pre-roll: does looping restart the fade?

When the app is looping and crosses a bookmark, does the fade-in reset on
every pass, or only on the first approach?

### 2.5 Settings: which buttons can be moved?

The plan says users can move buttons between the main UI and the submenu.
Should there be a minimum set of buttons that are always on the main UI (e.g.
play/pause is never movable), or is every button freely movable?

### 2.6 Persistence scope

Should the video history, favourites, and timestamp bookmarks be:

- (a) Stored only in `localStorage` (current approach, per-browser), or
- (b) Synced across devices (requires a backend or a service like Firebase)?

The current codebase uses `localStorage`.  A backend would significantly
increase scope.

---

## 3. Package selection

The existing stack (React 19, TypeScript, Vite) is the right foundation.
The packages below are the minimum additional dependencies needed.

### 3.1 Core runtime dependencies

| Package | Version | Reason |
|---|---|---|
| `react-youtube` | `^10` | Thin React wrapper around the YouTube IFrame Player API. Provides a `ref`-accessible player object with the full `YT.Player` interface (play, pause, seek, `setPlaybackRate`, `getVolume`, `setVolume`, event callbacks). No API key required for embedding. |
| `zustand` | `^5` | Lightweight, hook-based state management. The app has enough cross-component state (bookmarks, loop mode, speed, tile size, button layout) to justify a shared store, but Redux is overkill. |
| `react-router-dom` | `^7` | The plan describes three distinct views (Front, Player, Settings). React Router provides `<BrowserRouter>`, `<Routes>`, and `useNavigate`; it is already the de-facto standard in the Vite/React ecosystem. |

### 3.2 Development dependencies

| Package | Version | Reason |
|---|---|---|
| `vite-plugin-pwa` | `^0.21` | Adds PWA support (see §1.7). Generates a service worker and web manifest from Vite config with zero boilerplate. |
| `@types/youtube` | `^0.0.x` | TypeScript types for the `YT` global injected by the IFrame API. `react-youtube` re-exports most of these, but the raw types are useful for custom hooks. |

### 3.3 Advisory / stretch-goal packages

| Package | Reason |
|---|---|
| `soundtouch-js` | Pitch-preserving playback speed (§1.2). Evaluate before committing — the Web Audio API route adds complexity and may have latency implications on mobile. |
| `vitest` + `@testing-library/react` | Unit and component testing. No test infrastructure exists yet; add when the first non-trivial component is built. |
| `idb` | Typed IndexedDB wrapper. Upgrade from `localStorage` if the bookmarks/history data grows large or requires indexed queries (e.g. search by title). |

### 3.4 Packages explicitly *not* recommended

| Package | Reason to avoid |
|---|---|
| `@mui/material` / `antd` / `chakra-ui` | The tile-based layout is bespoke; a generic component library would fight the grid and add bloat. CSS Grid + custom properties (already in place) is the right approach. |
| `axios` | `fetch` is sufficient for the single oEmbed pre-check call (§2.1). |
| `date-fns` / `dayjs` | Time values are plain seconds (integers); no date library is needed. |

---

## 4. Suggested implementation order

1. **Routing skeleton** — three routes (Front, Player, Settings) with stub components.
2. **Zustand store** — define the state shape (preferences, history, favourites, player state, bookmarks, loop state).
3. **Front view** — URL input, history list, dark/light toggle.
4. **Player view** — `react-youtube` embed, timeline, play/pause/seek, bookmarks, speed.
5. **Loop logic** — auto-loop and manual loop modes.
6. **Settings view** — tile size, pre-roll duration, button layout editor.
7. **PWA manifest + service worker** — `vite-plugin-pwa`.
8. **Pitch preservation** (stretch) — Web Audio API integration.
