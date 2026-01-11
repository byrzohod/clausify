# Clausify - Planning Documents

> This directory contains all planning, tracking, and decision documentation for the Clausify project.

---

## Document Overview

| Document | Purpose | When to Update |
|----------|---------|----------------|
| [FEATURES.md](./FEATURES.md) | Detailed feature specifications | When defining or updating features |
| [INVESTIGATIONS.md](./INVESTIGATIONS.md) | Research items and technical spikes | When exploring unknowns |
| [ROADMAP.md](./ROADMAP.md) | Development phases and milestones | Weekly or at phase transitions |
| [TRACKING.md](./TRACKING.md) | Day-to-day task tracking | Daily during active development |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records | When making significant choices |

---

## Quick Links

### I want to...

| Goal | Document | Section |
|------|----------|---------|
| See what we're building | FEATURES.md | Phase 1: MVP Features |
| Check current tasks | TRACKING.md | Current Sprint |
| Understand a past decision | DECISIONS.md | Decision Log |
| See the big picture timeline | ROADMAP.md | Overview |
| Research something | INVESTIGATIONS.md | Open investigations |
| Add a new feature idea | FEATURES.md | Feature Requests Backlog |
| Report a bug | TRACKING.md | Bugs section |

---

## Project Summary

**Clausify** is an AI-powered contract analyzer that helps people understand legal documents in plain English.

### Key Value Props
- Understand any contract in 60 seconds
- Identify red flags and risks
- Get negotiation suggestions
- Fraction of the cost of a lawyer

### Target Users
- Freelancers signing client contracts
- Renters reviewing leases
- Job seekers with employment contracts
- Small business owners

### Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js API Routes, Prisma
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (Sonnet)
- **Payments:** Stripe
- **Hosting:** Vercel

---

## Document Maintenance

### Daily
- Update TRACKING.md with task progress
- Move completed tasks to Done

### Weekly
- Review ROADMAP.md progress
- Update sprint status
- Groom backlog in TRACKING.md

### As Needed
- Add new features to FEATURES.md
- Document decisions in DECISIONS.md
- Create investigations in INVESTIGATIONS.md

---

## Status Conventions

We use consistent status labels across documents:

| Status | Meaning |
|--------|---------|
| `TODO` / `PLANNED` | Not started |
| `IN_PROGRESS` | Currently being worked on |
| `BLOCKED` | Waiting on something |
| `REVIEW` | Done, needs review |
| `DONE` / `RESOLVED` | Complete |
| `DEFERRED` | Postponed to later |

---

## Contributing to Docs

1. **Be specific:** Vague tasks are hard to complete
2. **Keep updated:** Stale docs are worse than no docs
3. **Link related items:** Reference feature IDs, task IDs, etc.
4. **Date entries:** Especially decisions and resolutions

---

## Parent Documentation

See the main [PLANNING.md](../PLANNING.md) in the project root for:
- Full project overview
- Detailed architecture
- Database schema
- API endpoints
- AI prompts
- Complete implementation guide
