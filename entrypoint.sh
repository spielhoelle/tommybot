#!/bin/bash
set -e

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# docker exec gpsql_shadow psql -Upostgres postgres -c "drop database tommybot;"
# docker exec gpsql_shadow psql -Upostgres postgres -c "create database tommybot;"
# docker exec gpsql psql -Upostgres postgres -c "drop database tommybot;"
# docker exec gpsql psql -Upostgres postgres -c "create database tommybot;"

export DATABASE_URL=postgresql://postgres:password@0.0.0.0:5432/tommybot
export SHADOW_DATABASE_URL=postgresql://postgres:password@0.0.0.0:5431/tommybot

if [ -z "$DATABASE_URL" ]; then
  echo "Missing DATABASE_URL env variables"
fi
if [ -z "$SHADOW_DATABASE_URL" ]; then
  echo "Missing SHADOW_DATABASE_URL env variables"
fi

if [ "$(docker ps -aq -f status=exited -f name=gpsql)" ]; then
  docker start gpsql
fi
if [ ! "$(docker ps -a -q -f name=gpsql)" ]; then
  docker run -p 5432:5432 --name gpsql -e POSTGRES_PASSWORD=password -d postgres
  sleep 1
	docker exec gpsql psql -Upostgres postgres -c "create database tommybot;"
fi

if [ "$(docker ps -aq -f status=exited -f name=gpsql_shadow)" ]; then
  docker start gpsql_shadow
fi
if [ ! "$(docker ps -a -q -f name=gpsql_shadow)" ]; then
  docker run -p 5431:5432 --name gpsql_shadow -e POSTGRES_PASSWORD=password -d postgres
  sleep 1
	docker exec gpsql_shadow psql -Upostgres postgres -c "create database tommybot;"
fi

echo "111111111111111"

# Check if schema.prisma is changed
SCHEMA_CHANGED=$(git status --porcelain | grep "schema.prisma" 2>/dev/null || true)

if [ -f "prisma/migration_lock.toml" ]; then
  # Check if there's a difference detected by prisma migrate diff
  echo "222222222222222"
  DIFFERENCE_DETECTED=$(npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations prisma/migrations --shadow-database-url $SHADOW_DATABASE_URL | grep "No difference detected." || true)

  echo "FFERENCE_DETECTED"
  echo $DIFFERENCE_DETECTED

  if [ -z "$DIFFERENCE_DETECTED" ]; then
      # If schema.prisma is changed
      echo "33333333333"
      echo "schema.prisma changed"

      # First create down migration
      npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations prisma/migrations --shadow-database-url $SHADOW_DATABASE_URL --script > down.sql
      echo "Created down migration"

      # Then create up migration
      npx prisma migrate dev --create-only
      latest_migration_folder=$(ls -t -d prisma/migrations/*/ | head -1)
      echo "latest_migration_folder"
      echo $latest_migration_folder
      mv down.sql $latest_migration_folder
      
      echo "Please adjust migration files manually in $latest_migration_folder"
      code $latest_migration_folder/migration.sql
      code $latest_migration_folder/down.sql
      exit 1
  fi 
else
  echo "444444444444444"
  npx prisma migrate dev
  npx prisma db seed
fi 
