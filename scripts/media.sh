#!/bin/sh
# Put the site's photos, music and video into public/media/.
#
# They live in the private repo minomat180/180sx-media, because most of them
# belong to other people and must not be redistributed by this repo. The clone
# goes to .media/ and only the media folders are copied, so the media repo's
# .git never ends up in dist/.
#
#   npm run media              # clone (first run) and copy
#   rm -rf .media && npm run media   # refresh
#
# CI checks the repo out into .media/ with a deploy key first; this script
# then only copies.
set -eu

repo="${MEDIA_REPO:-https://github.com/minomat180/180sx-media.git}"

if [ ! -d .media ]; then
  git clone --depth 1 "$repo" .media
fi

mkdir -p public/media
for dir in audio photos video; do
  rm -rf "public/media/$dir"
  cp -R ".media/$dir" "public/media/$dir"
done
echo "public/media/: $(find public/media -type f | wc -l | tr -d ' ') files"
