import { useEffect, useRef, useState } from "react"
import { tracks } from "../media.js"
import { setAmp } from "../os/ampBridge.js"

/**
 * Webamp renders its own chrome and manages its own dragging, so it lives
 * directly on the desktop rather than inside a Win98Window — the same as on
 * the reference site.
 *
 * Two things about Webamp shape this component:
 *
 *  1. `renderWhenReady(host)` ignores `host` for placement and appends its
 *     `#webamp` root to `document.body`. Hiding the host does nothing, so
 *     visibility is toggled on that root element directly.
 *  2. Disposing and recreating it restarts playback from silence and loses the
 *     playlist position, so it's constructed once and then only hidden.
 */
export default function Fakeamp({ visible, onClose, volume, instanceRef }) {
  const hostRef = useRef(null)
  const rootRef = useRef(null)
  const webampRef = useRef(null)
  // Webamp is ~900 kB. Nothing is loaded until the user first opens it.
  const [requested, setRequested] = useState(false)
  // Read inside the load callback, which resolves long after the effect that
  // started it — closing the player mid-download must not un-hide it.
  const visibleRef = useRef(visible)
  visibleRef.current = visible

  useEffect(() => {
    if (visible) setRequested(true)
  }, [visible])

  useEffect(() => {
    if (!requested) return
    const host = hostRef.current
    if (!host || webampRef.current) return

    let cancelled = false
    let cleanup = () => {}

    import("webamp").then(({ default: Webamp }) => {
      if (cancelled) return
      if (!Webamp.browserIsSupported()) {
        host.textContent = "Fakeamp is not supported in this browser."
        return
      }

      // Place the stack top-right, clear of the desktop icon column.
      const left = Math.max(8, Math.round(window.innerWidth - 295))
      const webamp = new Webamp({
        initialTracks: tracks,
        windowLayout: {
          main: { position: { top: 24, left } },
          equalizer: { position: { top: 140, left } },
          playlist: { position: { top: 256, left }, size: { extraHeight: 2 } },
        },
      })
      webampRef.current = webamp
      if (instanceRef) instanceRef.current = webamp
      // Hand the audio graph to anything that wants to read it (the analyzer).
      setAmp(webamp)

      // Webamp's own close button folds it back to the taskbar rather than
      // destroying the instance.
      const unsubscribe = webamp.onClose(() => onClose?.())

      webamp.renderWhenReady(host).then(() => {
        if (cancelled) return
        const root = document.getElementById("webamp")
        rootRef.current = root
        if (root) {
          // Above the desktop windows, below the taskbar.
          root.style.zIndex = "50000"
          root.style.display = visibleRef.current ? "" : "none"
        }
      })

      cleanup = () => {
        unsubscribe()
        webamp.dispose()
        webampRef.current = null
        rootRef.current = null
        setAmp(null)
        if (instanceRef) instanceRef.current = null
      }
    })

    return () => {
      cancelled = true
      cleanup()
    }
    // Construct once, the first time it's opened. `onClose` and `instanceRef`
    // are deliberately omitted: re-running this would dispose and rebuild
    // Webamp, losing whatever is playing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])

  useEffect(() => {
    const root = rootRef.current
    if (root) root.style.display = visible ? "" : "none"
    // Webamp's own close button closes its internal windows too, so reopen
    // them when the taskbar brings it back.
    if (visible) webampRef.current?.reopen()
  }, [visible])

  // Mirror the taskbar tray volume into Webamp (which wants 0–100).
  useEffect(() => {
    webampRef.current?.setVolume(Math.round(volume * 100))
  }, [volume])

  return <div ref={hostRef} />
}
