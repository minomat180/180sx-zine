# 180SX Zine

A fan zine about the Nissan 180SX Type X, built as a fake Windows 98 desktop.
There are no pages: you land on a desktop and open windows.

Live at **[180sx.tech](https://180sx.tech)**.

![The 180sx.tech desktop with the spec sheet, the console after `fastfetch`, and the Webamp player open](docs/desktop.png)

![The gallery, the overlay generator and two error dialogs from the CLICK ME icon](docs/gallery-errors.png)

## What is on the desktop

| Icon | What it does |
| --- | --- |
| Specs.txt | Notepad with the Type X spec sheet |
| Gallery | Image viewer that pages through the photos |
| Video | A Win98 frame around a self-hosted drift clip |
| Console | A small shell: `help`, `dir`, `open gallery`, `play`, `fastfetch`, `whoami`, `drift`, `cls` |
| Generator | Load your own photo, stack overlays and a caption on it, save the result. The image never leaves the browser |
| Fakeamp | [Webamp](https://webamp.org), a Winamp 2 clone, with the zine's playlist |
| Analyzer | Spectrum, oscilloscope and radial views of whatever Fakeamp is playing |
| Chat | One shared room for everyone currently on the site, over a WebSocket |
| CLICK ME | An error dialog. Every OK spawns two more, until it blue-screens |

It starts with a BIOS POST screen, the wallpaper glitches every so often, and
Start > Shut Down ends on "It's now safe to turn off your computer".

## The interesting parts

**A window manager in about 200 lines.** `src/os/windowStore.js` holds all
window state: open windows, positions, z-order, minimised and maximised flags.
It is a plain module-level store read with `useSyncExternalStore`, with no
state library or context provider. `src/os/appSpecs.js` holds window metadata
and imports no components, so the taskbar, Start menu and console can list apps
without importing every component, and `App.jsx` alone maps ids to
components.

**Webamp does not fit in a React tree.** It draws its own chrome and appends
itself to `document.body`, and unmounting it stops playback. `Fakeamp.jsx`
creates it once, on first open, and afterwards only toggles its visibility.
The Analyzer reads Webamp's audio graph through `src/os/ampBridge.js`, which
tells it when the player appears, because the player may not exist yet when the
Analyzer opens. Webamp is about 900 kB minified, so it is imported dynamically and never
loads unless someone opens the player.

**Chat on one Durable Object.** The browser connects to a Cloudflare Pages
Function (`functions/api/chat.js`), which hands the WebSocket to a Durable
Object in a separate Worker (`worker/`), because a Pages project can bind to a
Durable Object but cannot define one. The room keeps up to 60 messages in
memory while the object is awake and writes nothing to storage, so the history
is gone whenever it hibernates. Idle sockets were being closed by
Cloudflare after about two minutes; the client now pings every 30 seconds and
the Durable Object answers with `setWebSocketAutoResponse`, which does not wake
it from hibernation.

**Smaller things.** UI sounds are synthesised in `src/audio.js` rather than
shipped as files. `vite.config.js` rewrites one malformed media query in
98.css 0.1.21 that otherwise fails the production CSS minifier. Below 768 px
wide, windows open maximised and dragging is off.

## Run it

Needs Node 20.19+ or 22.12+ (CI uses 24).

```sh
npm ci
npm run media    # photos, music and video into public/media/ (see below)
npm run dev      # Vite dev server
npm run lint     # oxlint
npm run build    # production build into dist/
```

Chat only works on the deployed site: the Vite dev server has no Pages
Function or Durable Object, and the Chat window says it cannot reach the room.

All content (photos, wallpaper, playlist, video, spec text) is listed in
`src/media.js`. The media files are not in this repository: most of them
belong to other people, so they live in a private repo, `minomat180/180sx-media`.
`npm run media` clones it into `.media/` and copies the folders into
`public/media/`; that needs read access to it. Without it the site still builds
and runs, with empty gallery, player and video windows.

## Deploy

`.github/workflows/deploy.yml` lints and builds every push and pull request,
fetching the media repo with a read-only deploy key first. For pushes it then uploads `dist/` and `functions/` to the Cloudflare Pages
project with `wrangler pages deploy`: production from `main`, a preview URL for
any other branch. Pull requests are never deployed.

The chat Worker changes rarely and is deployed by hand:

```sh
cd worker && npx wrangler deploy
```

The Pages project binds it as the Durable Object `CHAT` (class `ChatRoom`,
Worker `180sx-chat`), set once in the Cloudflare dashboard.

## Status

Feature work stopped in August 2026. Known gap: the player's title
bar still reads WINAMP, because the text is part of the default skin bitmap.
Changing it needs a custom `.wsz` skin.

## Credits and license

Built with [React](https://react.dev), [Vite](https://vite.dev),
[98.css](https://jdan.github.io/98.css/) and [Webamp](https://webamp.org)
(all MIT). Fonts: Press Start 2P and Handjet (SIL Open Font License), loaded
from Google Fonts. The desktop-as-website idea and look follow
[fakeverything.com](https://fakeverything.com).

Gallery photos: Tokumeigakarinoaoshima ([front](https://commons.wikimedia.org/wiki/File:Nissan_180SX_TYPE_X_(E-RPS13)_front.jpg),
[rear](https://commons.wikimedia.org/wiki/File:Nissan_180SX_TYPE_X_(E-RPS13)_rear.jpg), CC BY-SA 4.0;
[tuned RPS13](https://commons.wikimedia.org/wiki/File:Tuned_Nissan_180SX_(RPS13)_front.JPG), CC0) and
Toyotacoronaexsaloon ([Type X](https://commons.wikimedia.org/wiki/File:Nissan_180sx_rps13_typex_1_f.jpg),
CC BY-SA 4.0), via Wikimedia Commons. Drift video:
[SR20 180SX Touge Drift](https://www.youtube.com/watch?v=CsaEQvSFEgM) by Jack
Atkins. Music by Zachariehs, Kaikobad, Silo, ThirdEy3 and EXODIA. The
screenshots in `docs/` show some of these.

The code and text are mine, all rights reserved (see `LICENSE`). The media
belongs to its creators and is not covered by that license.

An enthusiast project. Not produced by, endorsed by, or connected with Nissan
Motor Co., Ltd.
