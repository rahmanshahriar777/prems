#!/bin/bash
set -e

echo "🚀 Starting Neoteric Digital EMS on Google Cloud Run..."

# Set Cloud Run port (default 8080)
PORT="${PORT:-8080}"
sed -i "s/listen 8080;/listen ${PORT};/g" /etc/nginx/nginx.conf

# 1. Database Initialization
# If DATABASE_URL is not provided or points to localhost, start embedded PostgreSQL
if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"localhost"* ]] || [[ "$DATABASE_URL" == *"127.0.0.1"* ]]; then
  echo "📦 Initializing Embedded PostgreSQL Database..."
  mkdir -p /run/postgresql /var/lib/postgresql/data
  chown -R postgres:postgres /run/postgresql /var/lib/postgresql/data

  if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
    echo "Creating database cluster..."
    su-exec postgres initdb -D /var/lib/postgresql/data --auth=trust
    echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
  fi

  echo "Starting PostgreSQL daemon..."
  su-exec postgres pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start

  # Wait for postgres to accept connections
  until su-exec postgres pg_isready; do
    echo "Waiting for postgres..."
    sleep 1
  done

  # Create ems_admin user and ems_db if not exists
  su-exec postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='ems_admin'" | grep -q 1 || \
    su-exec postgres psql -c "CREATE USER ems_admin WITH SUPERUSER PASSWORD 'ems_secure_password_123!';"

  su-exec postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='ems_db'" | grep -q 1 || \
    su-exec postgres psql -c "CREATE DATABASE ems_db OWNER ems_admin;"

  export DATABASE_URL="postgresql://ems_admin:ems_secure_password_123!@127.0.0.1:5432/ems_db?schema=public"
  echo "✅ Embedded PostgreSQL ready"

  # Sync Prisma schema and seed initial database
  echo "🌱 Syncing database schema and running seed..."
  cd /app/packages/database
  DATABASE_URL="$DATABASE_URL" npx prisma db push --skip-generate || true
  DATABASE_URL="$DATABASE_URL" npx tsx prisma/seed.ts || true
  cd /app
fi

# 2. Start NestJS API Backend in background
echo "⚡ Starting NestJS API Backend on port 4000..."
cd /app/apps/api
PORT=4000 NODE_ENV=production DATABASE_URL="${DATABASE_URL}" node dist/main.js &
API_PID=$!

# 3. Start Next.js Frontend in background
echo "🌐 Starting Next.js Web Frontend on port 3000..."
cd /app/apps/web
PORT=3000 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_PUBLIC_API_URL="/api/v1" ./node_modules/.bin/next start -p 3000 &
WEB_PID=$!

cd /app

# 4. Wait for internal services to become ready
echo "⏳ Waiting for API to become ready on port 4000..."
for i in $(seq 1 45); do
  if curl -s http://127.0.0.1:4000/api/v1/health > /dev/null 2>&1 || curl -s http://127.0.0.1:4000/api/v1/leave-types > /dev/null 2>&1; then
    echo "✅ API is up and running on port 4000!"
    break
  fi
  sleep 1
done

echo "⏳ Waiting for Web Frontend to become ready on port 3000..."
for i in $(seq 1 45); do
  if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "✅ Web Frontend is up and running on port 3000!"
    break
  fi
  sleep 1
done

# Graceful termination handler
trap "echo 'Shutting down...'; kill $API_PID $WEB_PID; exit 0" SIGTERM SIGINT

# 5. Start Nginx reverse proxy in foreground
echo "🛡️ Starting Nginx on port ${PORT}..."
nginx -g "daemon off;"

