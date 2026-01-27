#!/bin/bash

YC_URL="yababay.website.yandexcloud.net"

echo '# Лонгриды Михаила Белякова' > README.md

cat .README.md | sed "s/](/](https\:\/\/$YC_URL/" >> README.md
