#!/bin/bash
# ToneCraft Production Database Backup Script
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/tonecraft_backup_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

echo "[Backup] Starting PostgreSQL backup..."
pg_dump ${DATABASE_URL} | gzip > ${BACKUP_FILE}

echo "[Backup] Successfully created backup at ${BACKUP_FILE}"
