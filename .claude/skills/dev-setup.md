# /dev-setup - Start Local Development Environment

Start the full local development environment for Clausify.

## Steps

1. Start PostgreSQL database with Docker
2. Ensure database schema is applied
3. Start the Next.js development server
4. Verify Ollama is running for AI

## Commands to Execute

```bash
# Start PostgreSQL
docker compose up -d

# Wait for database to be ready
sleep 3

# Apply database schema
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify" npx prisma db push

# Check if Ollama is running
curl -s http://localhost:11434/api/tags > /dev/null && echo "✓ Ollama is running" || echo "⚠ Start Ollama with: ollama serve"

# Start dev server
npm run dev
```

## After Completion

The app will be available at http://localhost:3000

To test AI functionality, ensure Ollama is running:
- `ollama serve` (in a separate terminal)
- `ollama pull llama3.2` (if model not downloaded)
