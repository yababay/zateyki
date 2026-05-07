#!/bin/bash

. scripts/functions.sh

set_envs

cd $CURRENT_DIR

pandoc story.md -o ../../../../build/$CURRENT_BRANCH.epub
