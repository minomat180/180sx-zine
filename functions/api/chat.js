/**
 * The browser's entry point into the chat room.
 *
 * This lives in the Pages project rather than as a Worker route on the zone,
 * and that difference matters: a Worker route is bound to a zone, so it would
 * serve 180sx.tech and silently do nothing on 180sx.pages.dev. A Pages Function
 * runs on every hostname the project serves — the custom domains, pages.dev,
 * and every preview deployment — so the chat works the same everywhere, with
 * no CORS because it is always same-origin.
 *
 * Requires a Durable Object binding named CHAT, pointing at the ChatRoom class
 * in the 180sx-chat Worker. See worker/wrangler.toml.
 */
export async function onRequest(context) {
  const { request, env } = context

  if (!env.CHAT) {
    return new Response("chat is not configured", { status: 503 })
  }

  // Case-insensitive: the value is conventionally lowercase, but the header
  // is not defined that way and some clients send "WebSocket".
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return new Response("expected a websocket upgrade", { status: 426 })
  }

  // One fixed name, so everybody lands in the same room.
  const id = env.CHAT.idFromName("main")
  return env.CHAT.get(id).fetch(request)
}
