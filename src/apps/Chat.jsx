import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./Chat.module.css"

const MAX_NAME = 24
const MAX_TEXT = 500

// Cloudflare drops a WebSocket that has been silent for a couple of minutes.
// Well under that, and the Durable Object answers it without waking up.
// This string must match the auto-response pair in worker/src/index.js exactly.
const PING = JSON.stringify({ type: "ping" })
const PING_MS = 30000
const RETRY_CAP_MS = 15000

const endpoint = () => {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/api/chat`
}

const clock = (t) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

/**
 * Everyone on the site, in one room.
 *
 * Nothing is stored anywhere: no accounts, no cookies, no history. The room
 * holds the last handful of messages in memory only, so refreshing loses your
 * name and closing the tab leaves no trace.
 */
export default function Chat() {
  const [name, setName] = useState("")
  const [joined, setJoined] = useState(false)
  const [status, setStatus] = useState("idle")
  const [messages, setMessages] = useState([])
  const [count, setCount] = useState(0)
  const [draft, setDraft] = useState("")

  const wsRef = useRef(null)
  const listRef = useRef(null)
  const nameRef = useRef("")
  const pingRef = useRef(null)
  const retryRef = useRef(null)
  const attemptsRef = useRef(0)
  // Set when we close on purpose, so unmounting doesn't trigger a reconnect.
  const deliberateRef = useRef(false)
  const connectRef = useRef(null)
  // Only follow new messages when already at the bottom, so reading scrollback
  // isn't yanked away every time somebody types.
  const stickRef = useRef(true)

  // Index keys break once the list starts sliding — slice(-200) shifts every
  // index, so React would reuse the wrong nodes. Each entry gets a stable id
  // that is local to this client; the server never sees it.
  const seqRef = useRef(0)
  const push = useCallback((entry) => {
    setMessages((prev) => [...prev, { ...entry, key: ++seqRef.current }].slice(-200))
  }, [])

  // Backs off 1s, 2s, 4s ... capped, so a room that is genuinely down isn't
  // hammered, but a dropped idle connection comes back almost immediately.
  const scheduleRetry = useCallback(() => {
    const attempt = ++attemptsRef.current
    const delay = Math.min(RETRY_CAP_MS, 1000 * 2 ** (attempt - 1))
    setStatus("reconnecting")
    clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      connectRef.current?.(nameRef.current)
    }, delay)
  }, [])

  const connect = useCallback(
    (as) => {
      nameRef.current = as
      setStatus("connecting")
      let ws
      try {
        ws = new WebSocket(endpoint())
      } catch {
        scheduleRetry()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        setStatus("open")
        attemptsRef.current = 0
        ws.send(JSON.stringify({ type: "join", name: as }))
        clearInterval(pingRef.current)
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(PING)
        }, PING_MS)
      }
      ws.onmessage = (e) => {
        let msg
        try {
          msg = JSON.parse(e.data)
        } catch {
          return
        }
        if (msg.type === "pong") return
        if (msg.type === "history")
          setMessages((msg.messages ?? []).map((m) => ({ ...m, key: ++seqRef.current })))
        else if (msg.type === "count") setCount(msg.n ?? 0)
        else push(msg)
      }
      ws.onclose = () => {
        clearInterval(pingRef.current)
        if (!deliberateRef.current) scheduleRetry()
      }
      // onerror always precedes onclose, so reconnecting is handled there.
      ws.onerror = () => {}
    },
    [push, scheduleRetry],
  )

  connectRef.current = connect

  useEffect(() => {
    return () => {
      deliberateRef.current = true
      clearInterval(pingRef.current)
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const join = (e) => {
    e.preventDefault()
    const as = name.trim().slice(0, MAX_NAME)
    if (!as) return
    setName(as)
    setJoined(true)
    connect(as)
  }

  const send = (e) => {
    e.preventDefault()
    const text = draft.trim().slice(0, MAX_TEXT)
    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: "msg", text }))
    setDraft("")
  }

  if (!joined) {
    return (
      <div className={styles.wrap}>
        <form className={styles.gate} onSubmit={join}>
          <p className={styles.gateTitle}>Pick a name</p>
          <input
            autoFocus
            value={name}
            maxLength={MAX_NAME}
            placeholder="name"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" disabled={!name.trim()}>
            Connect
          </button>
          <p className={styles.note}>
            Nothing here is saved. Messages vanish when the room empties.
          </p>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div
        className={styles.log}
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
      >
        {messages.map((m) =>
          m.type === "system" ? (
            <p key={m.key} className={styles.system}>
              — {m.text}
            </p>
          ) : (
            <p key={m.key} className={styles.line}>
              <span className={styles.time}>{clock(m.t)}</span>
              <span className={styles.name}>{m.name}</span>
              <span>{m.text}</span>
            </p>
          ),
        )}
        {status === "error" && (
          <p className={styles.system}>
            — can&apos;t reach the room. The chat only runs on the deployed
            site, not the plain dev server.
          </p>
        )}
        {status === "reconnecting" && (
          <p className={styles.system}>— dropped, reconnecting…</p>
        )}
      </div>

      <form className={styles.composer} onSubmit={send}>
        <input
          value={draft}
          maxLength={MAX_TEXT}
          placeholder={status === "open" ? "Type here" : "Not connected"}
          disabled={status !== "open"}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" disabled={status !== "open" || !draft.trim()}>
          Send
        </button>
      </form>

      <div className="status-bar">
        <p className="status-bar-field">{name}</p>
        <p className="status-bar-field">
          {status === "open" ? "Connected" : status === "reconnecting" ? "Reconnecting…" : status}
        </p>
        <p className="status-bar-field">
          {count} online
        </p>
      </div>
    </div>
  )
}
