// Synthesised UI sounds. The Windows 98 error chord is a copyrighted asset and
// shipping a .wav for two notes is overkill, so it's generated — the same
// approach the older single-file 180sx page took for its engine note.

let ctx = null
let masterGain = null

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(ctx.destination)
  }
  // Browsers suspend the context until a gesture; every caller here is one.
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

export function setUiVolume(v) {
  if (masterGain) masterGain.gain.value = v
}

function blip({ freq, start, duration, type = "square", gain = 0.12 }) {
  const c = audio()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + start
  // Short attack/release, otherwise square waves click at the edges.
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008)
  g.gain.setValueAtTime(gain, t0 + duration - 0.03)
  g.gain.linearRampToValueAtTime(0, t0 + duration)
  osc.connect(g).connect(masterGain)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Two-note descending sting, roughly the shape of the 98 error sound. */
export function errorChord() {
  try {
    blip({ freq: 622.25, start: 0, duration: 0.13 })
    blip({ freq: 415.3, start: 0.13, duration: 0.22 })
  } catch {
    // Audio is decoration. If the context can't start, the bomb still works.
  }
}

/** Rising three-note chime for boot. */
export function bootChime() {
  try {
    blip({ freq: 392, start: 0, duration: 0.16, type: "triangle", gain: 0.09 })
    blip({ freq: 523.25, start: 0.14, duration: 0.16, type: "triangle", gain: 0.09 })
    blip({ freq: 659.25, start: 0.28, duration: 0.34, type: "triangle", gain: 0.09 })
  } catch {
    /* no-op */
  }
}
