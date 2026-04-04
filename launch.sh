#!/bin/bash

set -e

cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js 20+."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Conductor..."
echo "Open http://localhost:5173 in Chrome or Edge."
npm run dev
