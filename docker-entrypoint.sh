#!/bin/sh

if [ -d /run/secrets ] ; then
  export $(grep -E -v '^#' /run/secrets/*)
fi

node index.js
