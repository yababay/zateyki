#!/bin/bash

. scripts/functions.sh

set_envs

PAGE=src/routes/\(longread\)/$CURRENT_BRANCH/+page.md

git show main:src/routes/\(longread\)/$CURRENT_BRANCH/+page.md >> $PAGE
git checkout main -- src/routes/\(longread\)/$CURRENT_BRANCH/*.webp

/usr/bin/gnome-text-editor $PAGE &
