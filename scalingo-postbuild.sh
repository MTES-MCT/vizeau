#!/usr/bin/env sh

# This script is ran by Scalingo after each deployment.

# Depuis @swc/core 1.16, le binaire natif est extrait dans un cache dont tous les dossiers parents
# doivent être protégés, ce que les conteneurs de build Scalingo ne respectent pas (ERR_SWC_NATIVE_CACHE).
# À supprimer quand SWC aura corrigé ce comportement.
export SWC_NATIVE_BINDING_CACHE_SKIP_SECURITY_CHECK=1

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
