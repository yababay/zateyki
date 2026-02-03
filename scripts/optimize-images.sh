#!/bin/bash

DIR=`find 'src/routes/(longread)' -type d | tail -n 1` 

npx image-transmutation --run --sourceFolder "$DIR" --targetFolder "$DIR" --inputFormats 'jpg' --inputFormats 'jpeg' --inputFormats 'png' --outputFormats 'webp'

find "$DIR" -name *.png -exec rm {} \;

sed 's/\/\/\ //;s/\/\*//;s/\*\///' -i "$DIR/+page.ts"
