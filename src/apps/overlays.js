// Canvas overlay presets for C:\Generator.
//
// Each preset is a draw function taking (ctx, { w, h, name }). They composite
// on top of the already-drawn photo. Plain Canvas 2D — html2canvas would only
// add a dependency to rasterise DOM we don't need.

const KOUKI_RED = "#c4262e"
const ICE = "#7fa9ce"

function shadowText(ctx, text, x, y, { font, fill = "#fff", align = "left" }) {
  ctx.font = font
  ctx.textAlign = align
  ctx.fillStyle = "rgba(0,0,0,0.75)"
  ctx.fillText(text, x + 2, y + 2)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

/** Bottom-left plate + spec strip, like a magazine caption. */
function typeXBadge(ctx, { w, h, name }) {
  const pad = Math.round(w * 0.04)
  const barH = Math.round(h * 0.17)
  // Clear the tail-lamp bar (7.5% of height) when both presets are on, so the
  // caption never gets half-eaten by it.
  const y = h - barH - Math.max(pad, Math.round(h * 0.095))

  ctx.fillStyle = "rgba(0,0,0,0.72)"
  ctx.fillRect(pad, y, w - pad * 2, barH)
  ctx.fillStyle = KOUKI_RED
  ctx.fillRect(pad, y, Math.round(w * 0.012), barH)

  const big = Math.round(barH * 0.36)
  const small = Math.round(barH * 0.2)
  shadowText(ctx, (name || "180SX TYPE X").toUpperCase(), pad * 2, y + big + barH * 0.1, {
    font: `bold ${big}px "Courier New", monospace`,
  })
  shadowText(ctx, "RPS13  ·  SR20DET  ·  205 PS  ·  FR", pad * 2, y + barH * 0.82, {
    font: `${small}px "Courier New", monospace`,
    fill: ICE,
  })
}

/** The kouki tail-lamp bar across the bottom edge. */
function tailLamps(ctx, { w, h }) {
  const barH = Math.round(h * 0.075)
  const y = h - barH

  const grad = ctx.createLinearGradient(0, y, 0, h)
  grad.addColorStop(0, "rgba(196,38,46,0.95)")
  grad.addColorStop(1, "rgba(90,10,14,0.95)")
  ctx.fillStyle = grad
  ctx.fillRect(0, y, w, barH)

  // Segment ribs, then the blacked-out centre panel between the lamps.
  ctx.fillStyle = "rgba(0,0,0,0.35)"
  const ribs = 34
  for (let i = 0; i < ribs; i++) {
    ctx.fillRect(Math.round((i * w) / ribs), y, 2, barH)
  }
  ctx.fillStyle = "#0d0d0d"
  ctx.fillRect(Math.round(w * 0.38), y, Math.round(w * 0.24), barH)

  ctx.globalAlpha = 0.9
  shadowText(ctx, "NISSAN", w / 2, y + barH * 0.68, {
    font: `bold ${Math.round(barH * 0.5)}px "Courier New", monospace`,
    fill: "#8a8a8a",
    align: "center",
  })
  ctx.globalAlpha = 1
}

/** Scattered sticker-bomb slogans at jaunty angles. */
function stickers(ctx, { w, h }) {
  const words = [
    { t: "TYPE X", c: "#fff", bg: KOUKI_RED },
    { t: "KOUKI", c: "#000", bg: "#ffd24a" },
    { t: "SR20DET", c: "#fff", bg: "#111" },
    { t: "走り屋", c: "#000", bg: "#fff" },
    { t: "NO BRAKES", c: "#fff", bg: "#1a5fb4" },
    { t: "RPS13", c: "#000", bg: ICE },
  ]
  // Fixed spots rather than random, so re-rendering the same photo is stable.
  // Confined to the middle band: the corners belong to VHS (PLAY / REC /
  // timestamp) and the bottom strip to the badge and tail lamps.
  const spots = [
    [0.05, 0.3, -8],
    [0.71, 0.24, 6],
    [0.09, 0.55, 4],
    [0.68, 0.5, -5],
    [0.38, 0.21, 10],
    [0.36, 0.63, -3],
  ]

  words.forEach(({ t, c, bg }, i) => {
    const [fx, fy, rot] = spots[i]
    const size = Math.round(h * 0.055)
    ctx.save()
    ctx.translate(w * fx, h * fy)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.font = `bold ${size}px "Courier New", monospace`
    const tw = ctx.measureText(t).width
    const padX = size * 0.4
    const padY = size * 0.28

    ctx.fillStyle = "rgba(0,0,0,0.4)"
    ctx.fillRect(-padX + 3, -size + 3, tw + padX * 2, size + padY * 2)
    ctx.fillStyle = bg
    ctx.fillRect(-padX, -size, tw + padX * 2, size + padY * 2)
    ctx.fillStyle = c
    ctx.textAlign = "left"
    ctx.fillText(t, 0, padY * 0.4)
    ctx.restore()
  })
}

/** VHS: scanlines, chroma smear, timestamp, REC dot. */
function vhs(ctx, { w, h }) {
  ctx.save()
  // Chroma bleed — redraw the frame shifted a couple of pixels, tinted.
  ctx.globalCompositeOperation = "screen"
  ctx.globalAlpha = 0.12
  ctx.fillStyle = "#ff0040"
  ctx.fillRect(2, 0, w, h)
  ctx.fillStyle = "#00ffee"
  ctx.fillRect(-2, 0, w, h)
  ctx.restore()

  ctx.fillStyle = "rgba(0,0,0,0.22)"
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2)

  // A couple of tracking-error bands.
  ctx.fillStyle = "rgba(255,255,255,0.09)"
  ctx.fillRect(0, Math.round(h * 0.31), w, Math.round(h * 0.012))
  ctx.fillRect(0, Math.round(h * 0.68), w, Math.round(h * 0.008))

  const size = Math.round(h * 0.045)
  const pad = Math.round(h * 0.05)
  shadowText(ctx, "▶ PLAY", pad, pad + size, {
    font: `bold ${size}px "Courier New", monospace`,
  })
  shadowText(ctx, "JAN 01 1998  04:04:00", pad, h - pad, {
    font: `bold ${size}px "Courier New", monospace`,
  })

  ctx.beginPath()
  ctx.arc(w - pad - size * 0.6, pad + size * 0.5, size * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = "#ff2b2b"
  ctx.fill()
  shadowText(ctx, "REC", w - pad - size * 1.4, pad + size, {
    font: `bold ${size}px "Courier New", monospace`,
    align: "right",
  })
}

// `layer` fixes the compositing order independently of the button order:
// treatments that act on the whole frame go down first, captions and stickers
// on top of them, so text never ends up half-buried.
export const OVERLAYS = [
  { id: "badge", label: "Type X badge", layer: 2, draw: typeXBadge },
  { id: "lamps", label: "Kouki lamps", layer: 0, draw: tailLamps },
  { id: "stickers", label: "Sticker bomb", layer: 3, draw: stickers },
  { id: "vhs", label: "VHS", layer: 1, draw: vhs },
]

export const drawOrder = [...OVERLAYS].sort((a, b) => a.layer - b.layer)
