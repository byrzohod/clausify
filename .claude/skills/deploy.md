# Clausify Deployment

Deploy Clausify to Railway production.

## Prerequisites

1. Railway CLI installed and logged in
2. Project linked to Railway

## Check Railway Status

```bash
railway status
```

## Deploy Steps

### 1. Run Tests First
```bash
npm test -- --run
```

### 2. Build Locally (Optional Verification)
```bash
npm run build
```

### 3. Deploy to Railway

The app auto-deploys when you push to main. For manual deployment:

```bash
railway up
```

Or trigger a redeploy:

```bash
railway redeploy -y
```

## Environment Variables

Make sure these are set on Railway:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Auth secret key |
| `NEXTAUTH_URL` | Yes | Production URL |
| `AI_PROVIDER` | Yes | `anthropic` |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `STORAGE_PROVIDER` | Yes | `local` |
| `LOCAL_STORAGE_PATH` | Yes | `/app/uploads` |
| `REDIS_URL` | Optional | For rate limiting |

## Check Deploy Status

```bash
railway logs
```

## Rollback

If needed, rollback to previous deployment:

```bash
railway rollback
```
