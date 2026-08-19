// ─────────────────────────────────────────────────────────────────────────────
//  THE DROP-IN MANIFEST
//
//  This is the only file you need to edit to make the site yours.
//  Put files in public/media/{photos,audio,video}/ and list them here.
//  Paths are absolute from public/, so "/media/audio/foo.mp3" means
//  "public/media/audio/foo.mp3".
// ─────────────────────────────────────────────────────────────────────────────

// ── PHOTOS ───────────────────────────────────────────────────────────────────
// Shown in C:\Image_1 (the gallery). First one is also the desktop wallpaper
// unless you set `wallpaper` below.
export const photos = [
  { src: "/media/photos/hero.jpg", caption: "Type X — 1996 aero package" },
  { src: "/media/photos/black.jpg", caption: "Kouki front end" },
  { src: "/media/photos/navy.jpg", caption: "Three-quarter" },
  { src: "/media/photos/rear.jpg", caption: "Kouki tail lamps" },
  { src: "/media/photos/meihan-2019.webp", caption: "Meihan, 2019 — leading an S13" },
]

// Desktop background. Set to null to fall back to photos[0].
// Kept out of `photos` on purpose: it's scenery, not a gallery image.
export const wallpaper = "/media/photos/drift-wall.jpg"

// ── AUDIO ────────────────────────────────────────────────────────────────────
// Loaded into Fakeamp's playlist, in order. Add more by dropping mp3s into
// public/media/audio/ and appending an entry here — nothing else to change.
export const tracks = [
  {
    url: "/media/audio/s13-runs-10s.mp3",
    metaData: { title: "S13 180SX runs 10s", artist: "Fullboost" },
  },
  {
    url: "/media/audio/asleep-in-space.mp3",
    metaData: { title: "Asleep In Space", artist: "Zachariehs" },
  },
]

// ── VIDEO ────────────────────────────────────────────────────────────────────
// Shown in C:\Video. Two shapes, pick one:
//
//   { kind: "file",    src: "/media/video/drift.mp4" }
//   { kind: "youtube", id: "VIDEO_ID" }
//
// Self-hosted. The source was 4K AV1 at 129 MB; Cloudflare Pages rejects any
// single file over 25 MB, so it ships as 1280x600 H.264 at ~1.9 Mbps (21.6 MB)
// with faststart, which also avoids AV1's patchy browser support.
// Swap to kind: "youtube" if a clip is ever too long to fit the budget.
export const video = {
  kind: "file",
  src: "/media/video/drift.mp4",
  title: "SR20 180SX Touge Drift",
}

// ── TEXT ─────────────────────────────────────────────────────────────────────
// C:\Specs.txt — the Notepad window. Plain text, rendered as-is in monospace.
// Figures carried over from the older 180sx page; they are correct, don't
// "fix" them.
export const specsText = `
NISSAN 180SX TYPE X  ·  RPS13
=============================

The final series. Built 1996 to December 1998 — the "kouki"
cars, and the only ones that came as Type X from the factory.

ENGINE
------
Type ................ SR20DET
Layout .............. Inline 4, DOHC 16V, turbocharged
Displacement ........ 1998 cm3
Bore x stroke ....... 86.0 x 86.0 mm  (square)
Compression ......... 8.5 : 1
Turbocharger ........ Garrett T28
Max power ........... 205 PS (151 kW) @ 6000 rpm
Max torque .......... 275 N.m (28.0 kgm) @ 4000 rpm
Specific output ..... 102.6 PS / litre

DRIVELINE
---------
Drive ............... Front engine, rear wheel drive
Transmission ........ 5-speed manual / 4-speed automatic
Differential ........ Limited slip — standard on Type X

DIMENSIONS
----------
Length .............. 4520 mm
Width ............... 1695 mm
Height .............. 1290 mm
Wheelbase ........... 2475 mm
Track, front ........ 1465 mm
Track, rear ......... 1460 mm
Mass, manual ........ 1220 kg
Mass, automatic ..... 1240 kg

WHAT YOU GET
------------
- The 1996 aero package
- Kouki tail lamps
- Retractable headlamps
- Limited-slip differential
- Five-speed manual
- 15-inch alloys
- Leather wheel, four seats
- 1220 kilograms

---
An enthusiast zine. Not produced by, endorsed by, or connected
with Nissan Motor Co., Ltd.
`.trim()

// C:\About — the Start menu's About box.
export const aboutText = `A fan zine for the Nissan 180SX Type X, dressed up as a
computer that stopped being supported a long time ago.

Everything here is a window. Try the console.`
