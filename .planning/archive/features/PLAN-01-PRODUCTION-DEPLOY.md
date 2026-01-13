# Production Deployment Plan

> Feature: Production deployment to Railway/Vercel with custom domain
> Priority: HIGH
> Effort: Medium (1-2 days)
> Status: Planning

---

## Executive Summary

Deploy Clausify to production with a reliable, scalable infrastructure. This is the critical path to launching the product and getting real users.

---

## Business Value

| Metric | Impact |
|--------|--------|
| Time to Market | Enables all other growth activities |
| User Acquisition | Required for any real users |
| Revenue | Required for monetization |
| Credibility | Professional deployment builds trust |

---

## Current State Analysis

### What We Have
- Working local development environment
- Docker Compose for local PostgreSQL
- Ollama for local AI (development only)
- Railway CLI configured
- All features tested (467 tests passing)

### What We Need
- Production PostgreSQL database
- Production AI provider (Anthropic Claude)
- File storage solution
- SSL/TLS certificates
- Environment variable management
- Monitoring and logging
- CI/CD pipeline

---

## Technical Architecture

### Recommended Stack: Railway

```
┌─────────────────────────────────────────────────────────────┐
│                        RAILWAY                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │ PostgreSQL  │  │      Redis          │  │
│  │   Service   │  │   Service   │  │   (Rate Limiting)   │  │
│  │             │  │             │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┴─────────────────────┘             │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Volume Storage                        ││
│  │                   (Contract Files)                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   External Services    │
              │  - Anthropic Claude    │
              │  - Stripe              │
              │  - (Optional) Sentry   │
              └────────────────────────┘
```

### Alternative: Vercel + Supabase

```
┌──────────────────┐     ┌──────────────────┐
│      Vercel      │────▶│     Supabase     │
│  (Next.js App)   │     │  (DB + Storage)  │
└──────────────────┘     └──────────────────┘
```

**Recommendation:** Railway for simplicity - everything in one platform.

---

## Implementation Plan

### Phase 1: Railway Setup (2-3 hours)

#### Step 1.1: Create Railway Project
```bash
# Login and create project
railway login
railway init

# Or link to existing
railway link
```

#### Step 1.2: Add PostgreSQL Service
```bash
# Add PostgreSQL from Railway dashboard or CLI
railway add postgresql
```

#### Step 1.3: Add Redis Service
```bash
# Add Redis for rate limiting
railway add redis
```

#### Step 1.4: Configure Volume for File Storage
- Create volume in Railway dashboard
- Mount at `/app/uploads`
- Update `LOCAL_STORAGE_PATH` env var

### Phase 2: Environment Configuration (1 hour)

#### Required Environment Variables
```bash
# Database (auto-populated by Railway)
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://clausify.up.railway.app"

# AI Provider
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."

# Storage
STORAGE_PROVIDER="local"
LOCAL_STORAGE_PATH="/app/uploads"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe Price IDs (create in Stripe dashboard)
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_BUSINESS_MONTHLY="price_..."
STRIPE_PRICE_BUSINESS_YEARLY="price_..."

# Redis (auto-populated by Railway)
REDIS_URL="redis://..."

# Optional: Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Optional: Monitoring
SENTRY_DSN="https://..."
```

### Phase 3: Database Migration (30 minutes)

#### Step 3.1: Push Schema to Production
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Push schema
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

#### Step 3.2: Initialize Badge Data
```bash
# Run badge initialization script
npx tsx scripts/init-badges.ts
```

### Phase 4: Deploy Application (1 hour)

#### Step 4.1: Configure Build Settings
```toml
# railway.toml (already exists)
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### Step 4.2: Deploy
```bash
railway up
```

#### Step 4.3: Verify Deployment
```bash
# Check health endpoint
curl https://clausify.up.railway.app/api/health

# Check logs
railway logs
```

### Phase 5: Stripe Webhook Configuration (30 minutes)

#### Step 5.1: Update Stripe Dashboard
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://clausify.up.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret

#### Step 5.2: Update Environment Variable
```bash
railway variables --set "STRIPE_WEBHOOK_SECRET=whsec_..."
```

### Phase 6: Monitoring Setup (1 hour)

#### Step 6.1: Railway Metrics
- Enable in Railway dashboard
- Set up alerts for:
  - High CPU usage (>80%)
  - High memory usage (>80%)
  - Error rate spike
  - Response time > 5s

#### Step 6.2: Sentry Integration (Optional)
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
```

#### Step 6.3: Health Checks
- Railway auto-pings `/api/health`
- Set up external monitoring (UptimeRobot, Pingdom)

---

## Testing Strategy

### Pre-Deployment Checklist

- [ ] All 467 tests pass locally
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript passes: `npm run typecheck`
- [ ] ESLint passes: `npm run lint`

### Post-Deployment Testing

#### Smoke Tests (Manual)
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] File upload works
- [ ] Analysis completes
- [ ] Results display correctly
- [ ] Stripe checkout works (test mode first)
- [ ] Webhook receives events

#### Load Testing
```bash
# Use k6 or similar
k6 run load-test.js
```

#### Security Testing
- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] Rate limiting works
- [ ] Auth required on protected routes

---

## Rollback Plan

### If Deployment Fails
```bash
# Rollback to previous deployment
railway rollback

# Or redeploy specific commit
railway up --commit <sha>
```

### Database Rollback
```bash
# If schema changes break things
npx prisma migrate rollback
```

---

## Cost Estimate

### Railway (Recommended)
| Service | Monthly Cost |
|---------|-------------|
| Next.js (Hobby) | $5 |
| PostgreSQL | $5 |
| Redis | $5 |
| Volume (10GB) | $2 |
| **Total** | **~$17/month** |

### Scaling Costs
| Traffic | Estimated Cost |
|---------|---------------|
| 1,000 users | $17/month |
| 10,000 users | $50-100/month |
| 100,000 users | $200-500/month |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Response Time (p95) | < 2s |
| Error Rate | < 0.1% |
| Deploy Time | < 5 minutes |
| Rollback Time | < 1 minute |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database connection issues | Medium | High | Connection pooling, retry logic |
| Stripe webhook failures | Low | High | Webhook retry, idempotency |
| File storage full | Low | Medium | Monitoring, cleanup job |
| Rate limit bypass | Low | Medium | Redis-based limiting |
| SSL certificate expiry | Low | High | Auto-renewal (Railway handles) |

---

## Dependencies

- [ ] Anthropic API key (production)
- [ ] Stripe account (live mode)
- [ ] Domain name (for custom domain)
- [ ] Google OAuth credentials (optional)

---

## Next Steps After Deployment

1. Set up custom domain (see PLAN-02-CUSTOM-DOMAIN.md)
2. Configure email notifications (see PLAN-03-EMAIL-NOTIFICATIONS.md)
3. Monitor for first week
4. Soft launch to beta users
5. Gather feedback and iterate

---

## Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs

# Set variables
railway variables --set "KEY=value"

# Open dashboard
railway open

# Check status
railway status

# Redeploy
railway redeploy -y
```
