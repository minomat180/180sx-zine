// Window metadata only — no component imports, so any app can import this to
// open any other app without creating an import cycle.

export const APPS = {
  specs: { title: "C:\\Specs.txt", w: 520, h: 460, icon: "note", desktop: true, label: "Specs.txt" },
  gallery: { title: "C:\\Gallery", w: 520, h: 430, icon: "image", desktop: true, label: "Gallery" },
  video: { title: "C:\\Video", w: 480, h: 320, icon: "video", desktop: true, label: "Video" },
  console: { title: "C:\\Console", w: 580, h: 430, icon: "console", desktop: true, label: "Console" },
  generator: { title: "C:\\Generator", w: 560, h: 480, icon: "generator", desktop: true, label: "Generator" },
  about: { title: "C:\\About", w: 380, h: 240, icon: "note", desktop: false, label: "About" },
}

// Fakeamp and CLICK ME are desktop icons but not managed windows — Webamp
// renders its own chrome, and the error bomb spawns its own dialogs.
export const DESKTOP_EXTRAS = [
  { id: "fakeamp", icon: "winamp", label: "Fakeamp" },
  { id: "clickme", icon: "clickme", label: "CLICK ME" },
]

export const desktopIcons = [
  ...Object.entries(APPS)
    .filter(([, s]) => s.desktop)
    .map(([id, s]) => ({ id, icon: s.icon, label: s.label })),
  ...DESKTOP_EXTRAS,
]
