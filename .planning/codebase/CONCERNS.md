# Codebase Concerns

**Analysis Date:** 2026-01-11

## Tech Debt

**Excessive Auth Logging:**
- Issue: 47 console.log statements in auth callbacks expose sensitive data
- Files: `src/lib/auth/options.ts` (lines 70-130)
- Why: Added during development for debugging
- Impact: Sensitive data (user IDs, emails) in production logs
- Fix approach: Replace with structured logging library (Pino), remove debug logs

**In-Memory Rate Limiting:**
- Issue: Map-based rate limiting won't work with multiple server instances
- Files: `src/middleware.ts` (line 6)
- Why: Simple implementation for MVP
- Impact: Rate limiting bypassed in multi-instance deployment
- Fix approach: Use Redis for distributed rate limiting

**Lazy Client Initialization with Type Unsafety:**
- Issue: API clients initialized as `null as unknown as Type` for build flexibility
- Files: `src/lib/stripe/index.ts` (line 12), `src/lib/ai/client.ts` (lines 11-17)
- Why: Allow build without API keys
- Impact: Runtime crashes if called before initialization
- Fix approach: Explicit initialization check with clear error, or factory pattern

**JSON.parse(JSON.stringify()) Pattern:**
- Issue: 8 instances of inefficient serialization for "ensuring proper JSON format"
- Files: `src/app/api/analyze/[id]/route.ts` (lines 111-117), `src/app/api/demo/route.ts` (line 117)
- Why: Quick fix for potential circular references or Prisma types
- Impact: Performance overhead, indicates potential data model issues
- Fix approach: Use proper DTO transformation, investigate root cause

## Known Bugs

**Silent Webhook Failures:**
- Symptoms: Stripe webhook events process but don't update database
- Trigger: User not found in database when webhook fires
- Files: `src/app/api/webhooks/stripe/route.ts` (lines 85-87, 134-136, 152-155)
- Workaround: None - events silently dropped
- Root cause: Early `return;` without logging or error tracking
- Fix: Add logging and error tracking for all early returns

## Security Considerations

**allowDangerousEmailAccountLinking:**
- Risk: OAuth accounts can be linked to existing email without verification
- Files: `src/lib/auth/options.ts` (line 15)
- Current mitigation: None
- Recommendations: Require email verification before account linking, or disable linking

**MIME Type Validation:**
- Risk: File type validation based only on MIME type, not content
- Files: `src/app/api/contracts/upload/route.ts` (line 34), `src/app/api/demo/route.ts` (lines 73-76)
- Current mitigation: Max file size limits
- Recommendations: Add magic byte validation for file content verification

**Debug Logging in Production:**
- Risk: Sensitive data exposed in logs (emails, user IDs, tokens)
- Files: `src/lib/auth/options.ts` (47 console statements)
- Current mitigation: None
- Recommendations: Remove or gate behind development environment check

## Performance Bottlenecks

**No Pagination on Contract Lists:**
- Problem: All contracts fetched at once
- Files: `src/app/api/contracts/route.ts` (lines 13-28)
- Measurement: Unbound query for users with many contracts
- Cause: Single query without LIMIT/OFFSET
- Improvement path: Add cursor-based pagination

**No Document Size Validation:**
- Problem: Large documents sent to Claude without size checks
- Files: `src/app/api/analyze/[id]/route.ts`
- Measurement: Could exceed Claude's context window
- Cause: Missing validation before AI call
- Improvement path: Add text length validation, truncate or reject oversized docs

## Fragile Areas

**Auth Callbacks Chain:**
- Files: `src/lib/auth/options.ts`
- Why fragile: Multiple callbacks with complex interdependencies
- Common failures: Session data not propagated correctly
- Safe modification: Add comprehensive integration tests first
- Test coverage: Minimal (only Google OAuth unit tests)

**Stripe Webhook Handler:**
- Files: `src/app/api/webhooks/stripe/route.ts`
- Why fragile: Large switch statement with 5 event types
- Common failures: Missing event handling, silent failures
- Safe modification: Extract each handler to separate function with tests
- Test coverage: None currently

## Test Coverage Gaps

**Untested API Routes:**
- What's not tested: signup, billing/checkout, billing/portal, user, contracts/[id]
- Risk: ~50% of API endpoints have no test coverage
- Priority: High
- Difficulty: Need to mock auth, Prisma, external services

**Stripe Webhook Flow:**
- What's not tested: Full webhook → database update flow
- Risk: Payment processing could break silently
- Priority: High
- Difficulty: Need Stripe test fixtures and signature mocking

**E2E Tests:**
- What's not tested: Upload → Analyze → View → Export flow
- Risk: Core user journey untested
- Priority: High
- Difficulty: Need test fixtures, AI response mocking

## Missing Critical Features

**Structured Error Codes:**
- Problem: Generic error messages don't indicate root cause
- Current workaround: Users retry or contact support
- Blocks: Self-service troubleshooting
- Implementation complexity: Medium (add error code system)

**Health Check Endpoint:**
- Problem: No `/health` endpoint for container orchestration
- Current workaround: None
- Blocks: Proper Railway health monitoring
- Implementation complexity: Low (simple endpoint)

**Audit Logging:**
- Problem: No audit trail for user actions
- Current workaround: Console logs only
- Blocks: Security audits, debugging user issues
- Implementation complexity: Medium (add audit table and logging)

## Dependencies at Risk

**pdf-parse:**
- Risk: Library has known issues with certain PDF formats
- Impact: Some PDFs may fail to parse
- Migration plan: Consider pdf-lib or pdf.js for more robust parsing

**In-Memory Structures:**
- Risk: Rate limit state lost on restart
- Impact: Rate limiting temporarily disabled after deploys
- Migration plan: Redis for persistent rate limiting state

---

*Concerns audit: 2026-01-11*
*Update as issues are fixed or new ones discovered*
