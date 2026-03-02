#!/bin/bash

read -p 'Введите имя пути: ' SLUG 

DIR="src/routes/(longread)/$SLUG"
PAGE="$DIR/+page.md"
CODE="$DIR/+page.ts"

git checkout article
git checkout -b "$SLUG"
git checkout main -- "$DIR"

# git "src/routes/(longread)/zyxel-the-cat/+page.md" >> $PAGE
# cat "src/routes/(longread)/zyxel-the-cat/+page.ts" > $CODE
git rm -r "src/routes/(longread)/zyxel-the-cat"

/usr/bin/gnome-text-editor $PAGE &>/dev/null &
