# Technology Stack

**Analysis Date:** 2026-01-11

## Languages

**Primary:**
- TypeScript 5.7.2 - All application code (strict mode enabled)

**Secondary:**
- JavaScript - Configuration files (next.config.js, postcss.config.js)

## Runtime

**Environment:**
- Node.js 20.x (LTS) - Specified in `.nvmrc` and `nixpacks.toml`
- No browser runtime separation (Next.js handles SSR/CSR)

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` (1.3MB)

## Frameworks

**Core:**
- Next.js 14.2.35 (App Router) - Full-stack React framework - `package.json`
- React 18.3.1 - UI library - `package.json`

**UI:**
- Tailwind CSS 3.4.17 - Utility-first CSS - `tailwind.config.ts`
- shadcn/ui (Radix UI primitives) - Component library - `src/components/ui/`
- class-variance-authority 0.7.1 - Component variants - `package.json`
- tailwind-merge 2.6.0 - Class merging - `package.json`
- lucide-react 0.468.0 - Icons - `package.json`

**Testing:**
- Vitest 2.1.8 - Unit/integration tests - `vitest.config.ts`
- @playwright/test 1.49.1 - E2E tests - `playwright.config.ts`
- @testing-library/react 16.1.0 - Component testing - `package.json`
- jsdom 25.0.1 - DOM environment - `package.json`

**Build/Dev:**
- TypeScript 5.7.2 - Compilation - `tsconfig.json`
- PostCSS 8.4.49 - CSS processing - `postcss.config.js`
- ESLint 8.57.0 - Linting - `.eslintrc.json`
- Prettier 3.4.2 - Formatting - `.prettierrc`

## Key Dependencies

**Critical:**
- next-auth 4.24.10 - Authentication - `src/lib/auth/options.ts`
- @prisma/client 5.22.0 - Database ORM - `src/lib/prisma.ts`
- @anthropic-ai/sdk 0.32.1 - Claude AI API - `src/lib/ai/client.ts`
- stripe 17.4.0 - Payment processing - `src/lib/stripe/index.ts`

**Document Processing:**
- pdf-parse 1.1.1 - PDF text extraction - `src/lib/parsers/pdf.ts`
- mammoth 1.8.0 - DOCX text extraction - `src/lib/parsers/docx.ts`

**Infrastructure:**
- zod 3.24.1 - Schema validation - API routes
- react-hook-form 7.54.1 - Form handling - `src/components/forms/`
- zustand 5.0.2 - State management - `package.json`
- bcryptjs 2.4.3 - Password hashing - `src/lib/auth/index.ts`

**PDF Export:**
- jspdf 2.5.2 - PDF generation - `src/lib/export/pdf.ts`
- html2canvas 1.4.1 - Canvas rendering - `src/lib/export/pdf.ts`

**Optional:**
- @supabase/supabase-js 2.47.10 - Cloud storage alternative - `src/lib/supabase/`
- @sentry/nextjs 10.32.1 - Error tracking - `package.json` (not configured)

## Configuration

**Environment:**
- `.env.local` for local development (gitignored)
- `.env.example` documents required variables
- Key variables: DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY, STRIPE_SECRET_KEY

**Build:**
- `tsconfig.json` - TypeScript config with `@/*` path alias
- `next.config.js` - Next.js config with webpack pdf-parse fix
- `tailwind.config.ts` - Tailwind with shadcn/ui preset

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js 20+)
- Docker (optional, for local PostgreSQL) - `docker-compose.yml`
- Ollama (optional, for local AI) - `src/lib/ai/providers/ollama.ts`

**Production:**
- Railway (primary deployment target) - `railway.toml`, `nixpacks.toml`
- PostgreSQL 16 database
- Vercel Analytics integration - `src/app/layout.tsx`

---

*Stack analysis: 2026-01-11*
*Update after major dependency changes*
