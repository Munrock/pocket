# Pocket

An web app providing streamlined playback controls of youtube videos for musicians.

Designed for musicians to listen to and play back youtube music videos, for playback and rehearsal.

## Key Features

### Respects Youtube ToS

Does not attempt to embed videos that have prohibited embedding. Provides a link back to youtube in addition to the embedded video's 'view on youtube' link.

## Main UI

### Small embedded video

Maximizes the available space for playback controls by making the video small (1 tile in height)

### Large playback controls

Designed to be easy to use for a musician that has an instrument in one or both hands. The whole viewport is split into square tiles, the size of which are customisable. Each button and screen element occupies an entire tile. No margins between tiles.
The only exception is the second timeline (second in addition to the one rendered in the youtube video), which is vertically narrow and spans the whole width of the screen.
The youtube video takes up one or more tiles depending on its aspect ratio.

### Buttons

- Play/pause
- Forward (10 seconds or to the next bookmark, whichever is closest).
- Backward (10 seconds or to the next bookmark, whichever is closest).
- Place bookmark at the playhead (used for looping. Creates a new button showing the time index. User can tap the button to jump to _3 seconds_ before the bookmarked time index: the video resumes playback, fading in from 0 volume back to original volume by the time the playhead reaches the time index.)
- Remove bookmark closest to the playhead.
- Speed up
- Slow down
- Loop (between the bookmarks previous and subsequent to the current playhead position (the start and end of the video are 'psuedo' bookmarks)).
- Set Loop (after pressing this, tap two bookmarks on the timeline)
- Settings (opens a new UI)
- Submenu (hides the main buttons and shows the submenu buttons)
  - Bookmark/unbookmark the song
  - Open in youtube (exit link)
  - Add timeline rows (splits the timeline into one or more rows - effectively zooming in)
  - Remove timeline rows

## Front view

Shows:

- text entry for a video link.

- list of videos, starting with bookmarked videos and then enough previously played videos to reach a full screen. Tapping and holding a previous song bookmarks/unbookmarks it (unbookmarking tags a song as 'just played' so it goes to the top of history in case of accidental bookmarking)

- dark/light mode

- extremely spartan layout: no app title

## Settings

- User can switch dark/light mode here
- User can adjust tile size, and the default number of rows in the timeline
- User can move buttons between the main UI and submenu UI
