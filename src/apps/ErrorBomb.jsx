import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./ErrorBomb.module.css"
import Icon from "../os/Icon.jsx"
import { errorChord } from "../audio.js"

const MESSAGES = [
  "SR20DET has performed an illegal operation.",
  "Boost leak detected in module KOUKI.DLL",
  "Insufficient tyres.",
  "Cannot find POPUP.SYS — check the headlight motors.",
  "Rust found in sector 0. Continue anyway?",
  "Your yen-to-euro conversion is not responding.",
  "General protection fault at 0x0180SX",
  "The differential is limited and so is your budget.",
  "Shipping quote exceeded available memory.",
  "Auction sheet grade R. This is fine.",
  "Third pedal not detected.",
  "Compression test failed. Emotionally.",
]

// Hard ceiling. Two-per-click doubles fast, and an uncapped bomb locks the tab.
const MAX = 30

let nextKey = 1

function spawn() {
  const w = 300
  const h = 130
  return {
    key: nextKey++,
    msg: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    x: Math.round(Math.random() * Math.max(0, window.innerWidth - w - 8)),
    y: Math.round(Math.random() * Math.max(0, window.innerHeight - h - 60)),
  }
}

/**
 * CLICK ME. Every OK spawns two more until MAX, then the whole thing collapses
 * into a BSOD and clears.
 */
export default function ErrorBomb({ active, onDone }) {
  const [dialogs, setDialogs] = useState([])
  const [bsod, setBsod] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (active && !started.current) {
      started.current = true
      setDialogs([spawn()])
      errorChord()
    }
    if (!active) {
      started.current = false
      setDialogs([])
      setBsod(false)
    }
  }, [active])

  const dismiss = useCallback((key) => {
    errorChord()
    setDialogs((prev) => {
      const rest = prev.filter((d) => d.key !== key)
      if (rest.length + 2 > MAX) {
        // Ceiling reached: stop multiplying and blue-screen instead.
        setBsod(true)
        return []
      }
      return [...rest, spawn(), spawn()]
    })
  }, [])

  const finish = () => {
    setBsod(false)
    setDialogs([])
    onDone()
  }

  if (bsod) {
    return (
      <div className={styles.bsod} onClick={finish} role="button" tabIndex={0}>
        <pre>
          {"                        "}
          <b>Kouki</b>
          {`

  A fatal exception 0E has occurred at 0180:5X20DET00 in module
  KOUKI.DLL. The current application will be terminated.

  *  Press any key to terminate the current application.
  *  Press CTRL+ALT+DEL again to restart your computer. You will
     lose any unsaved information in all applications.

                     Press any key to continue`}
        </pre>
      </div>
    )
  }

  return dialogs.map((d) => (
    <div
      key={d.key}
      className={`${styles.dialog} window`}
      style={{ left: d.x, top: d.y }}
    >
      <div className="title-bar">
        <div className="title-bar-text" style={{ fontFamily: "var(--font-mono)" }}>
          C:\Error
        </div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={() => dismiss(d.key)} />
        </div>
      </div>
      <div className="window-body" style={{ margin: 0 }}>
        <div className={styles.body}>
          <Icon name="error" size={32} />
          <div className={styles.text}>{d.msg}</div>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => dismiss(d.key)}>
            OK
          </button>
        </div>
      </div>
    </div>
  ))
}
