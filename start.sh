#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! bun run db:check 2>/dev/null; do
  echo "Database not ready yet, waiting..."
  sleep 2
done

# Run database migrations
echo "Running database migrations..."
bun run db:push

# Start the application
echo "Starting application..."
exec bun run src/index.ts
