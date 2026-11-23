#!/bin/sh
# GMG Uganda API - Docker Entrypoint Script
# Ensures database is ready before starting the application

set -e

# Create uploads directory for profile photos
mkdir -p /app/uploads/profiles
echo "✅ Uploads directory ready"

echo "═══════════════════════════════════════════════════════════"
echo "🚀 GMG Uganda API - Docker Entrypoint"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Environment:"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo "   DB_HOST: ${DB_HOST:-localhost}"
echo "   DB_PORT: ${DB_PORT:-3306}"
echo "   DB_NAME: ${DB_NAME:-gmg_uganda}"
echo "   REDIS_HOST: ${REDIS_HOST:-localhost}"
echo "   PORT: ${PORT:-3010}"
echo ""

# Wait for database to be ready
echo "🔄 Checking database connection..."
node scripts/wait-for-db.js

# Run database migrations if needed
if [ -f "scripts/migrate.js" ]; then
    echo "🔄 Running database migrations..."
    node scripts/migrate.js || echo "⚠️  Migration skipped or already applied"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Starting GMG Uganda API Server"
echo "═══════════════════════════════════════════════════════════"

# Start the application
exec node server.js
