import { useStore } from "../store";
import "./TileButton.css";

interface TileButtonProps {
  label: string;
  icon?: string;
  iconNode?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}

export default function TileButton({
  label,
  icon,
  iconNode,
  active,
  onClick,
}: TileButtonProps) {
  const tileSize = useStore((s) => s.tileSize);

  return (
    <button
      className={`tile-btn${active ? " tile-btn--active" : ""}`}
      style={
        {
          width: tileSize,
          height: tileSize,
          "--tile-size": `${tileSize}px`,
        } as React.CSSProperties
      }
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="tile-btn__icon">{iconNode ?? icon ?? label}</span>
    </button>
  );
}
