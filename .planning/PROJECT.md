# Clausify

## What This Is

A B2C SaaS application that uses AI to analyze legal contracts and explain them in plain English. Users upload contracts (PDF/DOCX), and the system returns comprehensive analysis including summaries, key terms, obligations, red flags, and risk assessments.

## Core Value

Democratize contract understanding — anyone can quickly grasp what they're agreeing to before signing, without expensive lawyers.

## Requirements

### Validated

<!-- Shipped and confirmed working in existing codebase. -->

- ✓ Contract upload (PDF/DOCX) with document parsing — existing
- ✓ AI-powered contract analysis via Claude API — existing
- ✓ User authentication (email/password + Google OAuth) — existing
- ✓ User dashboard with contract list — existing
- ✓ Analysis results display (summary, key terms, obligations, red flags) — existing
- ✓ Stripe payment integration with subscription tiers — existing
- ✓ Security middleware (rate limiting, headers) — existing
- ✓ Railway deployment configuration — existing

### Active

<!-- Current scope. Building toward these. -->

(To be defined in next milestone)

### Out of Scope

<!-- Explicit boundaries. -->

(To be defined based on milestone discussion)

## Context

**Existing Codebase:**
- Next.js 14 (App Router) with TypeScript
- PostgreSQL via Prisma ORM
- Claude API (claude-sonnet-4-20250514) for analysis
- Stripe with 4 plan tiers: PAY_PER_USE, PRO_MONTHLY, PRO_ANNUAL, TEAM
- NextAuth.js with JWT strategy (24-hour sessions)
- Local file storage with Supabase Storage as alternative

**Known Issues (from codebase analysis):**
- 47 debug console.log statements in auth callbacks (security risk)
- In-memory rate limiting won't scale with multiple instances
- ~50% API endpoints lack test coverage
- Silent Stripe webhook failures (early returns without logging)
- No health check endpoint for container orchestration
- allowDangerousEmailAccountLinking enabled

**Test Coverage:**
- Vitest for unit/integration tests
- Playwright for E2E tests
- Current gaps: Stripe webhooks, many API routes untested

## Constraints

- **AI Provider**: Anthropic Claude API (with Ollama fallback for local dev)
- **Deployment**: Railway with PostgreSQL and volume storage
- **Auth**: NextAuth.js with existing user base

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude over GPT-4 | Better reasoning for contract analysis, longer context | ✓ Good |
| Next.js App Router | Server components, better DX | ✓ Good |
| Freemium model | Let users try before buying | — Pending |
| In-memory rate limiting | Simple MVP implementation | ⚠️ Revisit |

---
*Last updated: 2026-01-11 after initialization from existing codebase*
