#!/usr/bin/env bash
#
# Pull a YouTube mix and split it into one file per chapter, straight into
# public/media/audio/.
#
#   ./scripts/import-audio.sh <youtube-url> [prefix]
#
# Grabs format 140 (128 kbps AAC) and cuts on chapter boundaries with a stream
# copy — no re-encode, so the split is lossless and fast. Chapters come from
# the timestamps in the video description; if a video has none, yt-dlp writes a
# single file and there is nothing to split.
#
# After running, list the results in the `tracks` array in src/media.js.

set -euo pipefail

URL="${1:?usage: import-audio.sh <youtube-url> [prefix]}"
PREFIX="${2:-track}"

DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/media/audio"
mkdir -p "$DEST"

command -v yt-dlp >/dev/null || { echo "yt-dlp not found" >&2; exit 1; }
ffmpeg -version >/dev/null 2>&1 || { echo "ffmpeg is not working — splitting needs it" >&2; exit 1; }

yt-dlp \
  --format 140 \
  --split-chapters \
  --paths "$DEST" \
  --output "chapter:${PREFIX}-%(section_number)02d.%(ext)s" \
  --output "${PREFIX}-full.%(ext)s" \
  --no-warnings \
  "$URL"

# The full-length file is only a byproduct of the split.
rm -f "$DEST/${PREFIX}-full."*

echo
echo "Wrote to $DEST:"
ls -1sh "$DEST"/${PREFIX}-*
