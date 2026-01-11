#!/bin/bash

# Clausify Local Development Setup Script
# ========================================

set -e

echo "🚀 Setting up Clausify for local development..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Docker
echo "📦 Checking dependencies..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop first.${NC}"
    echo "   Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check for Ollama (optional)
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama found${NC}"
    OLLAMA_INSTALLED=true
else
    echo -e "${YELLOW}⚠ Ollama not found (optional - for local AI)${NC}"
    echo "   Install: https://ollama.ai/download"
    OLLAMA_INSTALLED=false
fi

echo ""
echo "🐳 Starting PostgreSQL database..."
docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3
until docker compose exec -T postgres pg_isready -U clausify -d clausify > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Run Prisma migrations
echo ""
echo "📊 Setting up database schema..."
npx prisma db push
echo -e "${GREEN}✓ Database schema applied${NC}"

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Create uploads directory
echo ""
echo "📁 Creating local storage directory..."
mkdir -p uploads
echo -e "${GREEN}✓ Uploads directory created${NC}"

# Pull Ollama model if Ollama is installed
if [ "$OLLAMA_INSTALLED" = true ]; then
    echo ""
    echo "🤖 Checking Ollama models..."
    if ollama list | grep -q "llama3.2"; then
        echo -e "${GREEN}✓ llama3.2 model already available${NC}"
    else
        echo "📥 Pulling llama3.2 model (this may take a few minutes)..."
        ollama pull llama3.2
        echo -e "${GREEN}✓ llama3.2 model ready${NC}"
    fi
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "=========================================="
echo ""
echo "To start developing:"
echo ""
echo "  1. Start Ollama (if using local AI):"
echo "     ollama serve"
echo ""
echo "  2. Start the development server:"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:3000"
echo ""
echo "Database: PostgreSQL running on localhost:5432"
echo "Storage: Local file system (./uploads)"
echo "AI: Ollama (local) or Anthropic (if API key set)"
echo ""
