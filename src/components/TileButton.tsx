import { useStore } from '../store'
import './TileButton.css'

interface TileButtonProps {
  label: string
  icon?: string
  active?: boolean
  onClick: () => void
}

export default function TileButton({ label, icon, active, onClick }: TileButtonProps) {
  const tileSize = useStore((s) => s.tileSize)

  return (
    <button
      className={`tile-btn${active ? ' tile-btn--active' : ''}`}
      style={{ width: tileSize, height: tileSize }}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="tile-btn__icon">{icon ?? label}</span>
    </button>
  )
}
