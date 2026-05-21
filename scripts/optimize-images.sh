#!/bin/bash

. scripts/functions.sh

set_envs

STAT_DIR="static/$CURRENT_BRANCH"
BNR="$STAT_DIR/banner.webp"
IMG="$STAT_DIR/image.webp"

mkdir -p $STAT_DIR

npx image-transmutation --run --sourceFolder "$CURRENT_DIR" --targetFolder $STAT_DIR --inputFormats 'jpg' --inputFormats 'jpeg' --inputFormats 'png' --outputFormats 'webp'

if [ -f "$BNR" ]; then
    mv "$BNR" "$CURRENT_DIR"
fi

if [ -f "$IMG" ]; then
    mv "$IMG" "$CURRENT_DIR"
fi
