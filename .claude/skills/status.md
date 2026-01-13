# /status - Check Service Status

Check the status of all Clausify services.

## Quick Status

```bash
echo "=== Docker ===" && docker compose ps
echo ""
echo "=== Database ===" && docker compose exec -T postgres pg_isready -U clausify 2>/dev/null && echo "OK" || echo "NOT RUNNING"
echo ""
echo "=== Dev Server ===" && curl -s http://localhost:3000/api/health 2>/dev/null | jq -r '.status // "NOT RUNNING"' || echo "NOT RUNNING"
```

## Individual Checks

### Docker Services
```bash
docker compose ps
```

### Database Connection
```bash
docker compose exec -T postgres pg_isready -U clausify
```

### Dev Server Health
```bash
curl -s http://localhost:3000/api/health | jq .
```

### Ollama (Local AI)
```bash
curl -s http://localhost:11434/api/tags 2>/dev/null && echo "Ollama running" || echo "Ollama not running"
```

## Production Status

```bash
railway status
railway logs --tail 10
```

## Expected Health Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T...",
  "database": "connected"
}
```
