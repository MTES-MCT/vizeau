#!/usr/bin/env sh

# Do not run this script in a production environment. See README.md for more details.

# This script starts the application in production mode locally.
# It assumes that the application has already been built using 'node ace build'.
# It also checks for the presence of a .env.prod or .env file for production environment variables.
# Usage: ./start_local_prod.sh

cd build || { echo "Error: build directory does not exist. Have you ran 'node ace build'?"; exit 1; }
if [ ! -d "node_modules" ]; then
   npm ci --omit="dev" || { echo "Error: 'npm ci' failed. Cannot install dependencies." >&2; exit 1; }
fi
ENV_FILE="../.env.prod"
[ ! -f "$ENV_FILE" ] && ENV_FILE="../.env"
node --env-file="$ENV_FILE" bin/server.js
