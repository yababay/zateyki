#!/bin/bash

. scripts/functions.sh

set_envs

PAGE=src/routes/\(longread\)/$CURRENT_BRANCH/+page.md

git show main:src/routes/\(longread\)/$CURRENT_BRANCH/+page.md >> $PAGE

/usr/bin/gnome-text-editor $PAGE

