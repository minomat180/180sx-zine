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

export const isSmallScreen = () =>
  typeof window !== "undefined" && window.innerWidth < 768

// Cascade successive windows so a fresh one never lands exactly on the last.
function placement(index, w, h) {
  if (isSmallScreen()) return { x: 0, y: 0 }
  const step = 30
  const maxX = Math.max(0, window.innerWidth - w - 20)
  const maxY = Math.max(0, window.innerHeight - h - 60)
  return {
    x: Math.min(maxX, 60 + ((index * step) % 260)),
    y: Math.min(maxY, 50 + ((index * step) % 200)),
  }
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
