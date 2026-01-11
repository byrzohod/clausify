# Codebase Structure

**Analysis Date:** 2026-01-11

## Directory Layout

```
clausify/
├── src/                    # Source code
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   ├── lib/               # Business logic & utilities
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Request middleware
├── prisma/                # Database schema & migrations
├── tests/                 # Test files
├── public/                # Static assets
├── plans/                 # Planning documents
└── [config files]         # Project configuration
```

## Directory Purposes

**src/app/:**
- Purpose: Next.js App Router pages and API routes
- Contains: Pages, layouts, API route handlers
- Key files: `layout.tsx`, `page.tsx`, `providers.tsx`
- Subdirectories:
  - `(auth)/` - Public auth pages (login, signup)
  - `(dashboard)/` - Protected user pages (dashboard, contracts, settings)
  - `(marketing)/` - Public marketing pages (demo, pricing, privacy, terms)
  - `api/` - Backend API routes

**src/components/:**
- Purpose: Reusable React components
- Contains: UI primitives, forms, analysis display
- Subdirectories:
  - `ui/` - shadcn/ui primitives (button, card, dialog, etc.)
  - `forms/` - Form components (auth-form, file-upload)
  - `analysis/` - Analysis result display (summary-card, risk-badge, etc.)
  - `layout/` - Layout components (header, footer)

**src/lib/:**
- Purpose: Business logic, utilities, service integrations
- Subdirectories:
  - `auth/` - Authentication utilities and NextAuth config
  - `ai/` - Claude API client and prompts
  - `parsers/` - Document parsing (PDF, DOCX)
  - `storage/` - File storage abstraction
  - `supabase/` - Supabase client (optional)
  - `stripe/` - Stripe SDK initialization
  - `export/` - PDF export functionality
  - `utils/` - General utilities (cn for classnames)

**src/types/:**
- Purpose: TypeScript type definitions
- Key files:
  - `index.ts` - Domain types (AnalysisResult, KeyTerm, Obligation, etc.)
  - `next-auth.d.ts` - NextAuth type augmentations

**prisma/:**
- Purpose: Database schema and migrations
- Key files:
  - `schema.prisma` - Database models and relations
  - `migrations/` - Database migration history

**tests/:**
- Purpose: Test files (unit, integration, E2E)
- Subdirectories:
  - `unit/` - Unit tests (Vitest)
  - `integration/` - Integration tests (Vitest)
  - `e2e/` - E2E tests (Playwright)
  - `fixtures/` - Test data
- Key files: `setup.ts`, `setup.integration.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Landing page
- `src/middleware.ts` - Request middleware

**Configuration:**
- `tsconfig.json` - TypeScript config (path aliases: @/* → ./src/*)
- `next.config.js` - Next.js config (webpack overrides for pdf-parse)
- `tailwind.config.ts` - Tailwind CSS config
- `.env.example` - Environment variable template
- `vitest.config.ts` - Unit test config
- `playwright.config.ts` - E2E test config

**Core Logic:**
- `src/lib/prisma.ts` - Database client singleton
- `src/lib/auth/options.ts` - NextAuth configuration
- `src/lib/ai/client.ts` - Claude API integration
- `src/lib/parsers/index.ts` - Document parser router

**API Routes:**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `src/app/api/contracts/upload/route.ts` - File upload
- `src/app/api/analyze/[id]/route.ts` - Contract analysis
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhooks

**Documentation:**
- `README.md` - Project overview
- `CLAUDE.md` - AI assistant context
- `DEPLOYMENT.md` - Deployment instructions
- `plans/` - Planning documents

## Naming Conventions

**Files:**
- React components: `kebab-case.tsx` (e.g., `risk-badge.tsx`)
- Utility modules: `kebab-case.ts` (e.g., `pdf.ts`)
- Route handlers: `route.ts` (Next.js convention)
- Test files: `*.test.ts` (unit), `*.spec.ts` (E2E)

**Directories:**
- kebab-case for all directories
- Route groups: parentheses (e.g., `(auth)`, `(dashboard)`)
- Dynamic routes: brackets (e.g., `[id]`, `[...path]`)

**Special Patterns:**
- `index.ts` for barrel exports
- `layout.tsx` for route layouts
- `page.tsx` for route pages
- `loading.tsx` for loading states

## Where to Add New Code

**New Feature:**
- Primary code: `src/lib/{feature}/` for logic
- UI components: `src/components/{feature}/`
- API routes: `src/app/api/{feature}/route.ts`
- Tests: `tests/unit/lib/{feature}/`, `tests/integration/api/`

**New Component:**
- UI primitive: `src/components/ui/{name}.tsx`
- Feature component: `src/components/{category}/{name}.tsx`
- Tests: `tests/unit/components/{category}/{name}.test.tsx`

**New API Route:**
- Definition: `src/app/api/{resource}/route.ts`
- With params: `src/app/api/{resource}/[id]/route.ts`
- Tests: `tests/integration/api/{resource}.test.ts`

**New Page:**
- Public: `src/app/(marketing)/{page}/page.tsx`
- Protected: `src/app/(dashboard)/{page}/page.tsx`
- Auth: `src/app/(auth)/{page}/page.tsx`

**Utilities:**
- Shared helpers: `src/lib/utils/{name}.ts`
- Type definitions: `src/types/index.ts`

## Special Directories

**.next/:**
- Purpose: Next.js build output
- Source: Auto-generated by next build
- Committed: No (gitignored)

**node_modules/:**
- Purpose: npm dependencies
- Source: npm install
- Committed: No (gitignored)

**uploads/:**
- Purpose: Local file storage (development)
- Source: User uploads
- Committed: No (gitignored)

**prisma/migrations/:**
- Purpose: Database migration history
- Source: prisma migrate dev
- Committed: Yes (tracks schema changes)

---

*Structure analysis: 2026-01-11*
*Update when directory structure changes*
