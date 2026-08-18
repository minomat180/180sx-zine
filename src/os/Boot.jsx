import { useEffect, useState } from "react"
import styles from "./Boot.module.css"

const LINES = [
  "Kouki BIOS v4.10, An Energy Star Ally",
  "Copyright (C) 1996-1998",
  "",
  "SR20DET-2000  CPU at 6000 rpm",
  "Memory Test :   205 PS  OK",
  "",
  "Detecting IDE drives ...",
  "  Primary Master   : RPS13 KOUKI 1998",
  "  Primary Slave    : GARRETT T28",
  "  Secondary Master : VISCOUS LSD",
  "",
  "Booting from C: ...",
]

const LINE_MS = 90

export default function Boot({ onDone }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (n >= LINES.length) {
      const t = setTimeout(onDone, 420)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setN((v) => v + 1), LINE_MS)
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
        {LINES.slice(0, n).join("\n")}
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
