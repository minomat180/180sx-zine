import { useState } from "react"
import styles from "./Desktop.module.css"
import Icon from "./Icon.jsx"
import Glitch from "./Glitch.jsx"
import { desktopIcons } from "./appSpecs.js"
import { isSmallScreen } from "./windowStore.js"
import { wallpaper, photos } from "../media.js"

/**
 * The desktop surface: wallpaper, CRT overlay, and the icon grid.
 * Windows are rendered by App on top of this, not inside it.
 */
export default function Desktop({ onLaunch }) {
  const [selected, setSelected] = useState(null)
  const bg = wallpaper ?? photos[0]?.src

  // Double-click opens on desktop; a single tap opens on touch, where there is
  // no hover and double-tap means zoom.
  const handleActivate = (id) => onLaunch(id)

  return (
    <div
      className={styles.desktop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null)
      }}
    >
      {bg && <div className={styles.wallpaper} style={{ backgroundImage: `url(${bg})` }} />}
      {/* Above the wallpaper so the tear is visible, below the icons so labels
          never flicker out from under you mid-click. */}
      <Glitch src={bg} />
      <div className={styles.vignette} />
      <div className={styles.crt} />

      <div className={styles.iconGrid}>
        {desktopIcons.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            className={styles.icon}
            data-selected={selected === id}
            onClick={() => {
              setSelected(id)
              // Touch has no hover and double-tap means zoom, so one tap opens.
              if (isSmallScreen()) handleActivate(id)
            }}
            onDoubleClick={() => handleActivate(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleActivate(id)
              }
            }}
          >
            <Icon name={icon} size={32} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
