# Clausify Service Status

Check the status of all Clausify services.

## Local Development

### Check Docker Services
```bash
docker compose ps
```

### Check Database Connection
```bash
docker compose exec -T postgres pg_isready -U clausify
```

### Check Ollama (if using local AI)
```bash
curl -s http://localhost:11434/api/tags | head -c 100 || echo "Ollama not running"
```

### Check Dev Server
```bash
curl -s http://localhost:3000/api/health | jq . || echo "Dev server not running"
```

## Production (Railway)

### Check Railway Status
```bash
railway status
```

### Check Production Health
```bash
# Replace with your production URL
curl -s https://your-app.railway.app/api/health | jq .
```

### View Services
```bash
railway service list
```

## Quick Status Summary

Run this to get a quick overview:

```bash
echo "=== Docker Services ===" && docker compose ps
echo ""
echo "=== Database ===" && docker compose exec -T postgres pg_isready -U clausify 2>/dev/null && echo "PostgreSQL: Running" || echo "PostgreSQL: Not running"
echo ""
echo "=== Dev Server ===" && curl -s http://localhost:3000/api/health 2>/dev/null | jq -r .status || echo "Dev server: Not running"
```

## Health Check Response

The /api/health endpoint returns:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T...",
  "database": "connected"
}
```
