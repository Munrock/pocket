import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { extractVideoId } from '../utils'
import './FrontView.css'

export default function FrontView() {
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const colourScheme = useStore((s) => s.colourScheme)
  const setColourScheme = useStore((s) => s.setColourScheme)
  const videos = useStore((s) => s.videos)
  const toggleFavourite = useStore((s) => s.toggleFavourite)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const videoId = extractVideoId(urlInput)
    if (videoId) {
      setError('')
      setUrlInput('')
      navigate(`/${videoId}`)
    } else {
      setError('Invalid YouTube URL or video ID')
    }
  }

  const handleVideoClick = (videoId: string) => {
    if (!longPressTriggered.current) {
      navigate(`/${videoId}`)
    }
  }

  const handleTouchStart = (videoId: string) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      toggleFavourite(videoId)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const favourites = videos.filter((v) => v.favourite)
  const history = videos.filter((v) => !v.favourite)

  return (
    <div className="front">
      <form className="front__form" onSubmit={handleSubmit}>
        <input
          className="front__input"
          type="text"
          placeholder="Paste YouTube link or video ID"
          value={urlInput}
          onChange={(e) => { setUrlInput(e.target.value); setError('') }}
          autoComplete="off"
        />
        <button className="front__go" type="submit">Go</button>
      </form>
      {error && <p className="front__error">{error}</p>}

      <div className="front__list">
        {favourites.map((v) => (
          <button
            key={v.videoId}
            className="front__item front__item--fav"
            onClick={() => handleVideoClick(v.videoId)}
            onTouchStart={() => handleTouchStart(v.videoId)}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => { e.preventDefault(); toggleFavourite(v.videoId) }}
          >
            <span className="front__star">★</span>
            <span className="front__title">{v.title}</span>
          </button>
        ))}
        {history.map((v) => (
          <button
            key={v.videoId}
            className="front__item"
            onClick={() => handleVideoClick(v.videoId)}
            onTouchStart={() => handleTouchStart(v.videoId)}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => { e.preventDefault(); toggleFavourite(v.videoId) }}
          >
            <span className="front__star front__star--empty">☆</span>
            <span className="front__title">{v.title}</span>
          </button>
        ))}
      </div>

      <div className="front__footer">
        <button
          className={`scheme-toggle${colourScheme === 'dark' ? ' scheme-toggle--active' : ''}`}
          onClick={() => setColourScheme(colourScheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle colour scheme"
        >
          {colourScheme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}
