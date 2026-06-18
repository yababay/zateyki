#!/bin/bash

. scripts/functions.sh

set_envs

mkdir -p "$STATIC_DIR"

pandoc "$CURRENT_DIR/+page.md" -o "STATIC_DIR/book.epub"
