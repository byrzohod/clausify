# Clausify - Development Roadmap

> Phased development plan with milestones and deliverables.

---

## Overview

```
Phase 1: MVP Build        [####################]  COMPLETE
Phase 2: Launch & Learn   [░░░░░░░░░░░░░░░░░░░░]  Pending
Phase 3: Monetization     [####################]  COMPLETE (Stripe integrated)
Phase 4: Growth Features  [####################]  COMPLETE (v1.1)
Phase 5: Test Coverage    [░░░░░░░░░░░░░░░░░░░░]  In Progress
```

---

## v1.1 - Comparison + Stability

**Goal:** Contract comparison feature + production stability fixes
**Status:** COMPLETE (2026-01-11)

### Phase Summary

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| 1 | Foundation Fixes | Done | 2026-01-11 |
| 2 | Redis Rate Limiting | Done | 2026-01-11 |
| 3 | Comparison UI | Done | 2026-01-11 |
| 4 | Diff Engine | Done | 2026-01-11 |
| 5 | Template Matching | Done | 2026-01-11 |
| 6 | Comparative Analysis | Done | 2026-01-11 |
| 7 | Webhook Reliability | Done | 2026-01-11 |

### Features Delivered
- Debug logging cleanup (47 console.logs removed)
- Health endpoint for monitoring
- Redis rate limiting for multi-instance scaling
- Dual file upload for contract comparison
- Side-by-side contract view
- Text diff engine with highlighting
- Template matching (save/compare)
- AI comparative analysis
- Comprehensive webhook logging

**See:** `.planning/ROADMAP.md` for detailed phase information

---

## Phase 1: MVP Build

**Goal:** Working product that can analyze contracts and show results.
**Status:** COMPLETE

### Sprint 1.1: Foundation (Days 1-3)

| Task | Feature | Status | Notes |
|------|---------|--------|-------|
| Project setup | - | `DONE` | Next.js 14, TypeScript, Tailwind |
| Supabase setup | - | `DONE` | DB schema, Storage config |
| Basic layout | - | `DONE` | Header, footer, navigation |
| File upload UI | F-001 | `DONE` | react-dropzone component |
| Upload API | F-001 | `DONE` | Store in Supabase Storage |
| PDF parsing | F-002 | `DONE` | pdf-parse integration |
| DOCX parsing | F-002 | `DONE` | mammoth.js integration |

**Milestone:** Can upload a contract and extract text.

### Sprint 1.2: AI Integration (Days 4-6)

| Task | Feature | Status | Notes |
|------|---------|--------|-------|
| Claude API setup | F-003 | `DONE` | Anthropic SDK configured |
| Analysis prompt | F-003 | `DONE` | Comprehensive prompt engineering |
| Response parsing | F-003 | `DONE` | JSON validation & normalization |
| Store results | F-003 | `DONE` | Prisma Analysis model |
| Processing status | F-003 | `DONE` | PENDING > PROCESSING > COMPLETED |
| Error handling | F-003 | `DONE` | AIError class, retries |

**Milestone:** Contract uploaded > AI analysis stored in DB.

### Sprint 1.3: Results & Auth (Days 7-10)

| Task | Feature | Status | Notes |
|------|---------|--------|-------|
| Results page UI | F-004 | `DONE` | All analysis sections |
| Risk score badge | F-004 | `DONE` | Color-coded RiskBadge component |
| Red flags section | F-004 | `DONE` | RedFlagsCard component |
| Section breakdown | F-004 | `DONE` | SectionsCard with accordion |
| Auth setup | F-005 | `DONE` | NextAuth with credentials |
| Sign up flow | F-005 | `DONE` | Email/password registration |
| Login flow | F-005 | `DONE` | JWT session handling |
| Protected routes | F-005 | `DONE` | getSession checks |

**Milestone:** Full flow works - upload, analyze, view results (authenticated).

### Sprint 1.4: Dashboard & Polish (Days 11-14)

| Task | Feature | Status | Notes |
|------|---------|--------|-------|
| User dashboard | F-006 | `DONE` | Contract list with upload |
| Analysis cards | F-006 | `DONE` | ContractCard component |
| Delete analysis | F-006 | `DONE` | DELETE /api/contracts/[id] |
| Usage tracking | F-007 | `DONE` | analysisCount on User |
| Free tier limit | F-007 | `DONE` | canUserAnalyze() check |
| Landing page | F-008 | `DONE` | Full marketing page |
| Responsive design | - | `DONE` | Tailwind responsive classes |
| Error boundaries | - | `DONE` | Error handling throughout |

**Milestone:** MVP complete, ready for soft launch.

---

## Phase 2: Launch & Learn

**Goal:** Get real users, gather feedback, fix critical issues.
**Status:** Pending (requires deployment)

### Sprint 2.1: Launch Prep

| Task | Status | Notes |
|------|--------|-------|
| Demo mode | `DONE` | /demo page with IP rate limiting |
| SEO basics | `DONE` | Meta tags in layout.tsx |
| Analytics setup | `DONE` | @vercel/analytics integrated |
| Error tracking | `DONE` | @sentry/nextjs configured |
| Legal pages | `DONE` | /terms and /privacy pages |
| Production deploy | `TODO` | Custom domain |

---

## Phase 3: Monetization

**Goal:** Implement payments, start generating revenue.
**Status:** COMPLETE (Stripe integration done)

### Sprint 3.1: Stripe Integration

| Task | Feature | Status | Notes |
|------|---------|--------|-------|
| Stripe account | F-011 | `DONE` | Client configured |
| Products/prices | F-011 | `DONE` | 4 tiers defined |
| Checkout flow | F-011 | `DONE` | /api/billing/checkout |
| Webhook handler | F-011 | `DONE` | /api/webhooks/stripe |
| Subscription logic | F-011 | `DONE` | Plan updates on payment |
| Customer portal | F-011 | `DONE` | /api/billing/portal |

---

## Phase 4: Growth Features

**Goal:** Add features that increase retention and expand market.
**Status:** COMPLETE (v1.1)

| Feature | Priority | Effort | Impact | Status |
|---------|----------|--------|--------|--------|
| PDF export | High | Low | Medium | `DONE` |
| Google OAuth | High | Low | Medium | `DONE` |
| Contract comparison | Medium | High | High | `DONE` (v1.1) |
| Template matching | Medium | Medium | High | `DONE` (v1.1) |
| Redis rate limiting | High | Medium | High | `DONE` (v1.1) |
| Email notifications | Medium | Low | Low | `TODO` |
| OCR for scanned docs | Medium | Medium | Medium | `TODO` |
| Browser extension | Low | High | High | `TODO` |
| API access | Low | Medium | Medium | `TODO` |
| Team workspaces | Low | High | High | `TODO` |

---

## Phase 5: Test Coverage

**Goal:** Comprehensive test coverage for reliability and maintainability.
**Status:** In Progress

See: `.planning/TEST-PLAN.md` for detailed plan

| Task | Priority | Status |
|------|----------|--------|
| Critical unit tests (API routes) | P1 | In Progress |
| Component tests | P2 | Pending |
| Integration tests | P2 | Pending |
| E2E user journeys | P2 | Pending |
| Target: 300+ tests, 80%+ coverage | - | Pending |

---

## Milestones Summary

| Milestone | Target | Success Criteria | Status |
|-----------|--------|------------------|--------|
| M1: MVP Complete | End of Week 2 | Working upload > analyze > results flow | DONE |
| M2: v1.1 Complete | End of Week 4 | Contract comparison, stability fixes | DONE |
| M3: Soft Launch | TBD | 50+ signups, feedback collected | Pending |
| M4: Product Hunt | TBD | Top 10 of the day, 500+ signups | Pending |
| M5: First Revenue | TBD | $100+ MRR | Pending |
| M6: Test Coverage | TBD | 300+ tests, 80%+ coverage | In Progress |

---

## Dependencies & Blockers

| Dependency | Needed For | Status | Notes |
|------------|------------|--------|-------|
| Supabase account | All | `READY` | Config created |
| Claude API key | F-003 | `READY` | Client configured |
| Stripe account | F-011 | `READY` | Integration complete |
| Redis (Railway) | F-018 | `READY` | Rate limiting works |
| Domain name | Launch | `TODO` | clausify.com / .ai / .app |
| Vercel account | Deploy | `TODO` | Free tier to start |

---

## Out of Scope (For Now)

These are explicitly NOT planned for the foreseeable future:

- Mobile native apps
- Enterprise SSO
- On-premise deployment
- Multi-language support
- AI model fine-tuning
- Blockchain anything
