# 180SX Zine

The Nissan 180SX Type X fan zine, built as a fake Windows 98 desktop. There are no
pages and nothing scrolls — you land on a desktop and open windows.

Style reference: [fakeverything.com](https://fakeverything.com).

```
npm install
npm run dev
```

## Making it yours

**Everything you'd want to change lives in `src/media.js`.** Drop files into
`public/media/` and list them there. No component edits required — that's tested.

| You want to… | Do this |
| --- | --- |
| Add your music | Put mp3s in `public/media/audio/`, list them in `tracks` |
| Use your drift video | Put it in `public/media/video/`, set `video` to `{ kind: "file", src: "/media/video/yours.mp4" }` |
| Use a YouTube video instead | Set `video` to `{ kind: "youtube", id: "VIDEO_ID" }` |
| Add photos | Put them in `public/media/photos/`, list them in `photos` |
| Change the wallpaper | Point `wallpaper` at any file in `public/media/photos/` |
| Edit the spec sheet | Rewrite `specsText` — it's plain text, rendered as-is |

### Current placeholders

These are stand-ins, meant to be replaced:

- **Audio** — one track, `s13-runs-10s.mp3`. The three placeholder SR20DET
  engine clips from `~/projects/180sx` are gone.
- **Photos** — extracted from the base64 blobs in `~/projects/180sx/index.html`
  (Wikimedia Commons, CC BY-SA 4.0 / CC0). See `scripts/extract-photos.mjs`.

## What's on the desktop

| Icon | |
| --- | --- |
| `Specs.txt` | Notepad with the Type X spec sheet |
| `Gallery` | Image viewer, cycles the photos |
| `Video` | Win98 frame around the drift video |
| `Console` | Working terminal — try `help`, `fastfetch`, `open gallery`, `drift` |
| `Generator` | Upload a photo, stack overlays on it, download the result |
| `Fakeamp` | A real Winamp ([Webamp](https://webamp.org)) with EQ and playlist |
| `CLICK ME` | Error-dialog bomb. Every OK spawns two more, until it blue-screens |

Start menu → `Shut Down…` gives you the "safe to turn off your computer" screen.

## How it's put together

- **React + Vite**, plain JSX. [`98.css`](https://jdan.github.io/98.css/) for all
  window chrome.
- `src/os/windowStore.js` is the only real state: open windows, positions,
  z-order. A small external store, so dragging one window doesn't re-render the
  others.
- `src/os/appSpecs.js` holds window metadata with **no component imports**, so
  any app can open any other app without an import cycle. `App.jsx` maps ids to
  components.
- **Fakeamp is not a managed window.** Webamp renders its own chrome and appends
  itself to `document.body`, so `Fakeamp.jsx` toggles that node's visibility
  directly instead of unmounting (disposing it loses playback state). It's also
  dynamically imported — ~900 kB that never loads unless you open the player.
- The **Generator** composites with plain Canvas 2D (`src/apps/overlays.js`).
  Overlays have a `layer` so draw order is fixed regardless of click order.
  Nothing is uploaded anywhere; the reference site emails the render, this one
  just downloads it.
- UI sounds are synthesised (`src/audio.js`) rather than shipped as files.
- `vite.config.js` patches one malformed media query in 98.css v0.1.21 that
  would otherwise fail the production build.

**Mobile:** below 768px, windows open maximized and dragging is off. The desktop
metaphor doesn't survive a phone, but it stays usable.

## Not done

- Fakeamp's title bar still reads `WINAMP`. That text is baked into the skin
  bitmap, so renaming it to `FAKEAMP` needs a custom `.wsz` skin.

---

An enthusiast zine. Not produced by, endorsed by, or connected with Nissan Motor
Co., Ltd.
