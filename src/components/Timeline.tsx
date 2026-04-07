import { useStore } from '../store'
import type { Bookmark } from '../store'
import './Timeline.css'

interface TimelineProps {
  onSeek: (time: number) => void
}

export default function Timeline({ onSeek }: TimelineProps) {
  const currentTime = useStore((s) => s.currentTime)
  const duration = useStore((s) => s.duration)
  const timelineRows = useStore((s) => s.timelineRows)
  const bookmarks = useStore((s) => s.getBookmarks())
  const looping = useStore((s) => s.looping)
  const loopStart = useStore((s) => s.loopStart)
  const loopEnd = useStore((s) => s.loopEnd)
  const manualLoopPicking = useStore((s) => s.manualLoopPicking)
  const handleManualLoopTap = useStore((s) => s.handleManualLoopTap)

  if (duration <= 0) return null

  const rowDuration = duration / timelineRows

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, rowIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = rowIndex * rowDuration + fraction * rowDuration

    if (manualLoopPicking) {
      handleManualLoopTap(time)
    } else {
      onSeek(time)
    }
  }

  const rows = Array.from({ length: timelineRows }, (_, i) => {
    const rowStart = i * rowDuration
    const rowEnd = rowStart + rowDuration
    const isLastRow = i === timelineRows - 1
    const progress = Math.max(0, Math.min(1, (currentTime - rowStart) / rowDuration))
    const rowBookmarks = bookmarks.filter(
      (b: Bookmark) => b.time >= rowStart && (isLastRow ? b.time <= rowEnd : b.time < rowEnd),
    )

    // Loop region within this row
    let loopLeft: number | null = null
    let loopRight: number | null = null
    if (looping && loopStart && loopEnd) {
      const ls = Math.max(rowStart, loopStart.time)
      const le = Math.min(rowEnd, loopEnd.time)
      if (ls < le) {
        loopLeft = ((ls - rowStart) / rowDuration) * 100
        loopRight = ((le - rowStart) / rowDuration) * 100
      }
    }

    return (
      <div
        key={i}
        className={`timeline__row${manualLoopPicking ? ' timeline__row--picking' : ''}`}
        onClick={(e) => handleClick(e, i)}
      >
        <div className="timeline__track">
          {loopLeft !== null && loopRight !== null && (
            <div
              className="timeline__loop-region"
              style={{ left: `${loopLeft}%`, width: `${loopRight - loopLeft}%` }}
            />
          )}
          <div className="timeline__progress" style={{ width: `${progress * 100}%` }} />
          {rowBookmarks.map((b: Bookmark) => {
            const pos = ((b.time - rowStart) / rowDuration) * 100
            return (
              <div
                key={b.id}
                className="timeline__bookmark"
                style={{ left: `${pos}%` }}
                title={`${Math.round(b.time)}s`}
              />
            )
          })}
        </div>
      </div>
    )
  })

  return <div className="timeline">{rows}</div>
}
