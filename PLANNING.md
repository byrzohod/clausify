# Clausify - AI Contract Analyzer

> Understand any contract in 60 seconds. No lawyer required.

---

## 1. Project Overview

**Problem:** People sign contracts they don't fully understand. Lawyers are expensive ($200-500/hour), and legalese is intentionally confusing.

**Solution:** Upload a contract, get a plain-English breakdown of what you're agreeing to, potential red flags, and negotiation suggestions.

**Target Users:**
- Freelancers (client contracts, NDAs)
- Renters (lease agreements)
- Job seekers (employment contracts)
- Small business owners (vendor agreements, SaaS terms)
- Anyone signing something important

**Value Proposition:**
- Save hours of reading dense legal text
- Catch unfavorable terms before signing
- Feel confident about what you're agreeing to
- Fraction of the cost of a lawyer

---

## 2. Features

### MVP (Phase 1) - Launch in 1-2 weeks

| Feature | Description |
|---------|-------------|
| PDF/DOCX Upload | Drag-and-drop contract upload |
| Text Paste | Alternative input for copy-pasted text |
| AI Summary | Plain-English overview of the contract |
| Key Terms Extraction | Important dates, amounts, parties, obligations |
| Red Flag Detection | Unusual clauses, one-sided terms, hidden fees |
| Risk Score | Overall assessment (Low/Medium/High risk) |
| Section Breakdown | Clause-by-clause explanation |
| Export Results | Download analysis as PDF |
| Basic Auth | Email/password signup |
| Free Tier | 2 free analyses, then paywall |

### Phase 2 - Growth Features

| Feature | Description |
|---------|-------------|
| Contract Comparison | Compare two versions, highlight changes |
| Negotiation Suggestions | AI-generated counter-proposals |
| Contract Templates | Library of fair contract templates |
| Clause Library | Searchable database of common clauses explained |
| Browser Extension | Analyze terms of service on any website |
| Team Accounts | Shared workspace for small businesses |
| API Access | For developers/businesses to integrate |

### Phase 3 - Advanced

| Feature | Description |
|---------|-------------|
| Industry-Specific Analysis | Specialized models for real estate, employment, SaaS |
| Jurisdiction Awareness | Flag terms that may not be enforceable in user's location |
| Contract Scoring Database | Crowdsourced ratings of common contracts |
| Lawyer Marketplace | Connect users with lawyers for complex issues |

---

## 3. Tech Stack

### Frontend
```
Framework:      Next.js 14 (App Router)
Language:       TypeScript
Styling:        Tailwind CSS
Components:     shadcn/ui (clean, professional look)
File Upload:    react-dropzone
PDF Viewer:     react-pdf (for side-by-side view)
State:          Zustand (lightweight)
Forms:          React Hook Form + Zod validation
```

### Backend
```
Runtime:        Node.js (built into Next.js API routes)
Database:       PostgreSQL (Supabase or Neon - free tiers)
ORM:            Prisma
Auth:           NextAuth.js (or Clerk for faster setup)
File Storage:   Supabase Storage / AWS S3
Queue:          Inngest or Trigger.dev (for async processing)
```

### AI/ML
```
LLM:            Claude API (claude-sonnet-4-20250514 for analysis)
PDF Parsing:    pdf-parse (Node.js library)
DOCX Parsing:   mammoth.js
OCR (if needed): Tesseract.js (for scanned documents)
```

### Infrastructure
```
Hosting:        Vercel (Next.js optimized, generous free tier)
Database:       Supabase (PostgreSQL + Storage + Auth option)
Monitoring:     Vercel Analytics + Sentry (errors)
Email:          Resend (transactional emails)
Payments:       Stripe (subscriptions + one-time)
```

### Development
```
Package Manager: pnpm
Linting:         ESLint + Prettier
Testing:         Vitest + Playwright (E2E)
CI/CD:           GitHub Actions → Vercel
```

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Landing    │  │  Dashboard  │  │  Analysis Results       │  │
│  │  Page       │  │  (uploads)  │  │  (summary, flags, etc)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ /api/upload │  │ /api/analyze│  │ /api/contracts/[id]     │  │
│  │             │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌────────────┐   ┌────────────┐    ┌────────────┐
     │  Supabase  │   │  Claude    │    │  Stripe    │
     │  Database  │   │  API       │    │  Payments  │
     │  + Storage │   │            │    │            │
     └────────────┘   └────────────┘    └────────────┘
```

### Request Flow (Contract Analysis)

```
1. User uploads PDF/DOCX
   └→ Frontend validates file type/size

2. File sent to /api/upload
   └→ Store in Supabase Storage
   └→ Create contract record in DB (status: "processing")
   └→ Return contract ID to frontend

3. Trigger async analysis job
   └→ Parse document (pdf-parse / mammoth)
   └→ Extract raw text
   └→ Send to Claude API with analysis prompt
   └→ Parse structured response
   └→ Store results in DB (status: "completed")

4. Frontend polls for completion (or WebSocket)
   └→ Display results when ready
```

---

## 5. Database Schema

```sql
-- Users table (handled by auth provider, but custom fields)
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  plan            VARCHAR(50) DEFAULT 'free', -- free, pro, team
  analyses_used   INT DEFAULT 0,
  analyses_limit  INT DEFAULT 2,
  stripe_customer_id VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255), -- User-provided or auto-generated
  file_name       VARCHAR(255) NOT NULL,
  file_url        TEXT NOT NULL, -- Supabase storage URL
  file_type       VARCHAR(50), -- pdf, docx, txt
  file_size       INT,
  status          VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  contract_type   VARCHAR(100), -- employment, lease, nda, saas, freelance, other
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID REFERENCES contracts(id) ON DELETE CASCADE,

  -- Core analysis results
  summary         TEXT, -- Plain English overview
  risk_score      VARCHAR(20), -- low, medium, high
  risk_reasoning  TEXT, -- Why this risk score

  -- Structured data (stored as JSONB)
  key_terms       JSONB, -- {parties, dates, amounts, duration, etc}
  obligations     JSONB, -- [{party, obligation, deadline}]
  red_flags       JSONB, -- [{clause, issue, severity, suggestion}]
  sections        JSONB, -- [{title, original_text, explanation}]

  -- Metadata
  ai_model        VARCHAR(100), -- claude-sonnet-4-20250514
  tokens_used     INT,
  processing_time INT, -- milliseconds

  created_at      TIMESTAMP DEFAULT NOW()
);

-- For future: saved templates, comparison history, etc.
CREATE TABLE saved_clauses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  clause_text     TEXT NOT NULL,
  explanation     TEXT,
  source_contract UUID REFERENCES contracts(id),
  tags            VARCHAR(255)[],
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Endpoints

### Authentication
```
POST   /api/auth/signup          - Create account
POST   /api/auth/login           - Login
POST   /api/auth/logout          - Logout
GET    /api/auth/me              - Get current user
```

### Contracts
```
POST   /api/contracts/upload     - Upload new contract
GET    /api/contracts            - List user's contracts
GET    /api/contracts/[id]       - Get contract details + analysis
DELETE /api/contracts/[id]       - Delete contract
```

### Analysis
```
POST   /api/analyze/[contractId] - Trigger analysis (if not auto)
GET    /api/analyze/[contractId]/status - Check analysis status
```

### Billing
```
POST   /api/billing/checkout     - Create Stripe checkout session
POST   /api/billing/portal       - Access Stripe customer portal
POST   /api/webhooks/stripe      - Handle Stripe webhooks
```

### Public
```
POST   /api/demo                 - Analyze sample contract (no auth, limited)
```

---

## 7. AI Prompt Engineering

### Main Analysis Prompt (System)

```
You are a legal document analyst. Your job is to analyze contracts and explain them in plain, simple English that anyone can understand.

You are NOT providing legal advice. You are helping users understand what they're agreeing to.

For every contract, provide:

1. SUMMARY (2-3 sentences)
   - What type of contract is this?
   - Who are the parties?
   - What's the main purpose?

2. KEY TERMS (extract these if present)
   - Parties involved (names, roles)
   - Effective date and duration
   - Payment terms (amounts, schedule)
   - Termination conditions
   - Renewal terms (auto-renew?)

3. YOUR OBLIGATIONS (what the user must do)
   - List each obligation clearly
   - Include deadlines if specified

4. THEIR OBLIGATIONS (what the other party must do)
   - List what you should expect from them

5. RED FLAGS (potentially problematic clauses)
   For each red flag:
   - Quote the concerning clause
   - Explain why it's concerning in plain English
   - Rate severity: LOW / MEDIUM / HIGH
   - Suggest how to negotiate or what to ask

6. RISK SCORE
   - Overall: LOW / MEDIUM / HIGH
   - Brief explanation of the score

7. SECTION-BY-SECTION BREAKDOWN
   For each major section:
   - Section title
   - Plain English explanation (2-3 sentences)

Be specific. Quote actual text from the contract. Don't be vague.
If something is standard/fair, say so. Only flag genuine concerns.
```

### Response Format (JSON)

```json
{
  "summary": "string",
  "contract_type": "employment|lease|nda|freelance|saas|vendor|other",
  "risk_score": "low|medium|high",
  "risk_reasoning": "string",
  "key_terms": {
    "parties": [{"name": "string", "role": "string"}],
    "effective_date": "string|null",
    "duration": "string|null",
    "payment": {"amount": "string|null", "schedule": "string|null"},
    "termination": "string|null",
    "renewal": "string|null"
  },
  "your_obligations": [{"obligation": "string", "deadline": "string|null"}],
  "their_obligations": [{"obligation": "string", "deadline": "string|null"}],
  "red_flags": [{
    "clause": "string (quoted text)",
    "issue": "string (plain English explanation)",
    "severity": "low|medium|high",
    "suggestion": "string"
  }],
  "sections": [{
    "title": "string",
    "original_text": "string (abbreviated if long)",
    "explanation": "string"
  }]
}
```

---

## 8. User Flows

### Flow 1: New User - First Analysis

```
1. Land on homepage
2. See value prop + "Try Free" CTA
3. Upload contract (no signup required for first one)
4. See "Processing..." animation (10-30 seconds)
5. View analysis results
6. Prompt to sign up to save results + get 1 more free analysis
7. Sign up with email
8. Results saved to dashboard
```

### Flow 2: Returning User

```
1. Login
2. See dashboard with past analyses
3. Upload new contract
4. If free tier exhausted → payment prompt
5. View results
```

### Flow 3: Upgrade to Pro

```
1. Hit free limit (2 analyses)
2. See upgrade prompt with pricing
3. Click "Upgrade"
4. Stripe checkout
5. Return to app with Pro status
6. Continue analyzing
```

---

## 9. Monetization Strategy

### Pricing Tiers

| Tier | Price | Analyses | Features |
|------|-------|----------|----------|
| Free | $0 | 2 total | Basic analysis, no export |
| Pay-per-use | $4.99/each | 1 | Full analysis + PDF export |
| Pro Monthly | $14.99/mo | 20/month | Full features + history |
| Pro Annual | $119/year | 20/month | Same + 2 months free |
| Team | $49/mo | 100/month | Multi-user + API access |

### Revenue Projections (Conservative)

```
Month 3:  100 users,  20 paid → $300/mo
Month 6:  500 users,  80 paid → $1,200/mo
Month 12: 2000 users, 300 paid → $4,500/mo
```

### Cost Estimates

```
Claude API:     ~$0.30-0.50 per analysis (with caching)
Vercel:         Free tier (then ~$20/mo)
Supabase:       Free tier (then ~$25/mo)
Stripe fees:    2.9% + $0.30 per transaction
Domain:         ~$15/year

Break-even: ~10-15 paid analyses per month
```

---

## 10. MVP Development Phases

### Week 1: Core Functionality

**Days 1-2: Setup + Upload**
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup Tailwind + shadcn/ui
- [ ] Configure Supabase (DB + Storage + Auth)
- [ ] Build file upload component
- [ ] Create upload API route
- [ ] Store files in Supabase Storage

**Days 3-4: Analysis Engine**
- [ ] Integrate pdf-parse and mammoth.js
- [ ] Build Claude API integration
- [ ] Create analysis prompt
- [ ] Parse and store results
- [ ] Build results display page

**Days 5-6: Polish + Auth**
- [ ] Add NextAuth.js authentication
- [ ] Build user dashboard
- [ ] Add usage tracking (free tier limits)
- [ ] Create landing page
- [ ] Basic error handling

**Day 7: Testing + Deploy**
- [ ] Test with various contract types
- [ ] Deploy to Vercel
- [ ] Setup custom domain
- [ ] Basic analytics

### Week 2: Payments + Launch

**Days 8-9: Stripe Integration**
- [ ] Setup Stripe products/prices
- [ ] Build checkout flow
- [ ] Handle webhooks
- [ ] Implement access control

**Days 10-11: Launch Prep**
- [ ] Write landing page copy
- [ ] Create demo with sample contract
- [ ] SEO basics (meta tags, OG images)
- [ ] Prepare Product Hunt assets

**Days 12-14: Launch**
- [ ] Soft launch to communities
- [ ] Gather initial feedback
- [ ] Fix critical bugs
- [ ] Product Hunt launch

---

## 11. Marketing Channels

### Launch Strategy

1. **Product Hunt** - Primary launch platform
2. **Reddit** - r/freelance, r/smallbusiness, r/legaladvice, r/Entrepreneur
3. **Twitter/X** - Indie hacker community
4. **Hacker News** - Show HN post
5. **LinkedIn** - Target freelancers, HR people

### Ongoing Growth

- **SEO**: "how to read a contract", "rental agreement red flags", etc.
- **Content**: Blog posts explaining common contract pitfalls
- **Affiliate**: Partner with freelancer platforms, legal blogs
- **Referral**: Give users free analyses for referrals

---

## 12. Legal Considerations

### Disclaimers Needed

```
"Clausify is not a law firm and does not provide legal advice.
Our analysis is for informational purposes only and should not
be considered a substitute for professional legal counsel.
For complex legal matters, please consult a licensed attorney."
```

### Privacy

- Contracts contain sensitive information
- Must have clear privacy policy
- Option to auto-delete after X days
- Consider end-to-end encryption for enterprise tier

### Terms of Service

- Limit liability
- Define acceptable use
- Clarify data retention policies

---

## 13. Success Metrics

### Week 1 Post-Launch
- [ ] 100+ signups
- [ ] 50+ analyses completed
- [ ] 5+ paid conversions
- [ ] <5% error rate

### Month 1
- [ ] 500+ signups
- [ ] 200+ analyses
- [ ] $200+ revenue
- [ ] Positive user feedback

### Month 3
- [ ] 2000+ signups
- [ ] 1000+ analyses
- [ ] $1000+/month revenue
- [ ] <2% churn on subscriptions

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI gives wrong/dangerous advice | Medium | High | Strong disclaimers, conservative risk ratings |
| Low conversion to paid | Medium | Medium | Test pricing, improve free→paid UX |
| High Claude API costs | Low | Medium | Implement caching, optimize prompts |
| Legal issues (unauthorized practice of law) | Low | High | Clear disclaimers, don't call it "legal advice" |
| Competition copies idea | Medium | Low | Move fast, build brand, add features |

---

## 15. Future Expansion Ideas

1. **Clausify for Chrome** - Analyze any ToS on the web
2. **Clausify API** - Let other apps integrate our analysis
3. **Clausify Templates** - Fair contract templates for freelancers
4. **Clausify Compare** - Compare contract versions, track changes
5. **Clausify Teams** - Shared workspace for legal/HR teams
6. **Clausify for [Vertical]** - Specialized versions for real estate, employment, etc.

---

## Ready to Build?

This document covers the complete planning for Clausify.

**Next step:** Initialize the project and start building the MVP.

```bash
# When ready, run:
cd clausify
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

Let's ship it!
