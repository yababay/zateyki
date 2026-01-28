#!/bin/bash

#. scripts/functions.sh

#set_envs

#git add .
#git commit -am ok 
#git checkout main

CURRENT_BRANCH_1=alternativsik-batuskov-1
CURRENT_BRANCH=alternativsik-batuskov

git checkout "$CURRENT_BRANCH_1" -- "src/routes/(longread)/$CURRENT_BRANCH"

#git add .
#git commit -am "$CURRENT_BRANCH"
#git push origin main 
#git branch -D  "$CURRENT_BRANCH"
