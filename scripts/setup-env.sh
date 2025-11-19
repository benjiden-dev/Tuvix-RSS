#!/bin/bash

# TuvixRSS Setup Script
# Creates necessary environment files for local development

set -e

echo "🚀 TuvixRSS Setup Script"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env creation"
        exit 0
    fi
fi

# Generate a random Better Auth secret
BETTER_AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "PLEASE-CHANGE-THIS-TO-A-SECURE-RANDOM-STRING")

# Create .env file
cat > .env << EOF
# TuvixRSS Environment Configuration
# Generated on $(date)

# ======================
# Security
# ======================
# Better Auth Secret - MUST be changed in production!
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

# ======================
# API Configuration
# ======================
# Port for the API server
PORT=3001

# Node environment
NODE_ENV=development

# ======================
# Database
# ======================
# Path to SQLite database (for local/Docker deployment)
DATABASE_PATH=./data/tuvix.db

# ======================
# CORS Configuration
# ======================
# Allowed origins for CORS
CORS_ORIGIN=http://localhost:5173

# ======================
# Frontend Configuration
# ======================
# API URL for frontend to connect to
VITE_API_URL=http://localhost:3001/trpc
EOF

echo -e "${GREEN}✅ Created .env file${NC}"
echo ""
echo "📝 Environment file created with a random BETTER_AUTH_SECRET"
echo "🔒 Make sure to keep this secret secure and don't commit it to git"
echo ""
echo "Next steps:"
echo "  1. Review and customize .env if needed"
echo "  2. Run: pnpm db:migrate"
echo "  3. Run: pnpm dev"


