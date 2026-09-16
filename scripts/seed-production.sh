#!/usr/bin/env bash
# ==============================================================================
# Production Safe Seeding Script (Idempotent upserts for roles and baseline data)
# ==============================================================================
set -euo pipefail

echo "🌱 Running production baseline seed..."
pnpm --filter @ems/database db:seed

echo "✅ Baseline production data verified."
