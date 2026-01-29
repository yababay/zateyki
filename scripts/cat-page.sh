#!/bin/bash

. scripts/functions.sh

set_envs

git show main:src/routes/(longread)/$CURRENT_BRANCH/+page.md >> "$CURRENT_DIR/+page.md"
