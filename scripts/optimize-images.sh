#!/bin/bash

DIR=`find 'src/routes/(longread)' -type d | tail -n 1` 

npx image-transmutation --run --sourceFolder "$DIR" --targetFolder "$DIR" --inputFormats 'jpg' --inputFormats 'jpeg' --inputFormats 'png' --outputFormats 'webp'
rm "$DIR/*.png" "$DIR/*.jpg" "$DIR/*.jpeg"
