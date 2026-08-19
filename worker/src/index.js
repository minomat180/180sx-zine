/**
 * One Durable Object = one chat room. Everyone on the site shares it.
 *
 * Deployed as its own Worker rather than living in the Pages project, because
 * Pages cannot define a Durable Object class — it can only bind to one that a
 * Worker exports. The Pages Function in functions/api/chat.js is what the
 * browser actually talks to; it forwards the upgrade request here.
 *
 * Nothing is written to storage. Messages live in memory for as long as the
 * object is awake and are gone after that — no history, no logs, no record of
 * who said what.
 */

// Kept small on purpose: this is the entire retention policy.
const HISTORY = 60
const MAX_TEXT = 500
const MAX_NAME = 24

// Strips control characters only. A stray newline would let one message
// render as several, and the rest would corrupt the display. Everything
// printable is left exactly as typed. Written as escapes rather than the
// literal bytes, which no editor can mangle.
const clean = (s, max) =>
  typeof s === "string"
    // eslint-disable-next-line no-control-regex -- stripping them is the point
    ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : ""

export class ChatRoom {
  constructor(state) {
    this.state = state
    this.history = []
  }

  async fetch(request) {
    // Case-insensitive: the value is conventionally lowercase, but the
    // header is not defined that way and some clients send "WebSocket".
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("expected a websocket upgrade", { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())

    // Hibernation API rather than a plain accept(): the object is allowed to
    // sleep while sockets stay open, so a room full of idle people costs
    // nothing. With a plain accept() the object stays resident and bills
    // duration for as long as anyone has the tab open.
    this.state.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  broadcast(payload, except) {
    const data = JSON.stringify(payload)
    for (const ws of this.state.getWebSockets()) {
      if (ws === except) continue
      try {
        ws.send(data)
      } catch {
        // A socket that's already gone isn't worth handling; the close
        // handler will tidy up.
      }
    }
  }

  count() {
    return this.state.getWebSockets().length
  }

  async webSocketMessage(ws, raw) {
    let msg
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    if (msg.type === "join") {
      const name = clean(msg.name, MAX_NAME) || "anon"
      // Survives hibernation — in-memory fields on `this` do not, so the
      // socket has to carry its own identity.
      ws.serializeAttachment({ name })
      ws.send(JSON.stringify({ type: "history", messages: this.history }))
      this.broadcast({ type: "system", text: `${name} joined` }, ws)
      this.broadcast({ type: "count", n: this.count() })
      return
    }

    if (msg.type === "msg") {
      const text = clean(msg.text, MAX_TEXT)
      if (!text) return
      const { name } = ws.deserializeAttachment() ?? { name: "anon" }
      const out = { type: "msg", name, text, t: Date.now() }
      this.history.push(out)
      if (this.history.length > HISTORY) this.history.shift()
      this.broadcast(out)
    }
  }

  async webSocketClose(ws) {
    const { name } = ws.deserializeAttachment() ?? {}
    if (name) this.broadcast({ type: "system", text: `${name} left` }, ws)
    this.broadcast({ type: "count", n: Math.max(0, this.count() - 1) }, ws)
  }

  async webSocketError(ws) {
    this.broadcast({ type: "count", n: Math.max(0, this.count() - 1) }, ws)
  }
}

// The Worker itself is only a shell. Everything reaches the room through the
// Pages Function, but a direct entrypoint keeps the Worker deployable and
// testable on its own.
export default {
  async fetch(request, env) {
    const id = env.CHAT.idFromName("main")
    return env.CHAT.get(id).fetch(request)
  },
}
