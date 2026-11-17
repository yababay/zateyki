#!/bin/bash

PATTERN=$1
ROUTES="src/routes"

if [ -z "$PATTERN" ]; then
	echo Укажите выражение для поиска.
	exit 1
fi

cat README.md | egrep '^\*' | grep "$PATTERN" -B 10000 | sed -E 's/^\*[^\(]+\(//;s/\/\)//'| while read l; do
	DRAFT="drafts/$l"
	if [ -d "$DRAFT" ]; then
		mv "$DRAFT" "$ROUTES"
	fi
	if [ -z "`cat .gitignore | grep $l`" ]; then
		echo "$l"
		echo '!/'"$ROUTES/$l/" >> .gitignore
	fi
done

