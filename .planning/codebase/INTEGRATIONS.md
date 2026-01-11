# External Integrations

**Analysis Date:** 2026-01-11

## APIs & External Services

**AI/Contract Analysis:**
- Anthropic Claude API - Primary AI for contract analysis
  - SDK/Client: @anthropic-ai/sdk 0.32.1 - `src/lib/ai/client.ts`
  - Model: claude-sonnet-4-20250514 - `src/lib/ai/client.ts`
  - Auth: API key in ANTHROPIC_API_KEY env var
  - Max tokens: 8192 per request

- Ollama (alternative) - Local AI for development
  - Integration: HTTP API via fetch - `src/lib/ai/providers/ollama.ts`
  - Default endpoint: http://localhost:11434
  - Model: llama3.2 (configurable via OLLAMA_MODEL)
  - Auth: None (local only)

**Payment Processing:**
- Stripe - Subscription billing and one-time payments
  - SDK/Client: stripe 17.4.0 - `src/lib/stripe/index.ts`
  - Client SDK: @stripe/stripe-js 8.6.1 - `package.json`
  - API Version: 2025-02-24.acacia
  - Auth: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - Plans: PAY_PER_USE, PRO_MONTHLY, PRO_ANNUAL, TEAM

**Analytics:**
- Vercel Analytics - Web vitals tracking
  - Package: @vercel/analytics 1.6.1 - `package.json`
  - Integration: `<Analytics />` in `src/app/layout.tsx`
  - Auth: Automatic via Vercel deployment

**Error Tracking (Optional):**
- Sentry - Error monitoring
  - Package: @sentry/nextjs 10.32.1 - `package.json`
  - Status: Installed but not configured in code
  - Auth: NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN

## Data Storage

**Databases:**
- PostgreSQL 16 - Primary data store
  - Container: postgres:16-alpine - `docker-compose.yml`
  - Connection: DATABASE_URL env var
  - Client: Prisma 5.22.0 - `src/lib/prisma.ts`
  - Migrations: `prisma/migrations/`

**File Storage:**
- Local filesystem (default) - Development and simple deployments
  - Implementation: `src/lib/storage/local.ts`
  - Path: LOCAL_STORAGE_PATH env var or `./uploads`

- Supabase Storage (optional) - Cloud file storage
  - SDK: @supabase/supabase-js 2.47.10 - `src/lib/supabase/storage.ts`
  - Auth: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Features: Signed URLs, bucket organization

**Caching:**
- None currently - All database queries direct
- Rate limit store: In-memory Map - `src/middleware.ts`

## Authentication & Identity

**Auth Provider:**
- NextAuth.js 4.24.10 - Session management
  - Configuration: `src/lib/auth/options.ts`
  - Adapter: @auth/prisma-adapter 2.7.4
  - Strategy: JWT (24-hour max age)
  - Token storage: httpOnly cookies

**OAuth Integrations:**
- Google OAuth 2.0 - Social sign-in
  - Credentials: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - Scopes: email, profile
  - Features: Consent prompt, account linking

**Password Authentication:**
- Credentials Provider - Email/password login
  - Hashing: bcryptjs (12 salt rounds) - `src/lib/auth/index.ts`
  - Validation: Zod schemas - `src/app/api/auth/signup/route.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry (optional) - Not currently configured
  - DSN: NEXT_PUBLIC_SENTRY_DSN env var
  - Release tracking: SENTRY_AUTH_TOKEN

**Analytics:**
- Vercel Analytics - Automatic web vitals - `src/app/layout.tsx`

**Logs:**
- Console logging - stdout only
  - Pattern: console.error for errors, console.log for debug
  - Production: Railway log aggregation

## CI/CD & Deployment

**Hosting:**
- Railway - Primary deployment target
  - Config: `railway.toml`, `nixpacks.toml`
  - Build: Nixpacks with Node 20
  - Deployment: Automatic on git push (configurable)

**CI Pipeline:**
- Not currently configured in repository
  - Manual testing via npm scripts
  - Planned: GitHub Actions for test/lint/deploy

## Environment Configuration

**Development:**
- Required env vars: DATABASE_URL, NEXTAUTH_SECRET
- Optional: ANTHROPIC_API_KEY (or use Ollama), STRIPE_* (for payments)
- Secrets location: `.env.local` (gitignored)
- Mock services: Local PostgreSQL via Docker, Ollama for AI

**Production:**
- Required: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY
- Payments: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- Secrets management: Railway environment variables

## Webhooks & Callbacks

**Incoming:**
- Stripe Webhooks - `/api/webhooks/stripe`
  - Verification: stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET
  - Events handled:
    - `checkout.session.completed` - Process checkout
    - `customer.subscription.updated` - Update subscription end date
    - `customer.subscription.deleted` - Revert to free plan
    - `invoice.payment_succeeded` - Reset monthly usage
    - `invoice.payment_failed` - Log failure

**Outgoing:**
- None currently configured

---

*Integration audit: 2026-01-11*
*Update when adding/removing external services*
