import { useSyncExternalStore } from "react"

// The only real state in the app: which windows are open and how they stack.
// A tiny external store rather than context, so a window that's being dragged
// doesn't re-render every other window on every pointermove.

let state = { windows: [], nextZ: 1, nextId: 1 }
const listeners = new Set()

function set(next) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useWindows() {
  return useSyncExternalStore(subscribe, () => state.windows)
}

export function useWindow(id) {
  return useSyncExternalStore(subscribe, () => state.windows.find((w) => w.id === id))
}

/**
 * Take the next stacking slot without touching any window.
 *
 * Webamp draws its own chrome outside the window list, but it still has to
 * compete for depth with it. Pinning it to a fixed z-index meant no window
 * could ever be raised above the player — clicking one brought it to the front
 * of the window list and it still sat behind Webamp.
 *
 * `windows` keeps its identity here, so subscribers don't re-render.
 */
export function allocZ() {
  const z = state.nextZ
  set({ ...state, nextZ: state.nextZ + 1 })
  return z
}

export const isSmallScreen = () =>
  typeof window !== "undefined" && window.innerWidth < 768

const MARGIN = 8
const TASKBAR_H = 28
// Keep clear of the desktop icon column down the left edge.
const ICON_COL = 92
// Candidate positions are tried on this grid. Small enough that windows end up
// snug against each other, coarse enough that the scan stays cheap.
const SCAN_STEP = 16

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

// Everything a new window should avoid landing on.
function obstacles() {
  const list = state.windows
    .filter((win) => !win.minimized)
    .map((win) =>
      win.maximized
        ? { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }
        : { x: win.x, y: win.y, w: win.w, h: win.h },
    )

  // Webamp renders outside the window list, but it still occupies screen and a
  // new window shouldn't open underneath it. Read live rather than tracked:
  // the user can drag it anywhere, so any stored position would be a guess.
  const amp = typeof document !== "undefined" ? document.getElementById("webamp") : null
  if (amp && amp.style.display !== "none") {
    const r = amp.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      list.push({ x: r.left, y: r.top, w: r.width, h: r.height })
    }
  }
  return list
}

// Last resort when nothing fits: the old cascade, so a window still never
// lands exactly on top of the previous one.
function cascade(index, w, h) {
  const step = 30
  const maxX = Math.max(0, window.innerWidth - w - 20)
  const maxY = Math.max(0, window.innerHeight - h - 60)
  return {
    x: Math.min(maxX, 60 + ((index * step) % 260)),
    y: Math.min(maxY, 50 + ((index * step) % 200)),
  }
}

/**
 * Put a new window in the first free space, scanning left to right then top to
 * bottom — so opening windows one after another tiles them instead of stacking
 * them. Windows already on screen are never moved; only the new one is placed.
 */
function placement(index, w, h) {
  if (isSmallScreen()) return { x: 0, y: 0 }

  const maxX = window.innerWidth - w - MARGIN
  const maxY = window.innerHeight - TASKBAR_H - h - MARGIN
  if (maxX < ICON_COL || maxY < MARGIN) return cascade(index, w, h)

  const blockers = obstacles()
  for (let y = MARGIN; y <= maxY; y += SCAN_STEP) {
    for (let x = ICON_COL; x <= maxX; x += SCAN_STEP) {
      const candidate = { x, y, w, h }
      if (!blockers.some((b) => overlaps(candidate, b))) return { x, y }
    }
  }
  return cascade(index, w, h)
}

/**
 * Open a window, or focus it if `appId` is already open and marked singleton.
 * `spec` comes from the app registry: { title, w, h, singleton, props }.
 */
export function open(appId, spec = {}, props = {}) {
  const existing = state.windows.find((w) => w.appId === appId)
  if (existing && spec.singleton !== false) {
    focus(existing.id)
    if (existing.minimized) restore(existing.id)
    return existing.id
  }

  const w = spec.w ?? 420
  const h = spec.h ?? 320
  const id = state.nextId
  const { x, y } = spec.x != null ? spec : placement(state.windows.length, w, h)

  set({
    ...state,
    nextId: id + 1,
    nextZ: state.nextZ + 1,
    windows: [
      ...state.windows,
      {
        id,
        appId,
        title: spec.title ?? appId,
        x,
        y,
        w,
        h,
        z: state.nextZ,
        minimized: false,
        // On a phone the desktop metaphor falls apart, so everything opens
        // full-screen and stays there.
        maximized: isSmallScreen(),
        props,
      },
    ],
  })
  return id
}

export function close(id) {
  set({ ...state, windows: state.windows.filter((w) => w.id !== id) })
}

export function closeApp(appId) {
  set({ ...state, windows: state.windows.filter((w) => w.appId !== appId) })
}

export function focus(id) {
  const win = state.windows.find((w) => w.id === id)
  if (!win || win.z === state.nextZ - 1) return
  set({
    ...state,
    nextZ: state.nextZ + 1,
    windows: state.windows.map((w) => (w.id === id ? { ...w, z: state.nextZ } : w)),
  })
}

export function minimize(id) {
  set({
    ...state,
    windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
  })
}

export function restore(id) {
  set({
    ...state,
    nextZ: state.nextZ + 1,
    windows: state.windows.map((w) =>
      w.id === id ? { ...w, minimized: false, z: state.nextZ } : w,
    ),
  })
}

export function toggleMax(id) {
  if (isSmallScreen()) return
  set({
    ...state,
    windows: state.windows.map((w) =>
      w.id === id ? { ...w, maximized: !w.maximized } : w,
    ),
  })
}

export function move(id, x, y) {
  set({
    ...state,
    windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
  })
}

export function isOpen(appId) {
  return state.windows.some((w) => w.appId === appId)
}

export function closeAll() {
  set({ ...state, windows: [] })
}
