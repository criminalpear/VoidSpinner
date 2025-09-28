#!/usr/bin/env bash
set -euo pipefail

# Run this script to fully prepare and start the app in a Codespace or local machine.
# It will: install deps, run local DB setup (if needed), then start the dev server.

# Usage:
#   ./scripts/run-codespace.sh

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

echo "1/4 - Installing dependencies (npm ci)..."
npm ci

# create .env and sqlite if missing
if [ ! -f ".env" ]; then
  echo "2/4 - Running local DB setup (./scripts/setup-local-db.sh)..."
  ./scripts/setup-local-db.sh
else
  echo "2/4 - .env already exists, skipping DB setup"
fi

# optional quick type check
if command -v tsc >/dev/null 2>&1; then
  echo "3/4 - Typechecking (npm run check)..."
  npm run check || true
fi

# start dev server
echo "4/4 - Starting dev server (npm run dev)"
npm run dev
