#!/bin/bash

. scripts/functions.sh

set_envs

git checkout main -- src/routes/\(longread\)/$CURRENT_BRANCH
