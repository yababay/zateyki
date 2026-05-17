#!/bin/bash

. scripts/functions.sh

set_envs

mkdir -p "static/$CURRENT_BRANCH"

npx image-transmutation --run --sourceFolder "$CURRENT_DIR" --targetFolder "static/$CURRENT_BRANCH" --inputFormats 'jpg' --inputFormats 'jpeg' --inputFormats 'png' --outputFormats 'webp'
