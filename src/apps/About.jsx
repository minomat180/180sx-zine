import Icon from "../os/Icon.jsx"
import { aboutText } from "../media.js"

export default function About() {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        lineHeight: 1.5,
        overflow: "auto",
      }}
    >
      <Icon name="computer" size={40} />
      <div className="selectable">
        <div
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: 12,
            marginBottom: 10,
            lineHeight: 1.6,
          }}
        >
          180SX
          <br />
          ZINE
        </div>
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{aboutText}</p>
        <p style={{ marginTop: 12, color: "#555" }}>
          Not produced by, endorsed by, or connected with Nissan Motor Co., Ltd.
        </p>
      </div>
    </div>
  )
}
