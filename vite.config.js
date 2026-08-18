import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

/**
 * 98.css v0.1.21 ships `@media (not(hover))`, which is malformed. Browsers
 * silently drop the whole at-rule, but lightningcss (Vite 8's CSS minifier)
 * treats it as a hard parse error and fails the build.
 *
 * Rewrite it to `@media not all` — a valid query that never matches — so the
 * rule stays inert exactly as it is today. Note this is deliberately NOT
 * `(hover: hover)`: that would switch the block on, and a button that looks
 * depressed merely from hovering isn't how Windows 98 behaved.
 */
function fix98css() {
  return {
    name: "fix-98css-media-query",
    transform(code, id) {
      if (!id.includes("98.css")) return null
      if (!code.includes("@media (not(hover))")) return null
      return { code: code.replaceAll("@media (not(hover))", "@media not all"), map: null }
    },
  }
}

export default defineConfig({
  plugins: [fix98css(), react()],
})
