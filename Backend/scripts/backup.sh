#!/bin/bash
# Database Backup Script
# Usage: ./backup.sh [database_name] [output_dir]

DB_NAME=${1:-pos_system}
DB_USER=${2:-postgres}
DB_HOST=${3:-localhost}
OUTPUT_DIR=${4:-./backups}

# Create backups directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "🔄 Starting backup of database: $DB_NAME"

# Create backup using pg_dump
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
  # Compress backup
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="${BACKUP_FILE}.gz"
  FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
  echo "✅ Backup completed successfully!"
  echo "📦 Backup file: $COMPRESSED_FILE"
  echo "📊 Size: $FILE_SIZE"
  
  # Optional: Delete backups older than 30 days
  echo "🧹 Cleaning up old backups (>30 days)..."
  find "$OUTPUT_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -delete
  echo "✅ Cleanup completed"
else
  echo "❌ Backup failed! Check credentials and database name."
  exit 1
fi
