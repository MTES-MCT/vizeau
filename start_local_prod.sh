#!/usr/bin/env sh

cd build || { echo "Error: build directory does not exist. Have you ran 'node ace build'?"; exit 1; }
[ ! -d "node_modules" ] && npm ci --omit="dev" || { echo "Error: 'npm ci' failed. Cannot install dependencies." >&2; exit 1; }
ENV_FILE="../.env.prod"
[ ! -f "$ENV_FILE" ] && ENV_FILE="../.env"
node --env-file="$ENV_FILE" bin/server.js
