import { useCallback, useRef } from "react"
import styles from "./Win98Window.module.css"
import { close, focus, minimize, move, toggleMax, isSmallScreen } from "./windowStore.js"

const TITLEBAR_H = 22

/**
 * A draggable Win98 window frame. Chrome comes from 98.css; this adds
 * positioning, dragging and the title-bar buttons.
 */
export default function Win98Window({ win, children }) {
  const dragRef = useRef(null)

  const onPointerDown = useCallback(
    (e) => {
      focus(win.id)
      // Only drag from the bar itself — not from the min/max/close buttons.
      if (e.target.closest("[data-no-drag]")) return
      if (win.maximized || isSmallScreen()) return

      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
      document.body.classList.add("dragging")
    },
    [win.id, win.x, win.y, win.maximized],
  )

  const onPointerMove = useCallback(
    (e) => {
      const d = dragRef.current
      if (!d) return
      // Clamp so the title bar can always be grabbed again: it may hang off the
      // right and bottom, but never past the edges entirely, and never above 0.
      const x = Math.min(
        window.innerWidth - 60,
        Math.max(60 - win.w, e.clientX - d.dx),
      )
      const y = Math.min(
        window.innerHeight - TITLEBAR_H - 28,
        Math.max(0, e.clientY - d.dy),
      )
      move(win.id, x, y)
    },
    [win.id, win.w],
  )

  const endDrag = useCallback((e) => {
    if (!dragRef.current) return
    dragRef.current = null
    document.body.classList.remove("dragging")
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <div
      className={`${styles.frame} ${win.maximized ? styles.maximized : ""}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => focus(win.id)}
    >
      <div className="window">
        <div
          className={`title-bar ${styles.titlebar}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={() => toggleMax(win.id)}
        >
          <div className={`title-bar-text ${styles.titleText}`}>{win.title}</div>
          <div className="title-bar-controls" data-no-drag>
            <button aria-label="Minimize" onClick={() => minimize(win.id)} />
            <button aria-label="Maximize" onClick={() => toggleMax(win.id)} />
            <button aria-label="Close" onClick={() => close(win.id)} />
          </div>
        </div>
        <div className={`window-body ${styles.body}`}>{children}</div>
      </div>
    </div>
  )
}
