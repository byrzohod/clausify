# Clausify - Project Context for Claude

> This document provides all necessary context for AI-assisted development of the Clausify project.

---

## Project Intent

### What We're Building

**Clausify** is a B2C SaaS application that uses AI to analyze legal contracts and explain them in plain English. Users upload contracts (PDF/DOCX), and the system returns a comprehensive analysis including summaries, key terms, obligations, red flags, and risk assessments.

### Why We're Building It

1. **Problem:** People sign contracts they don't understand. Legal documents are intentionally complex, and lawyers are expensive ($200-500/hour).

2. **Solution:** Democratize access to contract understanding. Make it possible for anyone to quickly grasp what they're agreeing to before signing.

3. **Business Model:** Freemium SaaS with subscription tiers. Free users get 2 analyses, paid users get more.

### Success Criteria

- Users can upload a contract and receive accurate, helpful analysis
- Analysis is trustworthy enough that users feel confident making decisions
- Product generates recurring revenue through subscriptions
- System is reliable, fast, and secure

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │  Landing    │  │   Auth      │  │  Dashboard  │  │   Analysis    │   │
│  │  Page       │  │   Pages     │  │   Page      │  │   Results     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘   │
│                         Next.js App Router + React                       │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │  /api/      │  │  /api/      │  │  /api/      │  │  /api/        │   │
│  │  auth/*     │  │  contracts/*│  │  analyze/*  │  │  billing/*    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘   │
│                         Next.js API Routes                               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│      DATA LAYER         │ │    AI LAYER     │ │    PAYMENTS LAYER       │
│  ┌─────────────────┐    │ │  ┌───────────┐  │ │  ┌─────────────────┐    │
│  │   PostgreSQL    │    │ │  │  Ollama   │  │ │  │     Stripe      │    │
│  │ (Docker/Supabase)│   │ │  │  (local)  │  │ │  │     API         │    │
│  └─────────────────┘    │ │  └───────────┘  │ │  └─────────────────┘    │
│  ┌─────────────────┐    │ │       OR        │ │                         │
│  │  File Storage   │    │ │  ┌───────────┐  │ │                         │
│  │ (Local/Supabase)│    │ │  │  Claude   │  │ │                         │
│  └─────────────────┘    │ │  │  (cloud)  │  │ │                         │
│                         │ │  └───────────┘  │ │                         │
└─────────────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### Data Flow

```
1. UPLOAD FLOW
   User → Upload Component → /api/contracts/upload → Supabase Storage
                                                   → Create DB record (status: pending)

2. ANALYSIS FLOW
   Trigger → /api/analyze/[id] → Fetch file from Storage
                               → Parse document (pdf-parse / mammoth)
                               → Send to Claude API
                               → Parse response
                               → Store in DB (status: completed)

3. RETRIEVAL FLOW
   User → Dashboard → /api/contracts → List from DB
   User → Results Page → /api/contracts/[id] → Fetch analysis from DB

4. PAYMENT FLOW
   User → Pricing Page → /api/billing/checkout → Stripe Checkout
   Stripe → /api/webhooks/stripe → Update user plan in DB
```

### Directory Structure (Planned)

```
clausify/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/          # Protected route group
│   │   │   ├── dashboard/
│   │   │   ├── contracts/
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   ├── (marketing)/          # Public pages
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── pricing/
│   │   │   └── demo/
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   ├── contracts/
│   │   │   ├── analyze/
│   │   │   ├── billing/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── forms/                # Form components
│   │   ├── analysis/             # Analysis display components
│   │   ├── layout/               # Layout components
│   │   └── common/               # Shared components
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── supabase/             # Supabase client & helpers
│   │   ├── ai/                   # Claude API integration
│   │   ├── parsers/              # Document parsing
│   │   ├── stripe/               # Stripe integration
│   │   ├── auth/                 # Auth utilities
│   │   └── utils/                # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   ├── constants/                # App constants
│   └── config/                   # Configuration
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # DB migrations
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── public/                       # Static assets
├── plans/                        # Planning documents
├── PLANNING.md                   # Main planning doc
├── CLAUDE.md                     # This file
└── package.json
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Pre-built accessible components |
| Database | PostgreSQL (Supabase) | Primary data store |
| ORM | Prisma | Database access |
| File Storage | Supabase Storage | Contract file storage |
| Authentication | NextAuth.js or Clerk | User authentication |
| AI | Claude API (Sonnet) | Contract analysis |
| Payments | Stripe | Subscriptions & payments |
| Hosting | Vercel | Deployment & hosting |
| PDF Parsing | pdf-parse | Extract text from PDFs |
| DOCX Parsing | mammoth.js | Extract text from DOCX |
| Validation | Zod | Schema validation |
| State | Zustand | Client state management |
| Forms | React Hook Form | Form handling |

---

## Testing Requirements

### Testing Philosophy

**All code must be tested.** We follow a testing pyramid approach with comprehensive coverage at each level. Tests are not optional - they are a core part of the development process.

### Test Types Required

#### 1. Unit Tests

**Tool:** Vitest
**Location:** `tests/unit/` and co-located `*.test.ts` files
**Coverage Target:** 80%+

Unit tests cover:
- Individual functions and utilities
- React components (isolated)
- Custom hooks
- Validation schemas
- Data transformers
- Business logic

```typescript
// Example: tests/unit/lib/parsers/pdf.test.ts
describe('PDF Parser', () => {
  it('extracts text from valid PDF', async () => {
    const result = await parsePdf(samplePdfBuffer);
    expect(result.text).toContain('Agreement');
  });

  it('throws ParseError for invalid PDF', async () => {
    await expect(parsePdf(invalidBuffer)).rejects.toThrow(ParseError);
  });

  it('handles empty PDF gracefully', async () => {
    const result = await parsePdf(emptyPdfBuffer);
    expect(result.text).toBe('');
  });
});
```

**What to Unit Test:**
- [ ] All utility functions in `lib/utils/`
- [ ] Document parsers (`lib/parsers/`)
- [ ] AI response parsing and validation
- [ ] Zod schemas
- [ ] Custom hooks
- [ ] Component rendering (snapshots where appropriate)
- [ ] State management logic
- [ ] Price calculations
- [ ] Date/time formatting
- [ ] Error handling utilities

#### 2. Integration Tests

**Tool:** Vitest + Testing Library
**Location:** `tests/integration/`
**Coverage Target:** Key user flows

Integration tests cover:
- API routes (request → response)
- Database operations
- External service integrations (mocked)
- Component interactions
- Form submissions

```typescript
// Example: tests/integration/api/contracts.test.ts
describe('POST /api/contracts/upload', () => {
  it('uploads file and creates contract record', async () => {
    const formData = new FormData();
    formData.append('file', testPdfFile);

    const response = await fetch('/api/contracts/upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.contractId).toBeDefined();
    expect(data.status).toBe('pending');

    // Verify DB record
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId }
    });
    expect(contract).not.toBeNull();
  });

  it('rejects unauthorized requests', async () => {
    const response = await fetch('/api/contracts/upload', {
      method: 'POST',
      body: formData
    });
    expect(response.status).toBe(401);
  });

  it('rejects invalid file types', async () => {
    const formData = new FormData();
    formData.append('file', invalidFile);

    const response = await fetch('/api/contracts/upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${testToken}` }
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'Invalid file type'
    });
  });
});
```

**What to Integration Test:**
- [ ] All API endpoints
- [ ] Authentication flows
- [ ] File upload pipeline
- [ ] Database CRUD operations
- [ ] Stripe webhook handling (mocked)
- [ ] Claude API integration (mocked)
- [ ] Error handling and edge cases

#### 3. End-to-End Tests

**Tool:** Playwright
**Location:** `tests/e2e/`
**Coverage Target:** Critical user journeys

E2E tests cover complete user flows in a real browser:

```typescript
// Example: tests/e2e/analysis-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contract Analysis Flow', () => {
  test('user can upload and analyze a contract', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Upload contract
    await page.click('text=Upload Contract');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-nda.pdf');

    // Wait for upload
    await expect(page.locator('text=Processing')).toBeVisible();

    // Wait for analysis (with timeout for AI processing)
    await expect(page.locator('[data-testid="analysis-results"]'))
      .toBeVisible({ timeout: 60000 });

    // Verify results
    await expect(page.locator('[data-testid="risk-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="red-flags"]')).toBeVisible();
  });

  test('free user hits limit and sees upgrade prompt', async ({ page }) => {
    // ... test upgrade flow
  });

  test('user can export analysis as PDF', async ({ page }) => {
    // ... test PDF export
  });
});
```

**E2E Test Scenarios:**
- [ ] New user signup flow
- [ ] Login/logout flow
- [ ] Upload and analyze contract (happy path)
- [ ] View analysis results
- [ ] Dashboard navigation
- [ ] Free tier limit enforcement
- [ ] Upgrade to paid plan
- [ ] Payment flow (Stripe test mode)
- [ ] PDF export
- [ ] Delete contract
- [ ] Error handling (upload failure, analysis failure)
- [ ] Mobile responsive behavior

#### 4. Manual Testing Protocol

**Every feature must be manually tested before being marked complete.**

Manual testing checklist template:

```markdown
## Manual Test: [Feature Name]

### Environment
- [ ] Local development
- [ ] Staging/Preview deployment
- [ ] Production (post-deploy)

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Functional Tests
- [ ] Happy path works as expected
- [ ] Error states display correctly
- [ ] Loading states are shown
- [ ] Empty states are handled
- [ ] Edge cases tested (see list below)

### Edge Cases
- [ ] Very large file (10MB)
- [ ] Very long contract (100+ pages)
- [ ] Special characters in filename
- [ ] Slow network (throttled)
- [ ] Interrupted upload (network disconnect)
- [ ] Session timeout during analysis
- [ ] Concurrent uploads

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus states visible

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No layout shifts
- [ ] Smooth animations
- [ ] No memory leaks

### Security
- [ ] Cannot access other users' data
- [ ] Auth required for protected routes
- [ ] File type validation enforced
- [ ] Rate limiting works
```

### Test Fixtures

Maintain test fixtures in `tests/fixtures/`:

```
tests/fixtures/
├── contracts/
│   ├── sample-nda.pdf
│   ├── sample-employment.pdf
│   ├── sample-lease.docx
│   ├── sample-freelance.pdf
│   ├── corrupted.pdf
│   ├── empty.pdf
│   ├── scanned.pdf
│   ├── large-100-pages.pdf
│   └── unicode-characters.pdf
├── responses/
│   ├── analysis-success.json
│   ├── analysis-high-risk.json
│   └── analysis-error.json
└── users/
    └── test-user.json
```

### CI/CD Testing

All tests run in CI before merge:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
      - run: pnpm test:coverage
```

---

## Skills Required for Development

### Technical Skills

#### Frontend Development

| Skill | Level Required | Used For |
|-------|---------------|----------|
| React | Advanced | All UI components |
| Next.js (App Router) | Intermediate-Advanced | Routing, SSR, API routes |
| TypeScript | Intermediate | Type safety throughout |
| Tailwind CSS | Intermediate | Styling |
| HTML/CSS | Solid foundation | Layout, accessibility |
| React Hook Form | Intermediate | Form handling |
| Zustand | Basic | State management |

#### Backend Development

| Skill | Level Required | Used For |
|-------|---------------|----------|
| Node.js | Intermediate | API routes, server logic |
| REST API Design | Intermediate | API architecture |
| PostgreSQL | Intermediate | Database design, queries |
| Prisma | Intermediate | ORM, migrations |
| Authentication | Intermediate | User auth, sessions |
| File Handling | Basic | Upload, storage |
| Webhooks | Basic | Stripe integration |

#### AI/ML Integration

| Skill | Level Required | Used For |
|-------|---------------|----------|
| LLM API Integration | Intermediate | Claude API |
| Prompt Engineering | Intermediate | Analysis prompts |
| JSON Parsing | Intermediate | Structured outputs |
| Error Handling | Intermediate | API failures, retries |

#### Testing

| Skill | Level Required | Used For |
|-------|---------------|----------|
| Unit Testing (Vitest) | Intermediate | Component/function tests |
| Integration Testing | Intermediate | API tests |
| E2E Testing (Playwright) | Basic-Intermediate | User flow tests |
| Test Design | Intermediate | Coverage planning |
| Mocking | Intermediate | External services |

#### DevOps & Infrastructure

| Skill | Level Required | Used For |
|-------|---------------|----------|
| Git | Intermediate | Version control |
| Vercel | Basic | Deployment |
| CI/CD (GitHub Actions) | Basic | Automated testing |
| Environment Variables | Basic | Configuration |

### Domain Knowledge

| Area | Level Required | Used For |
|------|---------------|----------|
| Legal Contracts (basic) | Basic | Understanding output quality |
| SaaS Business Models | Basic | Pricing, features |
| Payment Processing | Basic | Stripe integration |
| Security Best Practices | Intermediate | Data protection |

### Soft Skills

| Skill | Why Needed |
|-------|------------|
| Attention to Detail | Legal documents require precision |
| User Empathy | Understanding user needs |
| Problem Decomposition | Breaking complex features into tasks |
| Documentation | Maintaining clear docs |

---

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint + Prettier configuration
- Use named exports (not default exports)
- Prefer functional components
- Use descriptive variable names
- Keep functions small and focused
- Write self-documenting code

### Component Guidelines

```typescript
// Good component structure
// src/components/analysis/RiskBadge.tsx

import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors[level],
        className
      )}
      data-testid="risk-badge"
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
}
```

### API Route Guidelines

```typescript
// Good API route structure
// src/app/api/contracts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { contractSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate params
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing contract ID' }, { status: 400 });
    }

    // Fetch data
    const contract = await prisma.contract.findUnique({
      where: { id, userId: session.user.id },
      include: { analysis: true },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling

- Always catch and handle errors gracefully
- Log errors with context
- Return user-friendly error messages
- Never expose sensitive information in errors

### Security Checklist

- [ ] Validate all user input
- [ ] Sanitize file uploads
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Implement rate limiting
- [ ] Secure API routes with authentication
- [ ] Don't expose sensitive data in responses
- [ ] Use HTTPS everywhere
- [ ] Implement CSRF protection
- [ ] Set secure cookie flags
- [ ] Validate webhook signatures

---

## Key Decisions Made

1. **Next.js App Router** over Pages Router - better DX, server components
2. **Supabase** over raw PostgreSQL - faster setup, includes storage and auth
3. **Claude Sonnet** over GPT-4 - better reasoning, longer context for contracts
4. **Freemium model** - let users try before buying
5. **Vitest** over Jest - faster, better ESM support
6. **Playwright** over Cypress - better multi-browser support

---

## Local Development Setup

### Quick Start (Fully Local - No Cloud Services)

The project supports a fully local development environment using:
- **PostgreSQL** via Docker (no cloud database needed)
- **Ollama** for AI (free, runs locally)
- **Local file storage** (no cloud storage needed)

```bash
# 1. Start PostgreSQL database
docker compose up -d

# 2. Setup database schema
DATABASE_URL="postgresql://clausify:clausify_dev_password@localhost:5432/clausify" npx prisma db push

# 3. Start Ollama (in a separate terminal)
ollama serve

# 4. Pull a model (first time only)
ollama pull llama3.2

# 5. Start the dev server
npm run dev

# 6. Open http://localhost:3000
```

### Configuration Options

The app auto-detects available providers:

| Feature | Local (Free) | Cloud (Production) |
|---------|--------------|-------------------|
| Database | Docker PostgreSQL | Supabase |
| AI | Ollama (llama3.2) | Anthropic Claude |
| Storage | Local filesystem | Supabase Storage |
| Auth | NextAuth (JWT) | NextAuth (JWT) |
| Payments | Stripe Test Mode | Stripe |

Set these in `.env.local`:
```bash
AI_PROVIDER="ollama"      # ollama, anthropic, or auto
STORAGE_PROVIDER="local"  # local or supabase
```

---

## Common Commands

```bash
# Local Development
docker compose up -d        # Start PostgreSQL
docker compose down         # Stop PostgreSQL
ollama serve                # Start Ollama AI server
npm run dev                 # Start dev server

# Development
npm run build               # Build for production
npm run start               # Start production server

# Testing
npm test                    # Run all tests
npm run test:unit           # Run unit tests
npm run test:integration    # Run integration tests
npm run test:e2e            # Run e2e tests
npm run test:coverage       # Generate coverage report

# Database
npm run db:push             # Push schema to database
npm run db:migrate          # Run migrations
npm run db:studio           # Open Prisma Studio
npm run db:generate         # Generate Prisma client

# Code Quality
npm run lint                # Run ESLint
npm run format              # Run Prettier
npm run typecheck           # Run TypeScript compiler
```

---

## Claude Code Skills

Use these skills for common operations:

| Skill | Description |
|-------|-------------|
| `/dev-setup` | Start the full local development environment |
| `/run-tests` | Run unit, integration, and E2E tests |
| `/db-reset` | Reset the local database to clean state |
| `/ai-setup` | Setup Ollama for local AI |
| `/status` | Check status of all development services |
| `/build` | Build and verify production readiness |

---

## References

- [Main Planning Doc](./PLANNING.md) - Full project specification
- [Features](./plans/FEATURES.md) - Detailed feature specs
- [Roadmap](./plans/ROADMAP.md) - Development timeline
- [Tracking](./plans/TRACKING.md) - Task management
- [Investigations](./plans/INVESTIGATIONS.md) - Open research items
- [Decisions](./plans/DECISIONS.md) - Architecture decisions

---

## Security Implementation

### Security Middleware (`src/middleware.ts`)

The app includes a comprehensive security middleware that provides:

1. **Rate Limiting** - Per-user and per-IP rate limiting with Redis support:
   - `/api/auth/signup`: 5 per hour per IP
   - `/api/contracts/upload`: 10 per minute per user
   - `/api/analyze`: 60 per minute per user (supports polling)
   - `/api/demo`: 10 per minute per user
   - `/api/billing`: 10 per minute per user
   - Default: 100 per minute
   - Uses Redis for multi-instance deployments (falls back to in-memory)

2. **Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security`
   - `Content-Security-Policy`

3. **Path Traversal Protection** - File download endpoints validate paths

### Authentication

The app supports multiple auth methods:

1. **Email/Password** - Traditional credentials
2. **Google OAuth** - "Sign in with Google" button

To enable Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Set environment variables:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### Demo/Trial System

- Demo functionality **requires authentication**
- Free users get 2 analyses (not just demos)
- Analyses count toward user's limit
- Upgrade prompts when limit reached

---

## Deployment

### Railway Deployment

The app is configured for Railway deployment with:

- `nixpacks.toml` - Build configuration
- `railway.toml` - Deployment settings

**Required Environment Variables on Railway:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Reference from PostgreSQL service |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Railway app URL |
| `AI_PROVIDER` | `anthropic` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `STORAGE_PROVIDER` | `local` |
| `LOCAL_STORAGE_PATH` | `/app/uploads` |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth |
| `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth |
| `REDIS_URL` | (Optional) For multi-instance rate limiting |

**Required Services:**
1. PostgreSQL database
2. Volume mounted at `/app/uploads`
3. Redis (optional - for multi-instance rate limiting)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Railway CLI

```bash
# Login to Railway
railway login

# Link to project
railway link

# Set environment variables
railway variables --set "KEY=value"

# View logs
railway logs

# Redeploy
railway redeploy -y
```

---

## Security Audit Summary

A comprehensive OWASP Top 10 security audit was conducted. Key findings addressed:

| Issue | Status |
|-------|--------|
| Path Traversal | Fixed |
| Rate Limiting | Implemented |
| Security Headers | Implemented |
| TOCTOU Race Conditions | Fixed |
| Session Security | Hardened (24h expiry) |
| Input Validation | Implemented |
| Error Message Leakage | Fixed |

Remaining recommendations for future:
- Add audit logging
- Implement MFA
- Add email verification
- Client-side encryption for sensitive files

---

## Notes for Claude

When working on this project:

1. **Always read relevant files before editing** - Understand context first
2. **Follow existing patterns** - Look at similar code in the codebase
3. **Write tests for new code** - Unit tests at minimum, integration where appropriate
4. **Update documentation** - Keep planning docs in sync with changes
5. **Consider edge cases** - Legal documents require careful handling
6. **Security first** - Contracts contain sensitive information
7. **User experience matters** - This is a consumer product
8. **Ask for clarification** - When requirements are unclear
