#!/bin/sh
set -e

# Run database migrations if database doesn't exist or needs migration
echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

# Start the application
echo "Starting application..."
exec node server.js
