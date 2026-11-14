#!/usr/bin/env bash
set -euo pipefail

a="README.md"
b="src/routes/+page.md"

for f in "$a" "$b"; do
    [[ -f $f ]] || { printf 'Нет файла: %s\n' "$f" >&2; exit 1; }
done

if   [[ $a -nt $b ]]; then cp -p -- "$a" "$b"; echo "$a → $b"
elif [[ $b -nt $a ]]; then cp -p -- "$b" "$a"; echo "$b → $a"
else echo 'Время изменения совпадает — ничего не делаю.'
fi