# Clausify - Architecture Decision Records (ADRs)

> Document important technical and product decisions for future reference.

---

## What is an ADR?

An Architecture Decision Record captures a significant decision along with its context and consequences. This helps future maintainers (including yourself) understand why things were built a certain way.

---

## Decision Log

| ID | Decision | Date | Status |
|----|----------|------|--------|
| ADR-001 | Use Next.js App Router | 2026-01-11 | Accepted |
| ADR-002 | Use Supabase for backend | 2026-01-11 | Accepted |
| ADR-003 | Use Claude for AI analysis | 2026-01-11 | Accepted |
| ADR-004 | Pricing model structure | 2026-01-11 | Accepted |

---

## ADR-001: Use Next.js 14 with App Router

**Status:** Accepted
**Date:** 2026-01-11
**Decision Makers:** Development Team

### Context

We need to choose a frontend framework for building Clausify. The application requires:
- Server-side rendering for SEO (landing page)
- API routes for backend logic
- Good developer experience
- Fast performance
- Easy deployment

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Next.js (App Router) | Full-stack, great DX, Vercel deployment, RSC | Newer paradigm, some learning curve |
| Next.js (Pages Router) | Stable, well-documented | Being superseded by App Router |
| Remix | Great data loading, web standards | Smaller ecosystem, less familiar |
| SvelteKit | Fast, simple syntax | Smaller ecosystem, less hiring pool |
| Separate FE/BE | Maximum flexibility | More infrastructure, CORS, complexity |

### Decision

**Next.js 14 with App Router**

### Rationale

1. **Full-stack in one:** API routes eliminate need for separate backend
2. **Vercel deployment:** Optimized hosting with zero-config
3. **React ecosystem:** Large component library availability (shadcn/ui)
4. **Server Components:** Better performance for data-heavy pages
5. **Industry standard:** Easy to find help, hire, or hand off

### Consequences

**Positive:**
- Fast development with familiar tools
- Easy deployment pipeline
- Good performance out of the box

**Negative:**
- Tied to React ecosystem
- App Router still maturing (some edge cases)
- Vercel lock-in (though can self-host)

### Notes

-

---

## ADR-002: Use Supabase for Database and Storage

**Status:** Accepted
**Date:** 2026-01-11
**Decision Makers:** Development Team

### Context

We need database storage for users, contracts, and analyses, plus file storage for uploaded documents.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Supabase | PostgreSQL, Storage, Auth, Free tier, Easy setup | Less control than raw PG |
| PlanetScale | Scalable MySQL, branching | MySQL not PostgreSQL, cost |
| Neon | Serverless PostgreSQL | Need separate storage solution |
| Railway | Easy deploy, multiple DBs | Less managed features |
| AWS (RDS + S3) | Full control, scalable | Complex setup, expensive |

### Decision

**Supabase (Database + Storage + potentially Auth)**

### Rationale

1. **All-in-one:** Database, storage, and auth in one platform
2. **PostgreSQL:** Industry standard, great tooling (Prisma)
3. **Generous free tier:** Sufficient for MVP and early growth
4. **Real-time:** Built-in subscriptions if needed later
5. **Good DX:** Dashboard, CLI, client libraries

### Consequences

**Positive:**
- Fast setup, less infrastructure decisions
- Free tier covers MVP
- Storage and DB in same ecosystem

**Negative:**
- Vendor lock-in (mitigated: standard PostgreSQL)
- Less flexibility than raw AWS
- Potential cost at scale (evaluate at growth)

### Notes

-

---

## ADR-003: Use Claude (Sonnet) for Contract Analysis

**Status:** Accepted
**Date:** 2026-01-11
**Decision Makers:** Development Team

### Context

We need an LLM to analyze contracts and produce structured output. Quality and accuracy are critical since users are making decisions based on the analysis.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Claude Sonnet | Great reasoning, long context, good JSON | Cost per token |
| Claude Opus | Best reasoning | Highest cost |
| Claude Haiku | Cheapest | May lack nuance for legal |
| GPT-4 | Strong reasoning | Shorter context, similar cost |
| GPT-4 Turbo | Long context | Slightly less accurate |
| GPT-3.5 | Cheap | Quality concerns for legal |
| Open source (Llama, Mixtral) | Free, privacy | Self-hosting, quality varies |

### Decision

**Claude claude-sonnet-4-20250514 (claude-sonnet-4-20250514)**

### Rationale

1. **Reasoning quality:** Critical for legal document analysis
2. **Long context:** Contracts can be 50+ pages
3. **JSON mode:** Reliable structured output
4. **Cost/quality balance:** Cheaper than Opus, better than Haiku for this use case
5. **Safety:** Less likely to produce harmful advice

### Consequences

**Positive:**
- High-quality analysis
- Users can trust output
- Good JSON parsing

**Negative:**
- Cost per analysis (~$0.30-0.50)
- Anthropic dependency
- Rate limits to consider

### Future Considerations

- Evaluate Haiku for simpler documents
- Consider hybrid: Haiku for classification, Sonnet for analysis
- Monitor costs and optimize prompts

---

## ADR-004: Freemium Pricing Model

**Status:** Accepted
**Date:** 2026-01-11
**Decision Makers:** Development Team

### Context

We need to monetize the product while allowing users to experience value before paying.

### Options Considered

| Model | Pros | Cons |
|-------|------|------|
| Freemium (limited free) | Try before buy, viral potential | Freeloaders, conversion challenge |
| Free trial (time-limited) | Creates urgency | Users may not use in time |
| Pay-per-use only | Simple, direct value exchange | Barrier to first use |
| Subscription only | Predictable revenue | Commitment barrier |
| Freemium + Pay-per-use | Flexibility | Complexity |

### Decision

**Freemium with limited analyses + subscription tiers**

- Free: 2 analyses (lifetime)
- Pay-per-use: $4.99/analysis
- Pro: $14.99/month for 20 analyses
- Annual: $119/year (save 2 months)

### Rationale

1. **Try before buy:** Users need to trust AI quality
2. **Low free tier:** 2 analyses enough to validate, not enough to avoid paying
3. **Multiple paths:** Pay-per-use for occasional users, subscription for regular
4. **Price anchoring:** Per-analysis price makes subscription feel like deal

### Consequences

**Positive:**
- Low barrier to entry
- Multiple conversion paths
- Value demonstrated before payment

**Negative:**
- Need to handle limit tracking
- Some users will never convert
- Potential for abuse (multiple accounts)

### Metrics to Watch

- Free → Paid conversion rate (target: 5-10%)
- Pay-per-use vs Subscription ratio
- Churn rate on subscriptions

---

## ADR Template

```markdown
## ADR-XXX: [Decision Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Decision Makers:** [Names]

### Context

[Describe the situation and why a decision is needed]

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Option 1 | ... | ... |
| Option 2 | ... | ... |
| Option 3 | ... | ... |

### Decision

[State the decision clearly]

### Rationale

[Explain why this option was chosen]

1. Reason 1
2. Reason 2
3. Reason 3

### Consequences

**Positive:**
- ...

**Negative:**
- ...

### Notes

[Any additional context, links, or references]
```

---

## Decision Status Definitions

| Status | Meaning |
|--------|---------|
| Proposed | Under discussion, not yet decided |
| Accepted | Decision made, implementing |
| Deprecated | No longer applies |
| Superseded | Replaced by another ADR |
