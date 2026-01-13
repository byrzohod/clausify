# /dev - Start Development Environment

Start the local development environment for Clausify.

## Quick Start

```bash
# Start database + dev server
docker compose up -d && sleep 2 && npm run dev
```

## Full Setup (First Time)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Wait for database
sleep 3

# 3. Apply schema
npx prisma db push

# 4. Start dev server
npm run dev
```

## Access Points

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Prisma Studio | `npx prisma studio` (port 5555) |
| Health Check | http://localhost:3000/api/health |

## Optional: Local AI (Ollama)

For free local AI instead of Anthropic:

```bash
# Start Ollama (separate terminal)
ollama serve

# Pull model (first time)
ollama pull llama3.2
```

Set in `.env.local`:
```
AI_PROVIDER=ollama
```

## Verify Services

```bash
# Check Docker
docker compose ps

# Check database
docker compose exec -T postgres pg_isready -U clausify

# Check dev server
curl -s http://localhost:3000/api/health | jq .
```
