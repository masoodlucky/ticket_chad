#!/bin/bash
cd ~/ticket_chad/src/ticket_chad_backend
cargo build --target wasm32-unknown-unknown --release

if [ $? -eq 0 ]; then
  echo "Build successful! The error is fixed."
else
  echo "Build failed. Please check the error messages above."
fi 