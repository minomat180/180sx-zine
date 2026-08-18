import { useEffect, useRef, useState } from "react"
import styles from "./Taskbar.module.css"
import Icon from "./Icon.jsx"
import { APPS } from "./appSpecs.js"
import { useWindows, focus, minimize, restore } from "./windowStore.js"

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // Tick on the minute boundary rather than every 60s from mount, so the
    // displayed time never lags behind the real clock.
    let timer
    const schedule = () => {
      const ms = 60000 - (Date.now() % 60000)
      timer = setTimeout(() => {
        setNow(new Date())
        schedule()
      }, ms)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])
  return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export default function Taskbar({
  startOpen,
  onToggleStart,
  extraTasks = [],
  volume,
  onVolume,
}) {
  const windows = useWindows()
  const time = useClock()
  const [volOpen, setVolOpen] = useState(false)
  const trayRef = useRef(null)

  useEffect(() => {
    if (!volOpen) return
    const onDown = (e) => {
      if (!trayRef.current?.contains(e.target)) setVolOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [volOpen])

  const topZ = windows.reduce((m, w) => (w.minimized ? m : Math.max(m, w.z)), -1)

  return (
    <div className={styles.taskbar}>
      <button
        type="button"
        className={styles.start}
        data-start-button
        data-open={startOpen}
        onClick={onToggleStart}
      >
        <Icon name="computer" size={16} />
        <span>Start</span>
      </button>

      <div className={styles.divider} />

      <div className={styles.tasks}>
        {extraTasks.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.task}
            data-active={t.active}
            onClick={t.onClick}
            title={t.title}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.title}</span>
          </button>
        ))}

        {windows.map((w) => (
          <button
            key={w.id}
            type="button"
            className={styles.task}
            data-active={!w.minimized && w.z === topZ}
            title={w.title}
            onClick={() => {
              if (w.minimized) restore(w.id)
              else if (w.z === topZ) minimize(w.id)
              else focus(w.id)
            }}
          >
            <Icon name={APPS[w.appId]?.icon ?? "note"} size={14} />
            <span>{w.title}</span>
          </button>
        ))}
      </div>

      <div className={styles.tray} ref={trayRef}>
        <button
          type="button"
          className={styles.volumeButton}
          onClick={() => setVolOpen((v) => !v)}
          aria-label="Volume"
        >
          <SpeakerGlyph muted={volume === 0} />
        </button>
        <div className={styles.clock}>{time}</div>

        {volOpen && (
          <div className={`${styles.volumePopup} window`}>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => onVolume(Number(e.target.value) / 100)}
              aria-label="Volume level"
            />
            <div>Volume</div>
          </div>
        )}
      </div>
    </div>
  )
}

function SpeakerGlyph({ muted }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <path d="M3 6h3l4-3v10l-4-3H3z" fill="#000" />
      {muted ? (
        <path d="M11 5l4 6M15 5l-4 6" stroke="#c00" strokeWidth="1.5" />
      ) : (
        <>
          <path d="M11 5v6" stroke="#000" />
          <path d="M13 3v10" stroke="#000" />
        </>
      )}
    </svg>
  )
}
