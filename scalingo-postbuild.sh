#!/usr/bin/env sh

# This script is ran by Scalingo after each deployment.

# Build the AdonisJS application
node ace build
cd build
# Install production dependencies
npm ci --omit='dev'
# Pre-install DuckDB httpfs extension so it is available at runtime without network access
node -e "const {DuckDBInstance} = require('@duckdb/node-api'); (async () => { const db = await DuckDBInstance.create(':memory:'); const conn = await db.connect(); await conn.run('INSTALL httpfs;'); process.exit(0); })().catch(e => { console.error('DuckDB httpfs install failed:', e.message); process.exit(1); });"
# PORT is not set by Scalingo for non-web containers, but AdonisJS needs it to be defined at migration time
export PORT=0
# Run database migrations
node ace migration:run --force
