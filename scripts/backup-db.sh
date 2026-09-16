#!/usr/bin/env bash
# ==============================================================================
# Database Automated Backup Script for PostgreSQL
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ems_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "📦 Starting PostgreSQL database backup..."
docker exec -t ems-postgres pg_dump -U "${POSTGRES_USER:-ems_admin}" -d "${POSTGRES_DB:-ems_db}" --clean --if-exists | gzip > "${BACKUP_FILE}"

echo "✅ Backup successfully created at: ${BACKUP_FILE}"
echo "File size: $(du -h "${BACKUP_FILE}" | cut -f1)"
