import { video } from "../media.js"

// Branches on the manifest so a local file and a YouTube embed are the same
// one-line change in src/media.js.
export default function VideoWindow() {
  const box = {
    flex: "1 1 auto",
    minHeight: 0,
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }

  if (video?.kind === "youtube") {
    return (
      <div style={box}>
        <iframe
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          src={`https://www.youtube-nocookie.com/embed/${video.id}`}
          title={video.title ?? "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (video?.kind === "file") {
    return (
      <div style={box}>
        <video
          src={video.src}
          controls
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 12, fontFamily: "var(--font-mono)", fontSize: 12 }}>
      No video configured. Set <code>video</code> in <code>src/media.js</code>.
    </div>
  )
}
