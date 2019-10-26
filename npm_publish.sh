#!/bin/bash

echo "### Publishing..."

yarn test

if [[ $? != 0 ]]
 then exit 1
fi

branch_name=$(git symbolic-ref HEAD --short)

# only master branch can send report
if [[ branch_name == "master" ]]
  then yarn coverage:report
fi

yarn build

cat NPM_README.md > README.md

yarn login

yarn publish

git checkout .

echo "### Publish done."
