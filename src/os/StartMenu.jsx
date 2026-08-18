import { useEffect, useRef, useState } from "react"
import styles from "./StartMenu.module.css"
import Icon from "./Icon.jsx"
import { APPS, DESKTOP_EXTRAS } from "./appSpecs.js"

const PROGRAMS = [
  ...Object.entries(APPS)
    .filter(([, s]) => s.desktop)
    .map(([id, s]) => ({ id, icon: s.icon, label: s.label })),
  ...DESKTOP_EXTRAS,
]

export default function StartMenu({ onClose, onLaunch, onShutdown }) {
  const [subOpen, setSubOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      // The Start button itself toggles; ignore clicks that land on it.
      if (ref.current?.contains(e.target)) return
      if (e.target.closest("[data-start-button]")) return
      onClose()
    }
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const launch = (id) => {
    onLaunch(id)
    onClose()
  }

  return (
    <div className={`${styles.menu} window`} ref={ref}>
      <div className={styles.spine}>
        <div className={styles.spineText}>180SX</div>
      </div>

      <div className={styles.items}>
        <div
          className={styles.submenuHost}
          onPointerEnter={() => setSubOpen(true)}
          onPointerLeave={() => setSubOpen(false)}
        >
          <button
            type="button"
            className={styles.item}
            data-has-submenu="true"
            onClick={() => setSubOpen((v) => !v)}
          >
            <Icon name="folder" size={20} />
            Programs
          </button>

          {subOpen && (
            <div className={`${styles.submenu} window`}>
              {PROGRAMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.item}
                  onClick={() => launch(p.id)}
                >
                  <Icon name={p.icon} size={20} />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" className={styles.item} onClick={() => launch("about")}>
          <Icon name="note" size={20} />
          About
        </button>

        <div className={styles.separator} />

        <button type="button" className={styles.item} onClick={onShutdown}>
          <Icon name="shutdown" size={20} />
          Shut Down…
        </button>
      </div>
    </div>
  )
}
