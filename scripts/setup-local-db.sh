#!/usr/bin/env bash
set -euo pipefail

# Create a .env with a SQLite DATABASE_URL and a generated SESSION_SECRET
ENV_FILE=.env
DB_FILE=database.sqlite

if [ -f "$ENV_FILE" ]; then
  echo "$ENV_FILE already exists. Skipping creation." 
  exit 0
fi

# Create sqlite file (empty file is fine; SQLite will initialize it)
if [ ! -f "$DB_FILE" ]; then
  touch "$DB_FILE"
  echo "Created $DB_FILE"
fi

# Generate a random session secret
SESSION_SECRET=$(openssl rand -base64 32 || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

cat > "$ENV_FILE" <<EOF
DATABASE_URL="file:./${DB_FILE}"
SESSION_SECRET="${SESSION_SECRET}"
PORT=5000
EOF

echo "Wrote $ENV_FILE"
echo "You can now run: npm run dev"
