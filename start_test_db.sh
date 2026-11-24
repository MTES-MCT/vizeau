#!/usr/bin/env sh

# Run this to create a database container ready-to-use for tests.
# Do not use in production!

CONTAINER_NAME=vizeau-test-db

# Si le conteneur existe déjà, on le redémarre au lieu d'en créer un nouveau.
if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  docker start "$CONTAINER_NAME"
  exit $?
fi

docker run -d --name "$CONTAINER_NAME" \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=vizeau_test \
  -e POSTGRES_INITDB_ARGS=--auth=scram-sha-256 \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 5433:5432 \
  postgres:16.9-alpine
