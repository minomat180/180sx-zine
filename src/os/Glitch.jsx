import { useEffect, useState } from "react"
import styles from "./Glitch.module.css"

/**
 * Occasional signal glitch over the wallpaper: a few horizontal slices tear
 * sideways, and some blown-out white blocks flash on top.
 *
 * The tear bands are real slices of whatever image is on the desktop, not a
 * baked-in effect — they re-render the same `src` at the same size and offset
 * their own clip window, so swapping the wallpaper needs no changes here.
 *
 * Everything is measured in `vh` on purpose. The desktop box is
 * `100vh - var(--taskbar-h)` tall, so a band positioned in `vh` lines its
 * slice up with the wallpaper underneath at any viewport size, with no
 * measuring and no resize listener.
 */

// Quiet stretch between bursts, then how long a burst lasts. Long idle, short
// burst — the point is that it's rare enough to catch you off guard.
const IDLE_MIN = 7000
const IDLE_MAX = 20000
// Must outlast the longest animation in Glitch.module.css (the 0.34s tear),
// or React unmounts the layer mid-stutter and the glitch never plays out.
const BURST_MIN = 380
const BURST_MAX = 520

const rand = (min, max) => min + Math.random() * (max - min)

function makeBands() {
  const bands = []

  // Half the time, one big slab low on the screen — the "bottom half" tear.
  if (Math.random() < 0.5) {
    bands.push({
      y: rand(52, 68),
      h: rand(18, 34),
      dx: rand(-3.2, 3.2),
      bright: rand(0.9, 1.25),
    })
  }

  // Plus one or two thin ones anywhere.
  const thin = 1 + Math.round(Math.random())
  for (let i = 0; i < thin; i++) {
    bands.push({
      y: rand(4, 88),
      h: rand(1.2, 6),
      dx: rand(-5, 5),
      bright: rand(0.8, 1.5),
    })
  }

  return bands.map((b, i) => ({ ...b, key: i }))
}

function makeBlocks() {
  const n = Math.round(rand(0, 5))
  return Array.from({ length: n }, (_, key) => ({
    key,
    x: rand(2, 88),
    y: rand(4, 90),
    w: rand(2.5, 14),
    h: rand(0.6, 3.4),
    dim: Math.random() < 0.35,
  }))
}

export default function Glitch({ src }) {
  const [burst, setBurst] = useState(null)

  useEffect(() => {
    if (!src) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    let timer
    let seq = 0

    const run = () => {
      // Nothing to see on a background tab, and firing anyway just burns
      // battery on a laptop that's already been asked to run a CRT overlay.
      if (document.hidden) {
        timer = setTimeout(run, IDLE_MIN)
        return
      }
      seq += 1
      setBurst({ id: seq, bands: makeBands(), blocks: makeBlocks() })
      timer = setTimeout(() => {
        setBurst(null)
        timer = setTimeout(run, rand(IDLE_MIN, IDLE_MAX))
      }, rand(BURST_MIN, BURST_MAX))
    }

    timer = setTimeout(run, rand(2000, 6000))
    return () => clearTimeout(timer)
  }, [src])

  if (!burst) return null

  return (
    // Keyed on the burst so React tears the whole layer down and rebuilds it,
    // which restarts the CSS animations from frame zero every time.
    <div className={styles.layer} key={burst.id}>
      {burst.bands.map((b) => (
        <div
          key={b.key}
          className={styles.band}
          style={{
            "--y": `${b.y}vh`,
            "--h": `${b.h}vh`,
            "--dx": `${b.dx}%`,
            "--bright": b.bright,
          }}
        >
          <div className={styles.slice} style={{ backgroundImage: `url(${src})` }} />
        </div>
      ))}

      {burst.blocks.map((k) => (
        <div
          key={k.key}
          className={styles.block}
          data-dim={k.dim}
          style={{
            left: `${k.x}%`,
            top: `${k.y}%`,
            width: `${k.w}%`,
            height: `${k.h}vh`,
          }}
        />
      ))}
    </div>
  )
}
