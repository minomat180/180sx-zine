import { useEffect, useRef, useState } from "react"
import styles from "./Generator.module.css"
import { OVERLAYS, drawOrder } from "./overlays.js"

const MAX_EDGE = 1600

/**
 * Upload a photo, stack overlays on it, download the result.
 *
 * The reference site emails the render; that needs a backend this project
 * doesn't have, so it's a download instead. Everything stays in the browser —
 * the image is never uploaded anywhere.
 */
export default function Generator() {
  const [img, setImg] = useState(null)
  const [filename, setFilename] = useState("")
  const [active, setActive] = useState(() => new Set(["badge"]))
  const [name, setName] = useState("")
  const canvasRef = useRef(null)
  const fileRef = useRef(null)

  // Redraw whenever anything changes. Cheap enough that debouncing the text
  // field would just add lag.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !img) return

    // Cap the long edge so a 6000px phone photo doesn't stall the main thread.
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    // Draw in layer order, not click order, so the result is deterministic.
    drawOrder
      .filter((o) => active.has(o.id))
      .forEach((o) => o.draw(ctx, { w, h, name }))
  }, [img, active, name])

  // Revoke the object URL when the photo is replaced or the window closes.
  useEffect(() => {
    return () => {
      if (img?.src?.startsWith("blob:")) URL.revokeObjectURL(img.src)
    }
  }, [img])

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => setImg(image)
    image.src = url
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `180sx-${(name || "typex").toLowerCase().replace(/\W+/g, "-")}.png`
      a.click()
      // Revoking synchronously can cancel the download before the browser has
      // read the blob. One turn of the event loop is enough.
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }, "image/png")
  }

  const toggle = (id) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.wrap}>
      <div className={styles.steps}>
        <span className={styles.step} data-done={!!img} data-current={!img}>
          1. Photo
        </span>
        <span className={styles.step} data-done={!!img} data-current={!!img}>
          2. Overlays
        </span>
        <span className={styles.step} data-current={!!img}>
          3. Save
        </span>
      </div>

      <div className={styles.stage}>
        {img ? (
          <canvas ref={canvasRef} />
        ) : (
          <div className={styles.empty}>
            No image loaded.
            <br />
            Pick a photo of your car to start.
            <br />
            <br />
            Nothing leaves your browser.
          </div>
        )}
      </div>

      <div className={styles.presets}>
        {OVERLAYS.map((o) => (
          <button
            key={o.id}
            type="button"
            data-active={active.has(o.id)}
            disabled={!img}
            onClick={() => toggle(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <label htmlFor="gen-name">Caption</label>
        <input
          id="gen-name"
          className={styles.nameInput}
          value={name}
          maxLength={28}
          placeholder="180SX TYPE X"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFile}
          onChange={onFile}
        />
        <button type="button" onClick={() => fileRef.current?.click()}>
          Open File…
        </button>
        <button type="button" disabled={!img} onClick={download}>
          Save As…
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </span>
      </div>
    </div>
  )
}
