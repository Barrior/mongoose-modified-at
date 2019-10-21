#!/bin/bash

echo "### Publishing..."

yarn test

if [[ $? != 0 ]]
 then exit 1
fi

yarn coverage

yarn build

cat NPM_README.md > README.md

yarn login

yarn publish

git checkout .

echo "### Publish done."
