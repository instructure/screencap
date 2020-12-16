#!/usr/bin/env bash

ZIP_PATH=$(pwd)/$1
cd $2
rm -rf $ZIP_PATH
zip -r -X $ZIP_PATH . %1>/dev/null %2>/dev/null
echo "{ \"hash\": \"$(cat "$ZIP_PATH" | shasum -a 256 | cut -d " " -f 1 | xxd -r -p | base64)\", \"md5\": \"$(cat "$ZIP_PATH" | md5)\" }"