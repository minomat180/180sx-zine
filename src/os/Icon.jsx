// Hand-drawn Win98-ish icons. Inline SVG on a 32x32 grid with hard edges and
// no anti-aliased curves, so they hold up next to 98.css's chrome.

const S = { shapeRendering: "crispEdges" }

const ICONS = {
  note: (
    <>
      <path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#000" />
      <path d="M20 2v6h6" fill="#dfdfdf" stroke="#000" />
      {[12, 15, 18, 21, 24].map((y) => (
        <path key={y} d={`M9 ${y}h14`} stroke="#000080" />
      ))}
    </>
  ),
  image: (
    <>
      <path d="M4 4h24v24H4z" fill="#fff" stroke="#000" />
      <path d="M6 6h20v20H6z" fill="#c0c0c0" />
      <path d="M6 22l6-8 5 6 4-4 5 6v4H6z" fill="#808080" />
      <path d="M21 10h4v4h-4z" fill="#fff" stroke="#000" />
    </>
  ),
  video: (
    <>
      <path d="M3 10h18v14H3z" fill="#c0c0c0" stroke="#000" />
      <path d="M21 15l8-5v14l-8-5z" fill="#808080" stroke="#000" />
      <circle cx="9" cy="7" r="4" fill="#dfdfdf" stroke="#000" />
      <circle cx="17" cy="7" r="4" fill="#dfdfdf" stroke="#000" />
    </>
  ),
  console: (
    <>
      <path d="M3 4h26v24H3z" fill="#c0c0c0" stroke="#000" />
      <path d="M5 8h22v18H5z" fill="#000" />
      <text x="7" y="17" fill="#fff" fontSize="7" fontFamily="monospace">
        C:\
      </text>
      <path d="M7 19h6v2H7z" fill="#fff" />
    </>
  ),
  generator: (
    <>
      <path d="M4 6h24v20H4z" fill="#c0c0c0" stroke="#000" />
      <path d="M6 8h20v12H6z" fill="#000080" />
      <path d="M8 18l5-6 4 4 3-3 4 5z" fill="#7fa9ce" />
      <circle cx="22" cy="12" r="2" fill="#fff" />
      <path d="M10 22h12v2H10z" fill="#808080" />
    </>
  ),
  winamp: (
    <>
      <path d="M4 8h24v16H4z" fill="#232323" stroke="#000" />
      <path d="M6 10h20v7H6z" fill="#0d5c2a" />
      <path d="M8 12h3v3H8zM12 12h3v3h-3zM16 12h6v1h-6z" fill="#39ff6a" />
      <path d="M7 19l4 3-4 3z" fill="#c0c0c0" />
      <path d="M13 19h2v6h-2zM17 19h8v2h-8z" fill="#808080" />
    </>
  ),
  analyzer: (
    <>
      <path d="M4 6h24v20H4z" fill="#c0c0c0" stroke="#000" />
      <path d="M6 8h20v16H6z" fill="#0c0c0c" />
      <path d="M8 18h2v4H8zM11 14h2v8h-2zM14 10h2v12h-2z" fill="#39ff6a" />
      <path d="M17 16h2v6h-2zM20 12h2v10h-2zM23 19h2v3h-2z" fill="#e8d84a" />
    </>
  ),
  chat: (
    <>
      <path d="M3 5h20v14H12l-5 5v-5H3z" fill="#fff" stroke="#000" />
      <path d="M6 9h13v2H6zM6 13h9v2H6z" fill="#000080" />
      <path d="M15 3h14v12h-4v4l-4-4h-1" fill="#c0c0c0" stroke="#000" />
    </>
  ),
  clickme: (
    <>
      <path d="M4 4h24v24H4z" fill="#fff" stroke="#000" />
      <path d="M6 6h20v6H6z" fill="#000080" />
      <path d="M13 15l9 5-4 1 2 4-2 1-2-4-3 3z" fill="#000" />
    </>
  ),
  error: (
    <>
      <circle cx="16" cy="16" r="13" fill="#d40000" stroke="#000" />
      <path
        d="M10 10l12 12M22 10L10 22"
        stroke="#fff"
        strokeWidth="4"
        shapeRendering="auto"
      />
    </>
  ),
  folder: (
    <>
      <path d="M3 7h10l2 3h14v16H3z" fill="#ffd24a" stroke="#000" />
      <path d="M3 12h26v14H3z" fill="#ffe89a" stroke="#000" />
    </>
  ),
  computer: (
    <>
      <path d="M4 6h24v16H4z" fill="#c0c0c0" stroke="#000" />
      <path d="M6 8h20v12H6z" fill="#000080" />
      <path d="M11 22h10v4H11z" fill="#808080" stroke="#000" />
      <path d="M7 26h18v2H7z" fill="#c0c0c0" stroke="#000" />
    </>
  ),
  shutdown: (
    <>
      <circle cx="16" cy="18" r="10" fill="#c0c0c0" stroke="#000" />
      <path d="M16 6v12" stroke="#000" strokeWidth="3" />
      <path d="M22 10a9 9 0 1 1-12 0" fill="none" stroke="#000" strokeWidth="2" />
    </>
  ),
}

export default function Icon({ name, size = 32, className }) {
  const glyph = ICONS[name] ?? ICONS.note
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={S}
      aria-hidden="true"
    >
      {glyph}
    </svg>
  )
}
