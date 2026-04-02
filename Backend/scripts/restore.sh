#!/bin/bash
# Database Restore Script
# Usage: ./restore.sh [backup_file] [database_name]

BACKUP_FILE=$1
DB_NAME=${2:-pos_system}
DB_USER=${3:-postgres}
DB_HOST=${4:-localhost}

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not specified"
  echo "Usage: ./restore.sh [backup_file] [database_name] [db_user] [db_host]"
  echo "Example: ./restore.sh backups/backup_pos_system_20260326_120000.sql.gz pos_system postgres localhost"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the existing database '$DB_NAME'"
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Determine if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "🔄 Decompressing backup file..."
  TEMP_FILE=$(mktemp)
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  BACKUP_FILE="$TEMP_FILE"
fi

echo "🔄 Starting restore of database: $DB_NAME"

# Drop existing database and create new one
echo "📦 Dropping existing database..."
psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "📦 Creating new database..."
psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
echo "📥 Restoring data from backup..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Restore completed successfully!"
  echo "Database '$DB_NAME' has been restored from backup"
else
  echo "❌ Restore failed! Check credentials and backup file integrity."
  exit 1
fi

# Clean up temp file if created
if [ ! -z "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
  rm "$TEMP_FILE"
fi
