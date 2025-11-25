#!/bin/bash
# Delete all non-admin users from Cloudflare D1 database
# This script temporarily updates wrangler.toml with the database ID from wrangler.toml.local
# and then restores it after execution.
#
# WARNING: This will permanently delete all users with role != 'admin'
# This action cannot be undone!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRANGLER_TOML="$API_DIR/wrangler.toml"
WRANGLER_TOML_LOCAL="$API_DIR/wrangler.toml.local"

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

# First, show which users will be deleted
echo "⚠️  WARNING: This will delete all non-admin users!"
echo ""
echo "Fetching current users..."
cd "$API_DIR"
USERS_JSON=$(wrangler d1 execute tuvix --remote --command "SELECT id, name, email, role FROM user ORDER BY id;" --json --yes 2>&1 | grep -v "WARNING\|ratelimits\|Processing wrangler.toml" || true)

# Extract non-admin users
NON_ADMIN_USERS=$(echo "$USERS_JSON" | python3 -c "
import sys
import json
try:
    data = json.load(sys.stdin)
    if data and len(data) > 0 and 'results' in data[0]:
        users = data[0]['results']
        non_admin = [u for u in users if u.get('role') != 'admin']
        if non_admin:
            print('Non-admin users to be deleted:')
            for u in non_admin:
                print(f\"  - ID {u['id']}: {u['name']} ({u['email']})\")
            print(f\"\\nTotal: {len(non_admin)} user(s)\")
        else:
            print('No non-admin users found.')
            sys.exit(0)
    else:
        print('Could not parse user data.')
        sys.exit(1)
except Exception as e:
    print(f'Error parsing JSON: {e}')
    sys.exit(1)
" 2>&1)

if [ $? -ne 0 ] || [ -z "$NON_ADMIN_USERS" ]; then
  echo "❌ Error: Could not fetch users or parse response"
  echo "$USERS_JSON"
  exit 1
fi

echo "$NON_ADMIN_USERS"
echo ""

# Check for --yes flag to skip confirmation (check all arguments)
SKIP_CONFIRM=false
for arg in "$@"; do
  if [ "$arg" = "--yes" ] || [ "$arg" = "-y" ]; then
    SKIP_CONFIRM=true
    break
  fi
done

# Confirm deletion (unless --yes flag is provided)
if [ "$SKIP_CONFIRM" = false ]; then
  read -p "Are you sure you want to delete these users? (type 'yes' to confirm): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deletion cancelled."
    exit 0
  fi
else
  echo "⚠️  --yes flag provided, skipping confirmation..."
fi

# Delete non-admin users
# The SQL will cascade delete related data automatically
echo ""
echo "🗑️  Deleting non-admin users..."
SQL_QUERY="
-- Delete verification tokens for non-admin users
DELETE FROM verification WHERE identifier IN (SELECT email FROM user WHERE role != 'admin');

-- Delete audit logs for non-admin users
DELETE FROM security_audit_log WHERE user_id IN (SELECT id FROM user WHERE role != 'admin');

-- Delete API usage logs for non-admin users
DELETE FROM api_usage_log WHERE user_id IN (SELECT id FROM user WHERE role != 'admin');

-- Delete non-admin users (cascade will handle related data)
DELETE FROM user WHERE role != 'admin';
"

RESULT=$(wrangler d1 execute tuvix --remote --command "$SQL_QUERY" --json --yes 2>&1 | grep -v "WARNING\|ratelimits\|Processing wrangler.toml" || true)

# Check if deletion was successful
if echo "$RESULT" | grep -q '"success":\s*true'; then
  echo "✅ Successfully deleted non-admin users!"
  echo ""
  echo "Remaining users:"
  wrangler d1 execute tuvix --remote --command "SELECT id, name, email, role FROM user ORDER BY id;" --json --yes 2>&1 | grep -v "WARNING\|ratelimits\|Processing wrangler.toml" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
else
  echo "❌ Error deleting users:"
  echo "$RESULT"
  exit 1
fi

# Restore is handled by trap

