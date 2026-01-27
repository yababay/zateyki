#!/bin/bash

. .env

# aws s3 sync build/ s3://yababay.website.yandexcloud.net/

aws s3 sync ./build s3://yababay --endpoint https://storage.yandexcloud.net