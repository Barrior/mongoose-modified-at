#!/bin/bash

echo "### Publishing..."

cat NPM_README.md > README.md

npm adduser

npm publish

git checkout .

echo "### Publish done."
