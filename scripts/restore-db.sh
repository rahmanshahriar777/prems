#!/usr/bin/env bash
# ==============================================================================
# Database Restore Script
# ==============================================================================
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "⚠️ Restoring database from: ${BACKUP_FILE}"
read -p "This will overwrite the target database. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore aborted."
  exit 0
fi

gunzip -c "${BACKUP_FILE}" | docker exec -i ems-postgres psql -U "${POSTGRES_USER:-ems_admin}" -d "${POSTGRES_DB:-ems_db}"

echo "✅ Database restored successfully."
