# Clausify Development Environment

Start the full local development environment for Clausify.

## What This Does

1. Starts PostgreSQL via Docker
2. Verifies database connection
3. Optionally starts Ollama for local AI
4. Starts the Next.js development server

## Steps

1. Check if Docker is running:
```bash
docker info > /dev/null 2>&1 || echo "Docker is not running"
```

2. Start PostgreSQL:
```bash
docker compose up -d
```

3. Wait for database to be ready:
```bash
sleep 3
docker compose exec -T postgres pg_isready -U clausify
```

4. Push database schema if needed:
```bash
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

## Optional: Start Ollama

If the user wants to use local AI instead of Anthropic:

```bash
# Start Ollama in background
ollama serve &

# Pull model if needed
ollama pull llama3.2
```

## Access

- App: http://localhost:3000
- Prisma Studio: `npx prisma studio` (opens on port 5555)
