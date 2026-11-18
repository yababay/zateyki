#!/bin/bash

pandoc -f markdown -t markdown --wrap=none --markdown-headings=atx in.md -o "+page.md"

