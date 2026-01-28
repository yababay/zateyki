#!/bin/bash

. .env

function set_envs {
    export CURRENT_DIR=`find 'src/routes/(longread)' -type d | tail -n 1` 
    export CURRENT_BRANCH=`echo $CURRENT_DIR | egrep -o '[a-z0-9\-]+$'` 
}
