import { useEffect, useRef, useState } from "react"
import styles from "./Analyzer.module.css"
import { getAmp, subscribeAmp } from "../os/ampBridge.js"

const BARS = 32
const MIN_HZ = 40
const MAX_HZ = 16000

// Drawn at a fixed rate rather than every animation frame. 60fps of raw FFT
// strobes; halving it settles the picture without costing any resolution,
// which is the better trade when the alternative is quantising the bars into
// blocks to hide the jitter.
const FPS = 30
const FRAME_MS = 1000 / FPS

// Bars jump most of the way to a new peak immediately so transients still
// register, then sink slowly. Rates are per drawn frame, so they're tuned to
// FPS above — at 60fps these same numbers would be roughly twice as fast.
const ATTACK = 0.6
const RELEASE = 0.18

// How far a peak cap falls per frame. Slow enough to hang and be visible,
// fast enough not to look stuck.
const PEAK_FALL = 0.008

const MODES = [
  ["spectrum", "Spectrum"],
  ["scope", "Oscilloscope"],
  ["radial", "Radial"],
]

/**
 * Reads Fakeamp's own AnalyserNode and draws it.
 *
 * Webamp exposes `media.getAnalyser()`, so this is the real signal coming out
 * of the player rather than a second decode of the same file — the bars are in
 * sync with what you're hearing because it is what you're hearing.
 */
export default function Analyzer() {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState("spectrum")
  const [amp, setAmp] = useState(() => getAmp())
  const [error, setError] = useState(null)

  // The draw loop reads this instead of being torn down and rebuilt on every
  // mode change, which would drop a frame and reset the peak caps.
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => subscribeAmp(setAmp), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !amp) return

    let analyser
    try {
      analyser = amp.media.getAnalyser()
    } catch (e) {
      setError(String(e?.message ?? e))
      return
    }
    setError(null)

    // fftSize is left exactly as Webamp set it. Changing it here would also
    // change what Webamp's own built-in visualizer sees, since it's one shared
    // node — reading from it is free, reconfiguring it is not.
    const bins = analyser.frequencyBinCount
    const nyquist = analyser.context.sampleRate / 2
    const freq = new Uint8Array(bins)
    const time = new Uint8Array(analyser.fftSize)

    // Log-spaced band edges. Linear bins put almost everything in the bottom
    // two bars and leave the rest dead, because pitch is logarithmic.
    const edges = []
    for (let i = 0; i <= BARS; i++) {
      const hz = MIN_HZ * (MAX_HZ / MIN_HZ) ** (i / BARS)
      edges.push(Math.max(0, Math.min(bins - 1, Math.round((hz / nyquist) * bins))))
    }
    for (let i = 1; i < edges.length; i++) {
      if (edges[i] <= edges[i - 1]) edges[i] = edges[i - 1] + 1
    }

    const peaks = new Float32Array(BARS)
    const levels = new Float32Array(BARS)
    const ctx = canvas.getContext("2d")
    let raf = 0
    let gradient = null
    let lastDraw = 0

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
      gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
      gradient.addColorStop(0, "#1f7a3d")
      gradient.addColorStop(0.55, "#39ff6a")
      gradient.addColorStop(0.82, "#e8d84a")
      gradient.addColorStop(1, "#ff5a4a")
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const drawSpectrum = (w, h) => {
      analyser.getByteFrequencyData(freq)
      const gap = Math.max(1, Math.round(w / (BARS * 10)))
      const bw = (w - gap * (BARS - 1)) / BARS

      for (let b = 0; b < BARS; b++) {
        let sum = 0
        let n = 0
        for (let i = edges[b]; i < edges[b + 1] && i < bins; i++) {
          sum += freq[i]
          n++
        }
        const target = n ? sum / n / 255 : 0
        levels[b] += (target - levels[b]) * (target > levels[b] ? ATTACK : RELEASE)
        const v = levels[b]

        const x = Math.round(b * (bw + gap))
        const barW = Math.max(1, Math.ceil(bw))

        ctx.fillStyle = gradient
        ctx.fillRect(x, h - v * h, barW, v * h)

        peaks[b] = Math.max(v, peaks[b] - PEAK_FALL)
        const py = h - peaks[b] * h
        ctx.fillStyle = "#dfe4e8"
        ctx.fillRect(x, Math.max(0, Math.min(h - 2, py)), barW, 2)
      }
    }

    const drawScope = (w, h) => {
      analyser.getByteTimeDomainData(time)
      ctx.strokeStyle = "#39ff6a"
      ctx.lineWidth = Math.max(1, Math.round(dpr))
      ctx.beginPath()
      const step = time.length / w
      for (let x = 0; x < w; x++) {
        // 128 is silence in a byte time-domain buffer, not 0.
        const v = time[Math.floor(x * step)] / 128 - 1
        const y = h / 2 + v * (h / 2) * 0.92
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // The same waveform wrapped around a circle: angle carries time, radius
    // carries amplitude. Closed into a loop so the end meets the start.
    const drawRadial = (w, h) => {
      analyser.getByteTimeDomainData(time)
      const cx = w / 2
      const cy = h / 2
      const span = Math.min(w, h)
      const base = span * 0.26
      const swing = span * 0.19
      const points = 480

      ctx.strokeStyle = "rgba(57, 255, 106, 0.16)"
      ctx.lineWidth = Math.max(1, Math.round(dpr))
      ctx.beginPath()
      ctx.arc(cx, cy, base, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = "#39ff6a"
      ctx.lineWidth = Math.max(1, Math.round(dpr * 1.4))
      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const v = time[Math.floor((i / points) * time.length) % time.length] / 128 - 1
        const r = base + v * swing
        const a = (i / points) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      if (t - lastDraw < FRAME_MS) return
      lastDraw = t

      const w = canvas.width
      const h = canvas.height
      ctx.fillStyle = "#0c0c0c"
      ctx.fillRect(0, 0, w, h)
      if (modeRef.current === "scope") drawScope(w, h)
      else if (modeRef.current === "radial") drawRadial(w, h)
      else drawSpectrum(w, h)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [amp])

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {!amp && (
          <div className={styles.idle}>
            Fakeamp is not running.
            <br />
            Open it from the desktop and press play.
          </div>
        )}
        {error && <div className={styles.idle}>No signal: {error}</div>}
      </div>

      <div className={styles.controls}>
        {MODES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-active={mode === id}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="status-bar">
        <p className="status-bar-field">{amp ? "Signal OK" : "No input"}</p>
        <p className="status-bar-field">
          {mode === "spectrum" ? `${BARS} bands` : "Time domain"}
        </p>
        <p className="status-bar-field">{FPS} fps</p>
      </div>
    </div>
  )
}
