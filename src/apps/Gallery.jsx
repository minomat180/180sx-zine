import { useState } from "react"
import styles from "./Gallery.module.css"
import { photos } from "../media.js"

const filename = (src) => src.split("/").pop()

export default function Gallery() {
  const [i, setI] = useState(0)
  // Natural size is only known once the browser has decoded the image, so the
  // status bar fills in on load rather than being hardcoded per photo.
  const [dims, setDims] = useState(null)

  if (photos.length === 0) {
    return <div style={{ padding: 12, fontFamily: "var(--font-mono)" }}>No photos in media.js</div>
  }

  const photo = photos[i]
  const step = (n) => {
    setDims(null)
    setI((prev) => (prev + n + photos.length) % photos.length)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <img
          src={photo.src}
          alt={photo.caption ?? filename(photo.src)}
          onLoad={(e) => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
        />
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={() => step(-1)}>
          {"<< Prev"}
        </button>
        <div className={styles.caption}>{photo.caption ?? ""}</div>
        <button type="button" onClick={() => step(1)}>
          {"Next >>"}
        </button>
      </div>

      <div className={styles.statusbar}>
        <div className={styles.statusField}>{filename(photo.src)}</div>
        <div className={styles.statusField}>{dims ? `${dims.w} x ${dims.h}` : "…"}</div>
        <div className={styles.statusField}>
          {i + 1} of {photos.length}
        </div>
      </div>
    </div>
  )
}
