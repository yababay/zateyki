#!/bin/bash

. scripts/functions.sh

set_envs

mkdir -p "$STATIC_DIR"

TITLE=$(egrep -m 1 "^# " "$CURRENT_DIR/+page.md" | sed 's/# //')

echo "Generating EPUB with title: $TITLE"

rm "$STATIC_DIR/*.epub"

pandoc "$CURRENT_DIR/+page.md" --metadata title="$TITLE" \
  --toc \
  --toc-depth=2 \
  --katex \
  --output "$STATIC_DIR/`uuidgen`.epub"

#  --css "$CURRENT_DIR/epub.css" \
#  --epub-cover-image "$CURRENT_DIR/cover.jpg" \
#  --epub-metadata "$CURRENT_DIR/metadata.xml" \
#  --epub-stylesheet "$CURRENT_DIR/epub.css" \
