import { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import type { YouTubeEvent, YouTubeProps } from "react-youtube";
import { useStore } from "../store";
import type { ButtonId } from "../store";
import { formatTime } from "../utils";
import TileButton from "../components/TileButton";
import Timeline from "../components/Timeline";
import "./PlayerView.css";

export default function PlayerView() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<YT.Player | null>(null);
  const timeUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preRollFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tileSize = useStore((s) => s.tileSize);
  const playing = useStore((s) => s.playing);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const playbackRate = useStore((s) => s.playbackRate);
  const embedBlocked = useStore((s) => s.embedBlocked);
  const looping = useStore((s) => s.looping);
  const loopStart = useStore((s) => s.loopStart);
  const loopEnd = useStore((s) => s.loopEnd);
  const preRollDuration = useStore((s) => s.preRollDuration);
  const submenuOpen = useStore((s) => s.submenuOpen);
  const mainButtons = useStore((s) => s.mainButtons);
  const submenuButtons = useStore((s) => s.submenuButtons);
  const manualLoopPicking = useStore((s) => s.manualLoopPicking);
  const timelineRows = useStore((s) => s.timelineRows);

  const setCurrentVideoId = useStore((s) => s.setCurrentVideoId);
  const setPlaying = useStore((s) => s.setPlaying);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const setDuration = useStore((s) => s.setDuration);
  const setEmbedBlocked = useStore((s) => s.setEmbedBlocked);
  const addVideo = useStore((s) => s.addVideo);
  const addBookmark = useStore((s) => s.addBookmark);
  const removeBookmarkNearTime = useStore((s) => s.removeBookmarkNearTime);
  const speedUp = useStore((s) => s.speedUp);
  const slowDown = useStore((s) => s.slowDown);
  const engageAutoLoop = useStore((s) => s.engageAutoLoop);
  const engageManualLoop = useStore((s) => s.engageManualLoop);
  const clearLoop = useStore((s) => s.clearLoop);
  const toggleSubmenu = useStore((s) => s.toggleSubmenu);
  const closeSubmenu = useStore((s) => s.closeSubmenu);
  const toggleFavourite = useStore((s) => s.toggleFavourite);
  const setTimelineRows = useStore((s) => s.setTimelineRows);
  const currentVideoId = useStore((s) => s.currentVideoId);
  const bookmarksByVideo = useStore((s) => s.bookmarksByVideo);
  const handleManualLoopTap = useStore((s) => s.handleManualLoopTap);

  const videos = useStore((s) => s.videos);
  const currentVideo = videos.find((v) => v.videoId === videoId);
  const isFavourite = currentVideo?.favourite ?? false;

  // Track whether this is the first loop iteration for pre-roll
  const isFirstLoopIteration = useRef(true);

  // Set current video on mount
  useEffect(() => {
    if (videoId) {
      setCurrentVideoId(videoId);
      setEmbedBlocked(false);
      closeSubmenu();
      isFirstLoopIteration.current = true;
    }
    return () => {
      if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
      if (preRollFadeRef.current) clearInterval(preRollFadeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Sync playback rate to player
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {
        /* ignore */
      }
    }
  }, [playbackRate]);

  // Loop enforcement
  useEffect(() => {
    if (!looping || !loopStart || !loopEnd) return;
    if (currentTime >= loopEnd.time) {
      const player = playerRef.current;
      if (player) {
        player.seekTo(loopStart.time, true);
        isFirstLoopIteration.current = false;
      }
    }
  }, [currentTime, looping, loopStart, loopEnd]);

  const startTimeUpdater = useCallback(() => {
    if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
    timeUpdateRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime());
        } catch {
          /* ignore */
        }
      }
    }, 250);
  }, [setCurrentTime]);

  const onReady = useCallback(
    (e: YouTubeEvent) => {
      playerRef.current = e.target;
      const dur = e.target.getDuration();
      setDuration(dur);
      e.target.setPlaybackRate(playbackRate);

      // Add to history
      if (videoId) {
        // Try to get video title from the player data
        try {
          const data = e.target.getVideoData?.();
          const title = data?.title || videoId;
          addVideo(videoId, title);
        } catch {
          addVideo(videoId, videoId);
        }
      }

      startTimeUpdater();
    },
    [videoId, playbackRate, startTimeUpdater, setDuration, addVideo],
  );

  const onStateChange = useCallback(
    (e: YouTubeEvent<number>) => {
      const state = e.data;
      if (state === YT.PlayerState.PLAYING) {
        setPlaying(true);
        startTimeUpdater();
      } else if (state === YT.PlayerState.PAUSED) {
        setPlaying(false);
        if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
      } else if (state === YT.PlayerState.ENDED) {
        setPlaying(false);
        if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
      }
    },
    [setPlaying, startTimeUpdater],
  );

  const onError = useCallback(
    (e: YouTubeEvent<number>) => {
      if (e.data === 101 || e.data === 150) {
        setEmbedBlocked(true);
      }
    },
    [setEmbedBlocked],
  );

  // Pre-roll: seek to time - preRollDuration and fade volume
  const seekWithPreRoll = useCallback(
    (targetTime: number) => {
      const player = playerRef.current;
      if (!player) return;
      const preRoll = preRollDuration;
      const startTime = Math.max(0, targetTime - preRoll);

      if (preRollFadeRef.current) clearInterval(preRollFadeRef.current);

      try {
        const originalVolume = player.getVolume();
        player.setVolume(0);
        player.seekTo(startTime, true);
        player.playVideo();

        const fadeStep = 50; // ms
        const steps = (preRoll * 1000) / fadeStep;
        let step = 0;
        preRollFadeRef.current = setInterval(() => {
          step++;
          const vol = Math.round((step / steps) * originalVolume);
          try {
            player.setVolume(Math.min(vol, originalVolume));
          } catch {
            /* */
          }
          if (step >= steps) {
            if (preRollFadeRef.current) clearInterval(preRollFadeRef.current);
            try {
              player.setVolume(originalVolume);
            } catch {
              /* */
            }
          }
        }, fadeStep);
      } catch {
        /* ignore */
      }
    },
    [preRollDuration],
  );

  const handleSeek = useCallback(
    (time: number) => {
      if (manualLoopPicking) {
        handleManualLoopTap(time);
        return;
      }
      if (playing) {
        seekWithPreRoll(time);
      } else {
        playerRef.current?.seekTo(time, true);
      }
    },
    [playing, seekWithPreRoll, manualLoopPicking, handleManualLoopTap],
  );

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [playing]);

  const handleForward = useCallback(() => {
    const { currentVideoId: vid, bookmarksByVideo } = useStore.getState();
    const bms = [...(bookmarksByVideo[vid ?? ""] ?? [])].sort(
      (a, b) => a.time - b.time,
    );
    const time = currentTime;
    // Find next bookmark within 10s
    const next = bms.find((b) => b.time > time && b.time <= time + 10);
    if (next) {
      seekWithPreRoll(next.time);
    } else {
      const newTime = Math.min(time + 10, duration);
      playerRef.current?.seekTo(newTime, true);
    }
  }, [currentTime, duration, seekWithPreRoll]);

  const handleBackward = useCallback(() => {
    const { currentVideoId: vid, bookmarksByVideo } = useStore.getState();
    const bms = [...(bookmarksByVideo[vid ?? ""] ?? [])].sort(
      (a, b) => a.time - b.time,
    );
    const time = currentTime;
    // Find previous bookmark within 10s
    const prev = [...bms]
      .reverse()
      .find((b) => b.time < time && b.time >= time - 10);
    if (prev) {
      seekWithPreRoll(prev.time);
    } else {
      const newTime = Math.max(time - 10, 0);
      playerRef.current?.seekTo(newTime, true);
    }
  }, [currentTime, seekWithPreRoll]);

  const handleAutoLoop = useCallback(() => {
    if (looping) {
      clearLoop();
    } else {
      isFirstLoopIteration.current = true;
      engageAutoLoop();
    }
  }, [looping, clearLoop, engageAutoLoop]);

  const handleManualLoop = useCallback(() => {
    if (looping) {
      clearLoop();
    } else {
      engageManualLoop();
    }
  }, [looping, clearLoop, engageManualLoop]);

  const handleBookmarkTap = useCallback(
    (time: number) => {
      if (looping && isFirstLoopIteration.current) {
        seekWithPreRoll(time);
      } else if (looping) {
        playerRef.current?.seekTo(time, true);
      } else {
        seekWithPreRoll(time);
      }
    },
    [looping, seekWithPreRoll],
  );

  // Render a button by ID
  const renderButton = (id: ButtonId) => {
    switch (id) {
      case "playPause":
        return (
          <TileButton
            key={id}
            label={playing ? "Pause" : "Play"}
            icon={playing ? "⏸" : "▶"}
            onClick={handlePlayPause}
          />
        );
      case "forward":
        return (
          <TileButton
            key={id}
            label="Forward"
            icon="⏩"
            onClick={handleForward}
          />
        );
      case "backward":
        return (
          <TileButton
            key={id}
            label="Backward"
            icon="⏪"
            onClick={handleBackward}
          />
        );
      case "addBookmark":
        return (
          <TileButton
            key={id}
            label="Add Bookmark"
            icon="🔖"
            onClick={() => addBookmark(currentTime)}
          />
        );
      case "removeBookmark":
        return (
          <TileButton
            key={id}
            label="Remove Bookmark"
            icon="✖"
            onClick={() => removeBookmarkNearTime(currentTime)}
          />
        );
      case "speedUp":
        return (
          <TileButton
            key={id}
            label={`Speed Up (${playbackRate}×)`}
            icon={`${playbackRate}🚄`}
            onClick={speedUp}
          />
        );
      case "slowDown":
        return (
          <TileButton
            key={id}
            label={`Slow Down (${playbackRate}×)`}
            icon={`${playbackRate}🚂`}
            onClick={slowDown}
          />
        );
      case "autoLoop":
        return (
          <TileButton
            key={id}
            label={looping ? "Clear Loop" : "Auto Loop"}
            icon={looping ? "❌🔁" : "⚡🔁"}
            active={looping}
            onClick={handleAutoLoop}
          />
        );
      case "manualLoop":
        return (
          <TileButton
            key={id}
            label={
              looping
                ? "Clear Loop"
                : manualLoopPicking
                  ? "Picking…"
                  : "Manual Loop"
            }
            icon={looping ? "❌🔁" : manualLoopPicking ? "👆" : "🔧🔁"}
            active={looping || manualLoopPicking}
            onClick={handleManualLoop}
          />
        );
      case "settings":
        return (
          <TileButton
            key={id}
            label="Settings"
            icon="⚙"
            onClick={() => navigate(`/settings/${videoId}`)}
          />
        );
      case "submenu":
        return (
          <TileButton
            key={id}
            label="Menu"
            icon={submenuOpen ? "✕" : "☰"}
            active={submenuOpen}
            onClick={toggleSubmenu}
          />
        );
      case "favourite":
        return (
          <TileButton
            key={id}
            label={isFavourite ? "Unfavourite" : "Favourite"}
            icon={isFavourite ? "★" : "☆"}
            active={isFavourite}
            onClick={() => videoId && toggleFavourite(videoId)}
          />
        );
      case "openYouTube":
        return (
          <TileButton
            key={id}
            label="Open in YouTube"
            iconNode={
              <img
                src={`${import.meta.env.BASE_URL}yt_icon_red_digital.png`}
                alt="YouTube"
                className="tile-btn__img"
              />
            }
            onClick={() =>
              window.open(
                `https://www.youtube.com/watch?v=${videoId}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
        );
      case "back":
        return (
          <TileButton
            key={id}
            label="Back"
            icon="←"
            onClick={() => navigate("/front")}
          />
        );
      case "zoomIn":
        return (
          <TileButton
            key={id}
            label="Zoom In"
            icon="🔍+"
            onClick={() => setTimelineRows(timelineRows + 1)}
          />
        );
      case "zoomOut":
        return (
          <TileButton
            key={id}
            label="Zoom Out"
            icon="🔍−"
            onClick={() => setTimelineRows(Math.max(1, timelineRows - 1))}
          />
        );
      default:
        return null;
    }
  };

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: `${tileSize}`,
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  const visibleButtons = submenuOpen
    ? [...submenuButtons.filter((b) => b !== "submenu"), "submenu" as ButtonId]
    : mainButtons;
  const bookmarks = [...(bookmarksByVideo[currentVideoId ?? ""] ?? [])].sort(
    (a, b) => a.time - b.time,
  );

  return (
    <div className="player">
      <div className="player__video" style={{ height: tileSize }}>
        {embedBlocked ? (
          <div className="player__blocked">
            <p>This video can't be embedded.</p>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube ↗
            </a>
          </div>
        ) : (
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={onError}
            className="player__youtube"
            iframeClassName="player__iframe"
          />
        )}
      </div>

      <Timeline onSeek={handleSeek} />

      {/* Bookmark buttons */}
      {bookmarks.length > 0 && (
        <div
          className="player__bookmarks"
          style={{ "--tile-size": `${tileSize}px` } as React.CSSProperties}
        >
          {bookmarks.map((b) => (
            <button
              key={b.id}
              className="player__bookmark-btn"
              onClick={() => handleBookmarkTap(b.time)}
              title={`Jump to ${formatTime(b.time)}`}
            >
              {formatTime(b.time)}
            </button>
          ))}
        </div>
      )}

      <div className="player__status">
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {looping && loopStart && loopEnd && (
          <span className="player__loop-label">
            🔁 {formatTime(loopStart.time)} – {formatTime(loopEnd.time)}
          </span>
        )}
        {manualLoopPicking && (
          <span className="player__loop-label">
            Tap timeline to set loop points…
          </span>
        )}
      </div>

      <div
        className="player__grid"
        style={{ "--tile-size": `${tileSize}px` } as React.CSSProperties}
      >
        {visibleButtons.map(renderButton)}
      </div>
    </div>
  );
}
