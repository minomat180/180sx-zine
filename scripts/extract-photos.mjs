// One-off: pull the base64 photos out of the older single-file 180sx tribute page
// (~/projects/180sx/index.html) and write them into public/media/photos/ as real
// files. Kept around so the extraction is reproducible, not because it needs to
// run again. The source project is only read, never modified.
//
//   node scripts/extract-photos.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const SOURCE = join(homedir(), "projects", "180sx", "index.html")
const OUT_DIR = join(import.meta.dirname, "..", "public", "media", "photos")

// template.html marks the slots as __BLACK__ / __NAVY__ / __REAR__ in document
// order, and the hero lives in a --heroimg CSS var ahead of them.
const NAMES = ["hero", "black", "navy", "rear"]

const html = readFileSync(SOURCE, "utf8")
const matches = [...html.matchAll(/data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)/g)]

if (matches.length === 0) {
  console.error(`No embedded images found in ${SOURCE}`)
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

matches.forEach(([, ext, b64], i) => {
  const name = `${NAMES[i] ?? `photo${i + 1}`}.${ext === "jpeg" ? "jpg" : ext}`
  const buf = Buffer.from(b64, "base64")
  writeFileSync(join(OUT_DIR, name), buf)
  console.log(`${name.padEnd(12)} ${(buf.length / 1024).toFixed(0)} KB`)
})
