#!/usr/bin/env sh

cd build
[ ! -d "node_modules" ] && npm ci --omit="dev"
ENV_FILE="../.env.prod"
[ ! -f "$ENV_FILE" ] && ENV_FILE="../.env"
node --env-file="$ENV_FILE" bin/server.js
