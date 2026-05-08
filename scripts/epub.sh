#!/bin/bash

. scripts/functions.sh

set_envs

cd $CURRENT_DIR

cat story.md | awk -f ../../../../scripts/latex.awk > /tmp/story.md

pandoc /tmp/story.md -o ~/Documents/$CURRENT_BRANCH.epub
