#!/usr/bin/env bash
set -e

DB_NAME=${DB_NAME:-bizbox}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Initializing BizBox Platform Database on $DB_HOST:$DB_PORT/$DB_NAME..."

# Create database if it doesn't exist
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

# Apply schema
echo "Applying database/schema.sql (18 tables, triggers, and views)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql

# Apply seed data
echo "Applying database/seed_launch_catalog.sql (22 launch apps)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed_launch_catalog.sql

echo "✓ BizBox Database initialized successfully."

