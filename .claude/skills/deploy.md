# /deploy - Deploy to Railway

Deploy Clausify to Railway production.

## Pre-Deploy Checklist

```bash
# Run tests
npm test -- --run

# Build locally
npm run build
```

## Deploy

### Option 1: Push to Main (Auto-Deploy)
```bash
git push origin main
```

### Option 2: Manual Deploy
```bash
railway up
```

### Option 3: Redeploy Current
```bash
railway redeploy -y
```

## Verify Deployment

```bash
# View logs
railway logs

# Check health
curl -s https://your-app.railway.app/api/health | jq .
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection |
| NEXTAUTH_SECRET | `openssl rand -base64 32` |
| NEXTAUTH_URL | Production URL |
| AI_PROVIDER | `anthropic` |
| ANTHROPIC_API_KEY | Anthropic API key |
| STORAGE_PROVIDER | `local` |
| LOCAL_STORAGE_PATH | `/app/uploads` |

## Rollback

```bash
railway rollback
```
