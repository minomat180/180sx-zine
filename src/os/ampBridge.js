// Webamp is constructed lazily, the first time Fakeamp is opened. The analyzer
// window can be opened before that, after it, or while it's still downloading,
// so a plain ref isn't enough — anything that wants the audio graph has to be
// told when it appears and when it goes away.
//
// Deliberately not a React context: Fakeamp lives outside the window tree, and
// threading a provider around it would mean re-rendering every open window
// whenever the player loads.

let instance = null
const listeners = new Set()

export function setAmp(next) {
  instance = next
  for (const fn of listeners) fn(instance)
}

export function getAmp() {
  return instance
}

export function subscribeAmp(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
