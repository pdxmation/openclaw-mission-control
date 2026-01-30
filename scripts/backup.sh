#!/bin/bash
#
# PostgreSQL Backup Script for Mission Control
# Creates compressed backups before schema migrations
#
# Usage:
#   ./scripts/backup.sh           # Manual backup
#   npm run db:backup             # Via npm script
#
# Restore:
#   gunzip -c backups/backup-TIMESTAMP.sql.gz | psql $DATABASE_URL
#

set -e

# Add libpq to PATH if installed via Homebrew (macOS)
if [ -d "/opt/homebrew/opt/libpq/bin" ]; then
    export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
fi

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "   Make sure .env file exists with DATABASE_URL"
    exit 1
fi

# Strip ?schema=... parameter (pg_dump doesn't support it, Prisma adds it)
CLEAN_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/\?schema=[^&]*//' | sed 's/&schema=[^&]*//')

# Setup
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "🗄️  Mission Control Database Backup"
echo "   Timestamp: $TIMESTAMP"
echo "   Output: $BACKUP_FILE"
echo ""

# Run pg_dump with compression
echo "📦 Creating backup..."
if pg_dump "$CLEAN_DATABASE_URL" --no-owner --no-acl 2>/dev/null | gzip > "$BACKUP_FILE"; then
    # Verify the backup file exists and has content
    if [ -s "$BACKUP_FILE" ]; then
        SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo "✅ Backup complete: $BACKUP_FILE ($SIZE)"
        
        # Keep only last 10 backups to prevent disk bloat
        BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
        if [ "$BACKUP_COUNT" -gt 10 ]; then
            echo "🧹 Cleaning old backups (keeping last 10)..."
            ls -1t "$BACKUP_DIR"/backup-*.sql.gz | tail -n +11 | xargs rm -f
        fi
        
        exit 0
    else
        echo "❌ ERROR: Backup file is empty"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo "❌ ERROR: pg_dump failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi
