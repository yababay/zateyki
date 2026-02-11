#!/bin/bash

. scripts/functions.sh

set_envs

PAGE=src/routes/\(longread\)/$CURRENT_BRANCH/+page.md

git show main:src/routes/\(longread\)/$CURRENT_BRANCH/+page.md >> $PAGE

sleep 1

if [ -n "`git show main:src/routes/\(longread\)/$CURRENT_BRANCH/*.webp`" ]; then 
    git checkout main -- src/routes/\(longread\)/$CURRENT_BRANCH/*.webp
fi

sleep 1

/usr/bin/gnome-text-editor $PAGE &>/dev/null &
