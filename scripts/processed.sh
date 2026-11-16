#!/bin/bash

PATTERN=$1

if [ -z "$PATTERN" ]; then
	echo Укажите выражение для поиска.
	exit 1
fi

cat README.md | egrep '^\*' | grep "$PATTERN" -B 10000 | sed -E 's/^\*[^\(]+\(/!\/src\/routes\//;s/\)//'
