# Pocket

A mobile-first YouTube playback controller built for musicians. Bookmark passages, loop between markers, adjust speed, and practise hands-free — all from a minimal tile-based UI designed for one-handed use.

**Live:** [munrock.github.io/pocket](https://munrock.github.io/pocket/)

## Features

- **Bookmarks** — tap to place timestamp markers on any video; snap-to nearest within 2 s
- **Looping** — auto-loop between the two closest bookmarks, or tap the timeline twice for a manual loop
- **Pre-roll** — configurable 1–10 s volume fade-in when jumping to a bookmark, so you hear the lead-in
- **Speed control** — 0.25×–2× playback rate
- **Timeline** — zoomable multi-row timeline showing bookmarks and loop regions
- **Customisable grid** — rearrange buttons between the main view and a submenu; set tile size (2–7 across)
- **Dark / light theme**
- **Installable PWA** — works offline (except YouTube streaming itself); add to home screen on mobile or install on desktop
- **No backend** — all data persists in localStorage

## Tech stack

React 19 · React Router 7 · Zustand 5 · Vite 8 · TypeScript · vite-plugin-pwa

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173/
```

## Deploy to GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

## Licence

[MIT](LICENSE)
