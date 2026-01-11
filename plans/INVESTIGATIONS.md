# Clausify - Investigations & Research

> Items requiring further research, technical spikes, or decisions before implementation.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `OPEN` | Needs investigation |
| `IN_PROGRESS` | Currently researching |
| `RESOLVED` | Decision made, documented |
| `DEFERRED` | Will decide later |

---

## Technical Investigations

### INV-001: PDF Parsing Library Selection

**Status:** `RESOLVED`
**Priority:** High
**Resolved Date:** 2026-01-11

#### Question
Which PDF parsing library should we use? What are the tradeoffs?

#### Options to Evaluate

| Library | Pros | Cons |
|---------|------|------|
| `pdf-parse` | Simple, popular, works server-side | Limited formatting preservation |
| `pdf.js` (Mozilla) | Full-featured, handles complex PDFs | Larger bundle, more complex setup |
| `pdf2json` | Good structure extraction | Less maintained |
| `unpdf` | Modern, based on pdf.js | Newer, less battle-tested |

#### Decision
**Selected: `pdf-parse`**

#### Rationale
1. Simple API, easy to integrate with Next.js API routes
2. Works well for text extraction from contracts
3. Handles multi-page documents
4. Small bundle size
5. Good error handling for corrupt files

#### Notes
- For Phase 2, consider adding OCR support for scanned PDFs via Tesseract.js

---

### INV-002: OCR Feasibility for Scanned Documents

**Status:** `OPEN`
**Priority:** Medium
**Assignee:** -
**Due:** Phase 2

#### Question
Should we support scanned PDFs? What's the best approach?

#### Options

| Approach | Pros | Cons | Cost |
|----------|------|------|------|
| Tesseract.js (client) | Free, no API calls | Slow, large bundle | Free |
| Tesseract.js (server) | Free, offloads work | Server CPU usage | Free |
| Google Cloud Vision | High accuracy | API cost, latency | ~$1.50/1000 pages |
| AWS Textract | Good for documents | API cost | ~$1.50/1000 pages |
| Azure Form Recognizer | Good accuracy | API cost | ~$1/1000 pages |

#### Considerations
- What % of uploads are likely scanned?
- Is accuracy good enough for legal documents?
- How does this affect pricing model?

#### Decision
> *To be filled after investigation*

---

### INV-003: Authentication Provider Selection

**Status:** `RESOLVED`
**Priority:** High
**Resolved Date:** 2026-01-11

#### Question
NextAuth.js vs Clerk vs Supabase Auth - which should we use?

#### Options

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| NextAuth.js | Free, flexible, widely used | More setup work, DIY UI | Free |
| Clerk | Beautiful UI, fast setup, great DX | Cost at scale, dependency | Free to 10k MAU |
| Supabase Auth | Already using Supabase, integrated | Less polished UI components | Included |
| Auth0 | Enterprise features | Expensive, overkill for MVP | Free to 7k MAU |

#### Evaluation Criteria
- [x] Time to implement
- [x] Cost at 1k, 10k, 100k users
- [x] OAuth provider support
- [x] Customization options
- [x] Community/support

#### Decision
**Selected: NextAuth.js with Credentials Provider**

#### Rationale
1. Free and open source
2. Full control over authentication flow
3. Built-in session management with JWT
4. Easy integration with Prisma
5. Large community and excellent documentation
6. Can add OAuth providers (Google, etc.) in Phase 2

---

### INV-004: Async Job Processing

**Status:** `RESOLVED`
**Priority:** Medium
**Resolved Date:** 2026-01-11

#### Question
How should we handle long-running analysis jobs?

#### Context
Contract analysis can take 10-30 seconds. We need to:
- Not timeout the request
- Show progress to user
- Handle failures gracefully

#### Options

| Approach | Pros | Cons |
|----------|------|------|
| Long-polling | Simple, works everywhere | Holds connection open |
| Server-Sent Events | Real-time updates, simple | One-way only |
| WebSockets | Full duplex, real-time | More complex setup |
| Background job + polling | Decoupled, scalable | More infrastructure |
| Vercel Functions (streaming) | Built-in, simple | Limited control |

#### Decision
**Selected: Synchronous processing with status updates**

#### Rationale
1. MVP approach: Direct API call with status polling
2. Contract stored with PENDING status
3. Analysis runs and updates to PROCESSING then COMPLETED
4. Frontend polls for completion
5. Simpler infrastructure for MVP
6. Can add background jobs later if needed for scale

---

### INV-005: AI Response Caching Strategy

**Status:** `OPEN`
**Priority:** Medium
**Assignee:** -
**Due:** Before launch

#### Question
How should we cache AI responses to reduce costs and latency?

#### Considerations
- Same document uploaded multiple times → serve cached result
- How to detect "same document"? (file hash vs content hash)
- Cache invalidation (if we update prompts)
- Privacy implications of caching

#### Options
- Hash file content → store analysis → serve if hash matches
- Redis cache with TTL
- Database lookup (already storing results)

#### Decision
> *To be filled after investigation*

---

### INV-006: Contract Type Classification

**Status:** `OPEN`
**Priority:** Low
**Assignee:** -
**Due:** Phase 2

#### Question
Should we pre-classify contracts before analysis to use specialized prompts?

#### Options
1. Single generic prompt for all contracts
2. Classify first, then use specialized prompt
3. Include contract type in analysis (current approach)

#### Tradeoffs
- Specialized prompts may be more accurate
- But adds complexity and latency (two API calls)
- Could use cheaper model for classification

---

## Business Investigations

### INV-007: Legal Compliance Review

**Status:** `OPEN`
**Priority:** High
**Assignee:** -
**Due:** Before launch

#### Questions
1. What disclaimers are legally required?
2. Are we at risk of "unauthorized practice of law" claims?
3. What jurisdictions should we be concerned about?
4. Do we need Terms of Service reviewed by a lawyer?

#### Actions
- [ ] Research UPL (Unauthorized Practice of Law) regulations
- [ ] Review how competitors handle disclaimers
- [ ] Consider consulting a lawyer before launch
- [ ] Draft comprehensive ToS and Privacy Policy

#### Notes
- LegalZoom, Rocket Lawyer, and DoNotPay have navigated this
- Key: Never call it "legal advice"

---

### INV-008: Pricing Strategy Validation

**Status:** `OPEN`
**Priority:** Medium
**Assignee:** -
**Due:** Before Stripe integration

#### Questions
1. Is $4.99/analysis the right price point?
2. Should we offer monthly vs annual only?
3. What's the right free tier limit (2 vs 3 vs 5)?

#### Research Actions
- [ ] Competitor pricing analysis
- [ ] Survey potential users (Reddit, Twitter)
- [ ] A/B test pricing page (post-launch)

#### Competitors to Analyze
- [ ] Spellbook
- [ ] Ironclad
- [ ] ContractPodAi
- [ ] Juro
- [ ] Smaller AI contract tools

---

### INV-009: Data Privacy & Retention

**Status:** `OPEN`
**Priority:** High
**Assignee:** -
**Due:** Before launch

#### Questions
1. How long should we retain uploaded contracts?
2. Should users be able to request data deletion?
3. Do we need GDPR compliance? CCPA?
4. Should contracts be encrypted at rest?

#### Considerations
- Contracts contain sensitive information
- Some users may want auto-delete after X days
- Enterprise users may have retention requirements

---

## UX Investigations

### INV-010: Optimal Results Page Layout

**Status:** `OPEN`
**Priority:** Medium
**Assignee:** -
**Due:** Before starting F-004

#### Question
What's the best way to present analysis results?

#### Options to Prototype
1. Single scrolling page with all sections
2. Tabbed interface (Summary | Details | Red Flags)
3. Dashboard-style with cards
4. Side-by-side (original contract + analysis)

#### Research Actions
- [ ] Look at how legal tools present information
- [ ] User test with mockups
- [ ] Consider mobile-first design

---

### INV-011: Upload Flow UX

**Status:** `OPEN`
**Priority:** Medium
**Assignee:** -
**Due:** Before starting F-001

#### Question
What happens after upload? How do we keep users engaged during processing?

#### Ideas
- Progress bar with stages ("Uploading... Parsing... Analyzing...")
- Fun facts about contracts while waiting
- Show partial results as they come in
- Email notification option for long analyses

---

## Resolved Investigations

### INV-000: Example Resolved Investigation

**Status:** `RESOLVED`
**Resolved Date:** YYYY-MM-DD

#### Question
Example question that was answered.

#### Decision
We decided to go with Option A because...

#### Rationale
- Reason 1
- Reason 2
- Reason 3

---

## Investigation Template

```markdown
### INV-XXX: [Title]

**Status:** `OPEN`
**Priority:** High/Medium/Low
**Assignee:** -
**Due:** [Date or Phase]

#### Question
[Clear question to be answered]

#### Options
[List possible approaches]

#### Evaluation Criteria
[How will we decide?]

#### Research Actions
- [ ] Action 1
- [ ] Action 2

#### Decision
> *To be filled after investigation*

#### Notes
[Any additional context]
```
