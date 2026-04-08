import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { extractVideoId } from "../utils";
import "./FrontView.css";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

const TAB_KEY = "pocket_front_tab";
type Tab = "history" | "favourites";

function loadTab(): Tab {
  const v = localStorage.getItem(TAB_KEY);
  return v === "favourites" ? "favourites" : "history";
}

export default function FrontView() {
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [tab, setTabState] = useState<Tab>(loadTab);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const navigate = useNavigate();

  const setTab = (t: Tab) => {
    setTabState(t);
    localStorage.setItem(TAB_KEY, t);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    setInstallPrompt(null);
  };
  const colourScheme = useStore((s) => s.colourScheme);
  const setColourScheme = useStore((s) => s.setColourScheme);
  const videos = useStore((s) => s.videos);
  const toggleFavourite = useStore((s) => s.toggleFavourite);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(urlInput);
    if (videoId) {
      setError("");
      setUrlInput("");
      navigate(`/${videoId}`);
    } else {
      setError("Invalid YouTube URL or video ID");
    }
  };

  const handleVideoClick = (videoId: string) => {
    if (!longPressTriggered.current) {
      navigate(`/${videoId}`);
    }
  };

  const handleTouchStart = (videoId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      toggleFavourite(videoId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const visibleVideos =
    tab === "favourites"
      ? videos.filter((v) => v.favourite)
      : videos.filter((v) => !v.favourite);

  return (
    <div className="front">
      <div className="front__logo-row">
        <img
          src={`${import.meta.env.BASE_URL}icon.png`}
          alt="Tuback"
          className="front__logo"
        />
        {installPrompt && (
          <button className="front__install" onClick={handleInstall}>
            Install
          </button>
        )}
      </div>
      <form className="front__form" onSubmit={handleSubmit}>
        <input
          className="front__input"
          type="text"
          placeholder="Paste YouTube link or video ID"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setError("");
          }}
          autoComplete="off"
        />
        <button className="front__go" type="submit">
          Go
        </button>
      </form>
      {error && <p className="front__error">{error}</p>}

      <div className="front__tabs" role="tablist">
        <button
          className={`front__tab${tab === "history" ? " front__tab--active" : ""}`}
          role="tab"
          aria-selected={tab === "history"}
          aria-label="History"
          onClick={() => setTab("history")}
        >
          🕓
        </button>
        <button
          className={`front__tab${tab === "favourites" ? " front__tab--active" : ""}`}
          role="tab"
          aria-selected={tab === "favourites"}
          aria-label="Favourites"
          onClick={() => setTab("favourites")}
        >
          ⭐
        </button>
      </div>

      <div className="front__list">
        {visibleVideos.map((v) => (
          <button
            key={v.videoId}
            className={`front__item${v.favourite ? " front__item--fav" : ""}`}
            onClick={() => handleVideoClick(v.videoId)}
            onTouchStart={() => handleTouchStart(v.videoId)}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleFavourite(v.videoId);
            }}
          >
            <span className={`front__star${v.favourite ? "" : " front__star--empty"}`}>
              {v.favourite ? "★" : "☆"}
            </span>
            <span className="front__title">{v.title}</span>
          </button>
        ))}
      </div>

      <div className="front__footer">
        <button
          className={`scheme-toggle${colourScheme === "dark" ? " scheme-toggle--active" : ""}`}
          onClick={() =>
            setColourScheme(colourScheme === "dark" ? "light" : "dark")
          }
          aria-label="Toggle colour scheme"
        >
          {colourScheme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}
