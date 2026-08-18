import styles from "./Specs.module.css"
import { specsText } from "../media.js"

// Notepad. The menu bar is deliberately inert — it's set dressing, and a
// working File menu would raise questions this window can't answer.
const MENUS = ["File", "Edit", "Search", "Help"]

export default function Specs() {
  return (
    <div className={styles.wrap}>
      <div className={styles.menubar}>
        {MENUS.map((m) => (
          <button key={m} type="button" tabIndex={-1}>
            <u>{m[0]}</u>
            {m.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.paper}>
        <pre className="selectable">{specsText}</pre>
      </div>
    </div>
  )
}
