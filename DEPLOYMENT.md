# Deploying Clausify to Railway

This guide walks you through deploying Clausify to [Railway](https://railway.app).

## Prerequisites

1. A [Railway account](https://railway.app)
2. An [Anthropic API key](https://console.anthropic.com/) for AI analysis
3. (Optional) A [Stripe account](https://stripe.com) for payments

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/clausify)

Or follow the manual steps below.

---

## Step-by-Step Deployment

### 1. Create a New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the `clausify` repository

### 2. Add PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates `DATABASE_URL` for you

### 3. Add a Volume for File Storage

Since Railway has ephemeral storage, you need a volume for uploaded contracts:

1. Click on your web service
2. Go to **Settings** → **Volumes**
3. Click **"Add Volume"**
4. Set mount path: `/app/uploads`
5. This persists uploaded files across deployments

### 4. Configure Environment Variables

In your Railway service, go to **Variables** and add:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your Railway app URL | `https://clausify-production.up.railway.app` |
| `NEXTAUTH_SECRET` | Random 32+ char secret | Generate with: `openssl rand -base64 32` |
| `AI_PROVIDER` | Set to anthropic | `anthropic` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api...` |
| `STORAGE_PROVIDER` | Use local storage | `local` |
| `LOCAL_STORAGE_PATH` | Volume mount path | `/app/uploads` |

#### Optional Variables (for payments)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |

### 5. Deploy

Railway automatically deploys when you push to your main branch. You can also:

1. Click **"Deploy"** in the Railway dashboard
2. Or push changes: `git push origin main`

### 6. Run Database Migrations

After first deployment, run migrations:

1. Go to your service in Railway
2. Click **"Settings"** → **"Run Command"**
3. Run: `npx prisma db push`

Or use Railway CLI:
```bash
railway run npx prisma db push
```

---

## Environment Variables Reference

### Required for Production

```bash
# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=

# Authentication
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=your-32-character-secret

# AI
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# Storage
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=/app/uploads
```

### Optional

```bash
# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## Architecture on Railway

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Project                       │
│                                                          │
│  ┌──────────────────┐     ┌──────────────────┐          │
│  │   Web Service    │     │   PostgreSQL     │          │
│  │   (Next.js)      │────▶│   Database       │          │
│  │                  │     │                  │          │
│  │   + Volume:      │     └──────────────────┘          │
│  │   /app/uploads   │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼ (HTTPS API calls)
┌──────────────────────┐
│   Anthropic Claude   │
│   (External API)     │
└──────────────────────┘
```

---

## Stripe Webhook Setup (Optional)

If you're using Stripe for payments:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://your-app.up.railway.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook secret and add as `STRIPE_WEBHOOK_SECRET`

---

## Troubleshooting

### Build Fails

Check the build logs in Railway. Common issues:
- Missing environment variables
- TypeScript errors (run `npm run typecheck` locally)

### Database Connection Issues

- Ensure PostgreSQL is provisioned
- Check `DATABASE_URL` is set correctly
- Run `railway run npx prisma db push` to apply schema

### File Uploads Not Persisting

- Ensure you've added a volume
- Mount path should be `/app/uploads`
- Set `LOCAL_STORAGE_PATH=/app/uploads`

### AI Analysis Not Working

- Verify `ANTHROPIC_API_KEY` is set
- Check `AI_PROVIDER=anthropic`
- Check Anthropic API status: https://status.anthropic.com

---

## Costs Estimate

| Service | Approximate Cost |
|---------|-----------------|
| Railway Hobby Plan | $5/month base |
| PostgreSQL | ~$5-10/month |
| Compute (Next.js) | ~$5-20/month (usage based) |
| Volume Storage | ~$0.25/GB/month |
| **Total** | **~$15-40/month** |

Plus external services:
- Anthropic Claude: ~$0.003-0.015 per analysis
- Stripe: 2.9% + $0.30 per transaction

---

## Updating Your Deployment

Push to main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will automatically build and deploy.

---

## Local Development vs Production

| Feature | Local | Production (Railway) |
|---------|-------|---------------------|
| Database | Docker PostgreSQL | Railway PostgreSQL |
| AI | Ollama (free) | Anthropic Claude (paid) |
| Storage | ./uploads | Railway Volume |
| URL | localhost:3000 | your-app.up.railway.app |
