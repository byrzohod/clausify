# Architecture

**Analysis Date:** 2026-01-11

## Pattern Overview

**Overall:** Full-Stack Monolith with Layered Architecture

**Key Characteristics:**
- Single Next.js deployment (App Router)
- Server Components for data fetching
- Client Components for interactivity
- API routes for backend logic
- Prisma ORM for database access

## Layers

**Presentation Layer:**
- Purpose: User interface and interaction
- Contains: React components, pages, layouts
- Location: `src/app/**` (pages), `src/components/**` (components)
- Depends on: API routes via fetch, lib utilities
- Used by: End users via browser

**API Layer:**
- Purpose: HTTP endpoints for frontend and external access
- Contains: Route handlers with validation and auth
- Location: `src/app/api/**`
- Depends on: Auth layer, Service layer, Prisma
- Used by: Presentation layer, Stripe webhooks

**Service Layer:**
- Purpose: Business logic and external integrations
- Contains: AI client, parsers, storage, auth utilities
- Location: `src/lib/**`
- Depends on: External APIs (Claude, Stripe), Prisma
- Used by: API layer

**Data Layer:**
- Purpose: Database access and persistence
- Contains: Prisma client, schema, migrations
- Location: `src/lib/prisma.ts`, `prisma/schema.prisma`
- Depends on: PostgreSQL database
- Used by: Service layer, API layer

**Middleware Layer:**
- Purpose: Request processing (rate limiting, security)
- Contains: Next.js middleware
- Location: `src/middleware.ts`
- Depends on: NextAuth for token verification
- Used by: All incoming requests

## Data Flow

**Contract Upload Flow:**

1. User selects file in `FileUpload` component
2. POST `/api/contracts/upload` with FormData
3. Route handler validates auth via `getSession()`
4. File validated (type, size) via Zod schema
5. `uploadFile()` saves to storage (local or Supabase)
6. `prisma.contract.create()` saves metadata
7. Return contractId to frontend

**Contract Analysis Flow:**

1. User triggers analysis from dashboard
2. POST `/api/analyze/[id]` with contractId
3. `canUserAnalyze()` checks quota
4. `downloadFile()` retrieves from storage
5. `parseDocument()` extracts text (PDF or DOCX)
6. `analyzeContract()` calls Claude API
7. `normalizeAnalysisResult()` validates response
8. `prisma.analysis.update()` saves results
9. `incrementAnalysisCount()` decrements quota
10. Return analysis to frontend

**State Management:**
- Server state: Prisma queries (no caching layer)
- Client state: React hooks, minimal Zustand
- Session state: JWT tokens via NextAuth

## Key Abstractions

**Storage Strategy:**
- Purpose: Abstract file storage backend
- Location: `src/lib/storage/index.ts`
- Implementations: `local.ts` (filesystem), `supabase/storage.ts` (cloud)
- Pattern: Factory based on STORAGE_PROVIDER env var

**Parser Strategy:**
- Purpose: Abstract document text extraction
- Location: `src/lib/parsers/index.ts`
- Implementations: `pdf.ts` (pdf-parse), `docx.ts` (mammoth)
- Pattern: Map lookup by MIME type

**AI Client:**
- Purpose: Claude API integration
- Location: `src/lib/ai/client.ts`
- Pattern: Lazy initialization (allows build without API key)
- Features: Structured output parsing, error normalization

**Auth Utilities:**
- Purpose: Session management and access control
- Location: `src/lib/auth/index.ts`
- Functions: `getSession()`, `getCurrentUser()`, `canUserAnalyze()`, `incrementAnalysisCount()`
- Pattern: Wrapper functions around NextAuth

## Entry Points

**Application Entry:**
- Location: `src/app/layout.tsx`
- Triggers: Page load
- Responsibilities: Root layout, providers, metadata

**Middleware Entry:**
- Location: `src/middleware.ts`
- Triggers: All requests (before routing)
- Responsibilities: Rate limiting, security headers

**API Entry Points:**
- Location: `src/app/api/**/route.ts`
- Triggers: HTTP requests
- Responsibilities: Auth, validation, business logic

## Error Handling

**Strategy:** Throw and catch at boundaries

**Patterns:**
- Custom error classes: `ParseError`, `AIError`
- API routes: try/catch with generic user messages
- Logging: console.error with context
- HTTP: Appropriate status codes (400, 401, 404, 500)

**Example:**
```typescript
try {
  // business logic
} catch (error) {
  console.error('Upload error:', error);
  return NextResponse.json(
    { error: 'Failed to upload file' },
    { status: 500 }
  );
}
```

## Cross-Cutting Concerns

**Logging:**
- Approach: console.log/error (no structured logging)
- Location: API routes, service layer
- Note: Production should use structured logging

**Validation:**
- Approach: Zod schemas at API boundary
- Location: API route handlers
- Pattern: Parse body, validate, return 400 on failure

**Authentication:**
- Approach: NextAuth with JWT strategy
- Check: `getSession()` in each protected route
- Pattern: Return 401 if no session

**Rate Limiting:**
- Approach: In-memory Map with time windows
- Location: `src/middleware.ts`
- Note: Needs Redis for multi-instance deployment

**Security Headers:**
- Approach: Set in middleware
- Headers: CSP, X-Frame-Options, HSTS, etc.
- Location: `src/middleware.ts`

---

*Architecture analysis: 2026-01-11*
*Update when major patterns change*
