#!/bin/bash
GIT_ROOT=$(git rev-parse --show-toplevel)
LIB_DIR="$GIT_ROOT/lib/demoparser/src/wasm"
OUT_DIR="$GIT_ROOT/public/lib/demoparser"
cd $LIB_DIR
wasm-pack build --out-dir $OUT_DIR --target web
cd -