#!/bin/bash

read -p 'Введите имя пути: ' SLUG 

DIR="src/routes/(longread)/$SLUG"
PAGE="$DIR/+page.md"
CODE="$DIR/+page.ts"
ZTC="src/routes/(longread)/zyxel-the-cat"

git checkout article
git checkout -b "$SLUG"
git checkout main -- "$DIR"

cat "$ZTC/+page.md" >> $PAGE
cat "$ZTC/+page.ts" > $CODE
git rm -r "$ZTC"

/usr/bin/gnome-text-editor $PAGE &>/dev/null &
