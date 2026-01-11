# /status - Check Development Environment Status

Check the status of all development services.

## Commands to Execute

```bash
echo "=== Clausify Development Status ==="
echo ""

# Check PostgreSQL
echo "📦 PostgreSQL:"
docker compose ps postgres 2>/dev/null | grep -q "running" && echo "   ✓ Running on localhost:5432" || echo "   ✗ Not running (start with: docker compose up -d)"

# Check Ollama
echo ""
echo "🤖 Ollama AI:"
curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "   ✓ Running on localhost:11434" || echo "   ✗ Not running (start with: ollama serve)"

# Check available models
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   Models: $(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | tr '\n' ', ' | sed 's/,$//')"
fi

# Check Next.js dev server
echo ""
echo "🚀 Next.js:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200" && echo "   ✓ Running on localhost:3000" || echo "   ✗ Not running (start with: npm run dev)"

echo ""
echo "=== Environment ==="
echo "AI Provider: ${AI_PROVIDER:-auto}"
echo "Storage: ${STORAGE_PROVIDER:-local}"
```

## Quick Health Check

```bash
# One-liner to check all services
docker compose ps && curl -s http://localhost:11434/api/tags && curl -s http://localhost:3000 > /dev/null && echo "All services running!"
```
