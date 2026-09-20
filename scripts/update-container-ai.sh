#!/bin/bash
set -ex

echo "=== 1. Creating Environment File with AI API Keys ==="
cat << EOF > /home/dev/ems.env
PORT=8080
AI_GEMINI_API_KEY=${AI_GEMINI_API_KEY:-""}
GEMINI_API_KEY=${GEMINI_API_KEY:-""}
AI_GROQ_API_KEY=${AI_GROQ_API_KEY:-""}
GROQ_API_KEY=${GROQ_API_KEY:-""}
AI_PRIMARY_PROVIDER=gemini
AI_SECONDARY_PROVIDER=groq
AI_GEMINI_MODEL=gemini-1.5-flash
AI_GROQ_MODEL=llama-3.3-70b-versatile
AI_TIMEOUT_MS=30000
AI_CIRCUIT_FAILURE_THRESHOLD=5
AI_CIRCUIT_RECOVERY_WINDOW_MS=30000
AI_CIRCUIT_HALF_OPEN_LIMIT=2
EOF

chown dev:dev /home/dev/ems.env

echo "=== 2. Creating Persistent Docker Volume for PostgreSQL ==="
docker volume create ems-pgdata || true

echo "=== 3. Restarting ems-app with AI Environment Variables and Volume ==="
IMAGE="us-central1-docker.pkg.dev/project-58b53849-89ee-4aeb-a05/cloud-run-source-deploy/ndems-app:v3"

docker stop ems-app || true
docker rm ems-app || true

docker run -d \
  --name ems-app \
  --restart always \
  -p 127.0.0.1:8080:8080 \
  -v ems-pgdata:/var/lib/postgresql/data \
  --env-file /home/dev/ems.env \
  "$IMAGE"

echo "=== 4. Waiting for Application to initialize ==="
for i in $(seq 1 45); do
  if curl -s http://127.0.0.1:8080/api/v1/departments > /dev/null 2>&1; then
    echo "✅ Backend API is responding!"
    break
  fi
  echo "Waiting for container services... ($i/45)"
  sleep 2
done

echo "=== 5. Restoring Database Backup ==="
if [ -f /tmp/ems_db_backup.sql ]; then
  echo "Restoring database from /tmp/ems_db_backup.sql..."
  docker exec -i ems-app su-exec postgres psql -d ems_db < /tmp/ems_db_backup.sql || true
fi

echo "=== 6. Re-linking User Accounts and Roles ==="
if [ -f /home/dev/prems/scripts/provision-users.js ]; then
  docker cp /home/dev/prems/scripts/provision-users.js ems-app:/app/provision-users.js
  docker exec -e DATABASE_URL="postgresql://ems_admin:ems_secure_password_123!@127.0.0.1:5432/ems_db?schema=public" ems-app node /app/provision-users.js || true
fi

echo "=== 7. Verification ==="
curl -s http://127.0.0.1:8080/api/v1/ai/health || true

echo "=== Container Update with AI Configuration Complete ==="
