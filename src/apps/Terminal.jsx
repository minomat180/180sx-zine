import { useEffect, useRef, useState } from "react"
import styles from "./Terminal.module.css"
import { APPS } from "../os/appSpecs.js"
import { specsText } from "../media.js"

const PROMPT = "C:\\User>"

// Block letters rather than a drawing. A car outline needs more rows than
// the console has (the window is 460x300), and anything detailed enough to
// read turns to mush at 11px.
const ART = String.raw`
 ██  ████ ████ ████ █  █
███  █  █ █  █ █    █  █
 ██  ████ █  █ ████  ██ 
 ██  █  █ █  █    █ █  █
████ ████ ████ ████ █  █
`

const HELP = [
  "Available commands:",
  "",
  "  help              this list",
  "  specs             print the Type X spec sheet",
  "  dir | ls          list what's on this machine",
  "  open <name>       open a window  (try: open gallery)",
  "  play | stop       control Fakeamp",
  "  fastfetch         system information",
  "  whoami            who is at this terminal",
  "  drift             don't",
  "  cls | clear       clear the screen",
]

const FASTFETCH = (uptime) => [
  { kind: "art", text: ART },
  { text: "user@rps13" },
  { text: "----------" },
  { text: "OS ........ Kouki 98 SE" },
  { text: "Kernel .... SR20DET 2.0T" },
  { text: "Uptime .... " + uptime },
  { text: "Shell ..... command.com" },
  { text: "CPU ....... Garrett T28 @ 6000 rpm" },
  { text: "Memory .... 205 PS / 275 N.m" },
  { text: "Mass ...... 1220 kg" },
  { text: "Drive ..... FR" },
]

export default function Terminal({ onOpen, onPlay, onStop, onDrift }) {
  const [lines, setLines] = useState(() => [
    { text: "Kouki 98 SE  [Version 4.10.1998]" },
    { text: "(C) Nobody. Type HELP for a list of commands.", kind: "dim" },
    { text: "" },
  ])
  const [input, setInput] = useState("")
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const bootedAt = useRef(Date.now())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [lines])

  const print = (...entries) =>
    setLines((prev) => [
      ...prev,
      ...entries.map((e) => (typeof e === "string" ? { text: e } : e)),
    ])

  function run(raw) {
    const line = raw.trim()
    print({ text: `${PROMPT} ${raw}` })
    if (!line) return

    setHistory((h) => [line, ...h])
    setHistIdx(-1)

    const [cmd, ...rest] = line.split(/\s+/)
    const arg = rest.join(" ").toLowerCase()

    switch (cmd.toLowerCase()) {
      case "help":
      case "?":
        print(...HELP, "")
        break

      case "specs":
        print({ text: specsText }, "")
        break

      case "dir":
      case "ls":
        print(
          " Volume in drive C is KOUKI",
          "",
          ...Object.entries(APPS).map(
            ([id, s]) => `  ${id.toUpperCase().padEnd(12)} ${s.label}`,
          ),
          `  ${"FAKEAMP".padEnd(12)} Fakeamp`,
          `  ${"CLICKME".padEnd(12)} CLICK ME`,
          "",
        )
        break

      case "open":
      case "start": {
        if (!arg) {
          print({ text: "Usage: open <name>. Try 'dir'.", kind: "err" }, "")
          break
        }
        const ok = onOpen(arg)
        print(
          ok
            ? { text: `Opening ${arg}...`, kind: "dim" }
            : { text: `Bad command or file name: ${arg}`, kind: "err" },
          "",
        )
        break
      }

      case "play":
        onPlay()
        print({ text: "Fakeamp: playing.", kind: "dim" }, "")
        break

      case "stop":
        onStop()
        print({ text: "Fakeamp: stopped.", kind: "dim" }, "")
        break

      case "fastfetch":
        print(...FASTFETCH(formatUptime(Date.now() - bootedAt.current)), "")
        break

      case "whoami":
        print(
          "Someone refreshing listings at 2am,",
          "converting yen to euros in their head,",
          "and telling themselves it's an investment.",
          "",
        )
        break

      case "drift":
        print({ text: "Initiating oversteer...", kind: "err" })
        onDrift()
        break

      case "cls":
      case "clear":
        setLines([])
        break

      case "exit":
        print({ text: "Nice try. Use the X.", kind: "dim" }, "")
        break

      default:
        print({ text: `Bad command or file name: ${cmd}`, kind: "err" }, "")
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      run(input)
      setInput("")
      return
    }
    // Up/down walks the command history, like a real shell.
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      if (history.length === 0) return
      const next =
        e.key === "ArrowUp"
          ? Math.min(history.length - 1, histIdx + 1)
          : Math.max(-1, histIdx - 1)
      setHistIdx(next)
      setInput(next === -1 ? "" : history[next])
    }
  }

  return (
    <div
      className={styles.console}
      onPointerUp={() => {
        // Clicking anywhere in the console focuses the prompt, unless the user
        // was selecting text.
        if (!window.getSelection()?.toString()) inputRef.current?.focus()
      }}
    >
      {lines.map((l, i) => (
        <p key={i} className={`${styles.line} selectable`} data-kind={l.kind}>
          {l.text}
        </p>
      ))}

      <div className={styles.prompt}>
        <span>{PROMPT}</span>
        <input
          ref={inputRef}
          value={input}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Console input"
        />
      </div>
      <div ref={bottomRef} />
    </div>
  )
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} min, ${s % 60} sec` : `${s} sec`
}
