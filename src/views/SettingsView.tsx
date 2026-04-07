import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { ButtonId, TileFraction } from '../store'
import './SettingsView.css'

const TILE_OPTIONS: { label: string; value: TileFraction }[] = [
  { label: '2 across', value: 2 },
  { label: '3 across', value: 3 },
  { label: '4 across', value: 4 },
  { label: '5 across', value: 5 },
  { label: '6 across', value: 6 },
  { label: '7 across', value: 7 },
]

const BUTTON_LABELS: Record<ButtonId, string> = {
  playPause: 'Play / Pause',
  forward: 'Forward',
  backward: 'Backward',
  addBookmark: 'Add Bookmark',
  removeBookmark: 'Remove Bookmark',
  speedUp: 'Speed Up',
  slowDown: 'Slow Down',
  autoLoop: 'Auto Loop',
  manualLoop: 'Manual Loop',
  settings: 'Settings',
  submenu: 'Submenu',
  favourite: 'Favourite',
  openYouTube: 'Open in YouTube',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
}

export default function SettingsView() {
  const { videoId } = useParams<{ videoId?: string }>()
  const navigate = useNavigate()

  const colourScheme = useStore((s) => s.colourScheme)
  const setColourScheme = useStore((s) => s.setColourScheme)
  const tileFraction = useStore((s) => s.tileFraction)
  const setTileFraction = useStore((s) => s.setTileFraction)
  const preRollDuration = useStore((s) => s.preRollDuration)
  const setPreRollDuration = useStore((s) => s.setPreRollDuration)
  const timelineRows = useStore((s) => s.timelineRows)
  const setTimelineRows = useStore((s) => s.setTimelineRows)
  const mainButtons = useStore((s) => s.mainButtons)
  const submenuButtons = useStore((s) => s.submenuButtons)
  const setMainButtons = useStore((s) => s.setMainButtons)
  const setSubmenuButtons = useStore((s) => s.setSubmenuButtons)

  const handleBack = () => {
    if (videoId) {
      navigate(`/${videoId}`)
    } else {
      navigate('/front')
    }
  }

  const moveToSubmenu = (id: ButtonId) => {
    if (id === 'submenu') return
    setMainButtons(mainButtons.filter((b) => b !== id))
    setSubmenuButtons([...submenuButtons, id])
  }

  const moveToMain = (id: ButtonId) => {
    if (id === 'submenu') return
    setSubmenuButtons(submenuButtons.filter((b) => b !== id))
    setMainButtons([...mainButtons, id])
  }

  return (
    <div className="settings">
      <div className="settings__header">
        <button className="settings__back" onClick={handleBack}>← Back</button>
        <h2 className="settings__title">Settings</h2>
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Colour Scheme</h3>
        <div className="settings__row">
          <button
            className={`settings__opt${colourScheme === 'dark' ? ' settings__opt--active' : ''}`}
            onClick={() => setColourScheme('dark')}
          >
            Dark
          </button>
          <button
            className={`settings__opt${colourScheme === 'light' ? ' settings__opt--active' : ''}`}
            onClick={() => setColourScheme('light')}
          >
            Light
          </button>
        </div>
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Tile Size</h3>
        <div className="settings__row settings__row--wrap">
          {TILE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`settings__opt${tileFraction === opt.value ? ' settings__opt--active' : ''}`}
              onClick={() => setTileFraction(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Timeline Rows (default: {timelineRows})</h3>
        <div className="settings__row">
          <button className="settings__opt" onClick={() => setTimelineRows(Math.max(1, timelineRows - 1))}>−</button>
          <span className="settings__value">{timelineRows}</span>
          <button className="settings__opt" onClick={() => setTimelineRows(timelineRows + 1)}>+</button>
        </div>
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Pre-roll Duration: {preRollDuration}s</h3>
        <input
          className="settings__slider"
          type="range"
          min={1}
          max={10}
          step={1}
          value={preRollDuration}
          onChange={(e) => setPreRollDuration(Number(e.target.value))}
        />
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Main Buttons</h3>
        <div className="settings__buttons-list">
          {mainButtons.map((id) => (
            <div key={id} className="settings__btn-item">
              <span>{BUTTON_LABELS[id]}</span>
              {id !== 'submenu' && (
                <button className="settings__move" onClick={() => moveToSubmenu(id)}>→ Submenu</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings__section">
        <h3 className="settings__label">Submenu Buttons</h3>
        <div className="settings__buttons-list">
          {submenuButtons.map((id) => (
            <div key={id} className="settings__btn-item">
              <span>{BUTTON_LABELS[id]}</span>
              <button className="settings__move" onClick={() => moveToMain(id)}>→ Main</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
