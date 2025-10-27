#!/usr/bin/env sh

# Run this to create a database container ready-to-use for dev.
# Do not use in production!

docker run -d --name vizeau-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=vizeau \
  -e POSTGRES_INITDB_ARGS=--auth=scram-sha-256 \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 5432:5432 \
  postgres:16.9-alpine
