#!/bin/bash

. scripts/functions.sh

set_envs

gnome-text-editor $CURRENT_DIR/story.md &>/dev/null &
