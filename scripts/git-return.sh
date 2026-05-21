#!/bin/bash

. scripts/functions.sh

set_envs

git add .
git commit -am ok 
git checkout main
git checkout "$CURRENT_BRANCH" -- "src/routes/(longread)/$CURRENT_BRANCH"
git add .
git commit -am "$CURRENT_BRANCH"
git push origin main 
