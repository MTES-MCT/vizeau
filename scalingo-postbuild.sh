#!/usr/bin/env sh

# This script is ran by Scalingo after each deployment.

# Build the AdonisJS application
node ace build
cd build
# Install production dependencies
npm ci --omit='dev'
# PORT is not set by Scalingo for non-web containers, but AdonisJS needs it to be defined at migration time
export PORT=0
# Run database migrations
node ace migration:run --force
