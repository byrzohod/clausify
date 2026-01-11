# Clausify - Feature Specifications

> Detailed breakdown of all features, their requirements, acceptance criteria, and implementation notes.

---

## Feature Status Legend

| Status | Meaning |
|--------|---------|
| `PLANNED` | Defined but not started |
| `IN_PROGRESS` | Currently being built |
| `BLOCKED` | Waiting on dependency or decision |
| `REVIEW` | Built, needs testing/review |
| `DONE` | Complete and deployed |
| `DEFERRED` | Moved to future phase |

---

## Phase 1: MVP Features

### F-001: File Upload System

**Status:** `DONE`
**Priority:** P0 (Critical)
**Estimate:** 1 day

#### Description
Users can upload contract documents in PDF or DOCX format for analysis.

#### Requirements
- [x] Support PDF files up to 10MB
- [x] Support DOCX files up to 10MB
- [x] Drag-and-drop interface
- [x] Click-to-browse fallback
- [x] File type validation (client + server)
- [x] File size validation
- [x] Upload progress indicator
- [x] Error handling with clear messages

#### Implementation Notes
- Used `react-dropzone` for upload UX
- Files stored in Supabase Storage
- Unique file IDs generated with timestamps
- Client and server-side validation implemented

---

### F-002: Document Parsing

**Status:** `DONE`
**Priority:** P0 (Critical)
**Estimate:** 1 day

#### Description
Extract text content from uploaded PDF and DOCX files for AI analysis.

#### Requirements
- [x] Parse PDF files to plain text
- [x] Parse DOCX files to plain text
- [x] Handle multi-page documents
- [x] Preserve paragraph structure where possible
- [x] Handle parsing errors gracefully
- [ ] Support scanned PDFs via OCR (Phase 2)

#### Implementation Notes
- PDF: Uses `pdf-parse` library
- DOCX: Uses `mammoth.js` library
- Parsing runs server-side in API routes
- Graceful error handling for corrupt/encrypted files

---

### F-003: AI Contract Analysis

**Status:** `DONE`
**Priority:** P0 (Critical)
**Estimate:** 2 days

#### Description
Send extracted contract text to Claude API and receive structured analysis.

#### Requirements
- [x] Send contract text to Claude API
- [x] Use optimized prompt for contract analysis
- [x] Receive structured JSON response
- [x] Parse and validate AI response
- [x] Handle API errors and timeouts
- [x] Implement retry logic (max 2 retries)
- [x] Track token usage for billing

#### Implementation Notes
- Uses Claude claude-sonnet-4-20250514 model
- Comprehensive prompt engineering for contract analysis
- Response validation and normalization
- Structured output with summary, risk score, key terms, obligations, red flags

---

### F-004: Analysis Results Display

**Status:** `DONE`
**Priority:** P0 (Critical)
**Estimate:** 1.5 days

#### Description
Display the AI analysis in a clear, scannable, user-friendly format.

#### Requirements
- [x] Summary section at top
- [x] Risk score with visual indicator (color-coded)
- [x] Key terms in structured cards
- [x] Obligations split by party
- [x] Red flags with severity badges
- [x] Expandable section-by-section breakdown
- [x] Mobile-responsive layout
- [x] Print-friendly styling

#### UI Components Implemented
- `RiskBadge` - Color-coded risk indicator
- `SummaryCard` - Contract summary display
- `KeyTermsCard` - Display key terms with labels/values
- `ObligationsCard` - Party obligations list
- `RedFlagsCard` - Warning cards with severity
- `SectionsCard` - Expandable contract sections
- `AnalysisResults` - Main container component

---

### F-005: User Authentication

**Status:** `DONE`
**Priority:** P0 (Critical)
**Estimate:** 1 day

#### Description
User signup, login, and session management.

#### Requirements
- [x] Email/password signup
- [x] Email/password login
- [x] Password reset flow (basic)
- [x] Session persistence
- [x] Logout functionality
- [x] Protected routes (dashboard, history)
- [ ] OAuth providers (Google) - Phase 2

#### Implementation Notes
- Uses NextAuth.js with credentials provider
- JWT-based sessions
- Password hashing with bcryptjs
- Prisma adapter for database

---

### F-006: User Dashboard

**Status:** `DONE`
**Priority:** P1 (High)
**Estimate:** 1 day

#### Description
Personal dashboard showing upload interface and analysis history.

#### Requirements
- [x] Welcome message with user name
- [x] Upload new contract CTA
- [x] List of past analyses (cards)
- [x] Each analysis shows: title, date, risk score, contract type
- [x] Click to view full analysis
- [x] Delete analysis option
- [x] Usage counter (X of Y analyses used)
- [x] Upgrade prompt when near/at limit

---

### F-007: Usage Limits & Free Tier

**Status:** `DONE`
**Priority:** P1 (High)
**Estimate:** 0.5 days

#### Description
Track usage and enforce free tier limits.

#### Requirements
- [x] Track analyses per user
- [x] Free tier: 2 analyses total
- [x] Display remaining analyses count
- [x] Block analysis when limit reached
- [x] Show upgrade prompt at limit
- [x] Reset logic for subscription users (monthly)

#### Implementation Notes
- `analysisCount` and plan limits stored on user record
- Check limit before processing via `canUserAnalyze()`
- Increment after successful analysis via `incrementAnalysisCount()`

---

### F-008: Landing Page

**Status:** `DONE`
**Priority:** P1 (High)
**Estimate:** 1 day

#### Description
Marketing landing page that converts visitors to users.

#### Sections
- [x] Hero: Headline, subheadline, CTA, trusted badge
- [x] Problem: Pain points of reading contracts
- [x] Solution: How Clausify helps
- [x] Features: Key capabilities with icons
- [x] How it works: 3-step process
- [x] Contract types supported
- [x] CTA section
- [x] Footer: Links, legal, social

#### Requirements
- [x] Mobile responsive
- [x] Fast load time (<2s)
- [x] Clear CTAs throughout
- [ ] Social proof section (Phase 2: testimonials)
- [x] SEO optimized

---

### F-009: PDF Export

**Status:** `DONE`
**Priority:** P2 (Medium)
**Estimate:** 0.5 days

#### Description
Export analysis results as a formatted PDF document.

#### Requirements
- [x] "Export as PDF" button on results page
- [x] PDF includes all analysis sections
- [x] Clean, professional formatting
- [x] Include Clausify branding
- [x] Include disclaimer

#### Implementation Notes
- Uses `jspdf` and `html2canvas` libraries
- Client-side PDF generation

---

### F-010: Demo Mode

**Status:** `DONE`
**Priority:** P2 (Medium)
**Estimate:** 0.5 days

#### Description
Allow visitors to try the tool with a sample contract without signing up.

#### Requirements
- [x] "Try Demo" button on landing page
- [x] Upload contract without account
- [x] Run analysis and show results
- [x] Prompt to sign up after viewing
- [x] Rate limit demo usage (by IP) - 1 per hour

#### Implementation Notes
- Dedicated `/demo` page
- `/api/demo` endpoint with IP-based rate limiting
- DemoAnalysis table for tracking usage

---

## Phase 2: Growth Features

### F-011: Stripe Payment Integration

**Status:** `DONE`
**Priority:** P0 (Critical for monetization)
**Estimate:** 1.5 days

#### Requirements
- [x] Stripe checkout for one-time purchases
- [x] Stripe checkout for subscriptions
- [x] Webhook handling for payment events
- [x] Customer portal for subscription management
- [x] Handle failed payments gracefully
- [ ] Invoice/receipt emails (Stripe handles)

#### Implementation Notes
- Four pricing tiers: Free, Pay Per Use ($4.99), Pro Monthly ($14.99), Pro Annual ($119)
- `/api/billing/checkout` and `/api/billing/portal` endpoints
- `/api/webhooks/stripe` for payment events
- Updates user plan and analysis limits on payment

---

### F-012: Contract Comparison

**Status:** `DEFERRED`
**Priority:** P2 (Medium)
**Estimate:** 2 days

#### Description
Compare two versions of a contract and highlight differences.

---

### F-013: Google OAuth

**Status:** `DEFERRED`
**Priority:** P2 (Medium)
**Estimate:** 0.5 days

---

### F-014: Browser Extension

**Status:** `DEFERRED`
**Priority:** P3 (Low)
**Estimate:** 3 days

#### Description
Chrome extension to analyze Terms of Service on any website.

---

### F-015: API Access

**Status:** `DEFERRED`
**Priority:** P3 (Low)
**Estimate:** 2 days

#### Description
Public API for developers to integrate Clausify analysis.

---

## Feature Requests / Ideas Backlog

| ID | Feature Idea | Source | Notes |
|----|--------------|--------|-------|
| IDEA-001 | OCR for scanned documents | Internal | Requires Tesseract.js |
| IDEA-002 | Contract templates library | Internal | Curated fair contracts |
| IDEA-003 | Lawyer marketplace | Internal | Phase 3+ |
| IDEA-004 | Team workspaces | Internal | Enterprise feature |
| IDEA-005 | Slack integration | Internal | Notify team on analysis |

---

## Change Log

| Date | Feature | Change | Author |
|------|---------|--------|--------|
| 2024-01-11 | F-001 to F-011 | All MVP features completed | Claude |
