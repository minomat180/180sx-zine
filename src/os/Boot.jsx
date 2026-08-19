import { useEffect, useState } from "react"
import styles from "./Boot.module.css"

// [text, dwell] — dwell is extra milliseconds to sit on that line before the
// next one prints. A real POST rattles through its list and then stalls on
// whatever it's actually waiting for hardware to answer; a flat cadence reads
// like a typewriter instead.
const LINES = [
  ["Kouki BIOS v4.10, An Energy Star Ally"],
  ["Copyright (C) 1996-1998", 320],
  [""],
  ["SR20DET-2000  CPU at 6000 rpm"],
  ["Memory Test :   205 PS  OK", 380],
  [""],
  ["Detecting IDE drives ...", 480],
  ["  Primary Master   : RPS13 KOUKI 1998"],
  ["  Primary Slave    : GARRETT T28"],
  ["  Secondary Master : VISCOUS LSD"],
  ["  Secondary Slave  : None", 280],
  [""],
  ["Fluid check ..."],
  ["  Oil pressure     : 4.2 bar      OK"],
  ["  Oil temperature  : 96 C         OK"],
  ["  Coolant          : 82 C         OK"],
  ["  Fuel pressure    : 3.0 bar      OK", 300],
  [""],
  ["Boost control ..."],
  ["  Wastegate        : 0.70 bar     OK"],
  ["  Knock sensor     : no activity  OK", 300],
  [""],
  ["Plug and play init ..."],
  ["  Pop-up lamp LHS  : raised"],
  ["  Pop-up lamp RHS  : raised", 250],
  ["", 200],
  ["Booting from C: ..."],
]

// 27 lines x 70ms = 1890ms, plus 2510ms of dwells, plus the hold = 5.0s.
const LINE_MS = 70
const HOLD_MS = 600

export default function Boot({ onDone }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (n >= LINES.length) {
      const t = setTimeout(onDone, HOLD_MS)
      return () => clearTimeout(t)
    }
    // The dwell belongs to the line already on screen, not the one about to
    // print — so it's read off the previous entry.
    const dwell = n > 0 ? (LINES[n - 1][1] ?? 0) : 0
    const t = setTimeout(() => setN((v) => v + 1), LINE_MS + dwell)
    return () => clearTimeout(t)
  }, [n, onDone])

  // Clicking or pressing anything skips straight to the desktop — a POST
  // screen is a joke, and a joke you can't skip is an obstacle.
  useEffect(() => {
    const skip = () => onDone()
    window.addEventListener("keydown", skip)
    return () => window.removeEventListener("keydown", skip)
  }, [onDone])

  return (
    <div className={styles.boot} onClick={onDone} role="button" tabIndex={0}>
      <pre>
        {LINES.slice(0, n)
          .map(([text]) => text)
          .join("\n")}
        {"\n"}
        <span className={styles.cursor} />
      </pre>
      <div className={styles.skip}>press any key to skip</div>
    </div>
  )
}

export function PoweredOff({ onReboot }) {
  return (
    <div className={styles.off} onClick={onReboot} role="button" tabIndex={0}>
      <div>
        It&apos;s now safe to turn off
        <br />
        your computer.
        <div style={{ fontSize: 13, color: "#6a6a6a", marginTop: 28 }}>
          (click to reboot)
        </div>
      </div>
    </div>
  )
}
