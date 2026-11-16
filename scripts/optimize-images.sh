#!/bin/bash

CURRENT_DIR=$1

if [ -z "$CURRENT_DIR" ]; then
    echo Укажите директорию для оптимизации.
    exit 1
fi

npx image-transmutation --run --sourceFolder "$CURRENT_DIR" --targetFolder "$CURRENT_DIR" --inputFormats 'jpg' --inputFormats 'jpeg' --inputFormats 'png' --outputFormats 'webp'
