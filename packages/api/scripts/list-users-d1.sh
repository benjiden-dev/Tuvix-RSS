#!/bin/bash
# List all users from Cloudflare D1 database
# This script temporarily updates wrangler.toml with the database ID from wrangler.toml.local
# and then restores it after execution.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRANGLER_TOML="$API_DIR/wrangler.toml"
WRANGLER_TOML_LOCAL="$API_DIR/wrangler.toml.local"
SQL_FILE="$API_DIR/scripts/list-users.sql"

# Check if wrangler.toml.local exists
if [ ! -f "$WRANGLER_TOML_LOCAL" ]; then
  echo "❌ Error: wrangler.toml.local not found"
  echo "   Please create it from wrangler.toml.local.example"
  exit 1
fi

# Extract database_id from wrangler.toml.local (just the UUID value)
DATABASE_ID=$(grep -E '^\s*database_id\s*=' "$WRANGLER_TOML_LOCAL" | sed -E 's/.*database_id\s*=\s*"([^"]+)".*/\1/' | head -1)

if [ -z "$DATABASE_ID" ]; then
  echo "❌ Error: Could not extract database_id from wrangler.toml.local"
  exit 1
fi

# Create backup of wrangler.toml
BACKUP_FILE="${WRANGLER_TOML}.bak.$$"
cp "$WRANGLER_TOML" "$BACKUP_FILE"

# Function to restore wrangler.toml
restore_wrangler_toml() {
  if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$WRANGLER_TOML"
  fi
}

# Trap to ensure cleanup on exit
trap restore_wrangler_toml EXIT

# Temporarily update wrangler.toml with actual database ID using Python
# Use a temp Python script to avoid heredoc variable expansion issues
TEMP_PY=$(mktemp)
cat > "$TEMP_PY" <<PYSCRIPT
import re
import sys
database_id = sys.argv[1]
with open("$WRANGLER_TOML", "r") as f:
    content = f.read()
content = re.sub(r'\$\{D1_DATABASE_ID\}', database_id, content)
with open("$WRANGLER_TOML", "w") as f:
    f.write(content)
PYSCRIPT
python3 "$TEMP_PY" "$DATABASE_ID"
rm -f "$TEMP_PY"

# Run the query
cd "$API_DIR"
# Read SQL and execute as command to get actual results
SQL_QUERY=$(cat "$SQL_FILE" | grep -v '^--' | tr '\n' ' ' | sed 's/  */ /g')
wrangler d1 execute tuvix --remote --command "$SQL_QUERY" --json --yes 2>&1 | grep -v "WARNING\|ratelimits\|Processing wrangler.toml" || true

# Restore is handled by trap
