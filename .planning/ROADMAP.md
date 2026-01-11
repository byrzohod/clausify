# Roadmap: Clausify

## Overview

Clausify v1.1 focuses on contract comparison as the core differentiating feature, plus critical fixes for production stability. The milestone adds the ability to compare two contracts (diff versions, template matching, side-by-side AI analysis) while addressing security and scaling issues identified in the codebase analysis.

## Milestones

- 🚧 **v1.1 Comparison + Stability** - Phases 1-7 (in progress)

## Domain Expertise

None (standard Next.js/TypeScript patterns)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation Fixes** - Debug logging cleanup, health endpoint
- [ ] **Phase 2: Redis Rate Limiting** - Multi-instance scaling support
- [ ] **Phase 3: Comparison UI** - Upload two contracts, display side-by-side
- [ ] **Phase 4: Diff Engine** - Text comparison, change highlighting
- [ ] **Phase 5: Template Matching** - Save templates, compare against them
- [ ] **Phase 6: Comparative Analysis** - AI analysis on both, compare results
- [ ] **Phase 7: Webhook Reliability** - Fix silent failures, core test coverage

## Phase Details

### Phase 1: Foundation Fixes
**Goal**: Clean up security issues and add observability
**Depends on**: Nothing (first phase)
**Research**: Unlikely (straightforward cleanup)
**Plans**: 1 plan

Plans:
- [x] 01-01: Auth logging cleanup + health endpoint

### Phase 2: Redis Rate Limiting
**Goal**: Production-ready rate limiting that works with multiple instances
**Depends on**: Phase 1
**Research**: Complete (ioredis recommended, sliding window algorithm)
**Plans**: 1 plan

Plans:
- [x] 02-01: Redis client + rate limiting migration

Key tasks:
- Add Railway Redis addon
- Replace in-memory Map with Redis-backed rate limiting
- Maintain same rate limit rules (signup, upload, analyze, demo)

### Phase 3: Comparison UI
**Goal**: UI for uploading and viewing two contracts side-by-side
**Depends on**: Phase 2
**Research**: Unlikely (React components, existing patterns)
**Plans**: TBD

Key tasks:
- Create comparison page route
- Dual file upload component
- Side-by-side contract display layout
- Navigation from dashboard

### Phase 4: Diff Engine
**Goal**: Text-level comparison with change highlighting
**Depends on**: Phase 3
**Research**: Likely (diff algorithms/libraries)
**Research topics**: diff-match-patch vs jsdiff, paragraph vs line vs word diff
**Plans**: TBD

Key tasks:
- Integrate diff library
- Create diff view component with highlighting
- Handle PDF/DOCX text normalization for comparison

### Phase 5: Template Matching
**Goal**: Save contract templates and compare new contracts against them
**Depends on**: Phase 4
**Research**: Unlikely (database + existing diff)
**Plans**: TBD

Key tasks:
- Template model in database
- Save contract as template flow
- Template selection for comparison
- Deviation highlighting from template

### Phase 6: Comparative Analysis
**Goal**: Run AI analysis on both contracts and compare results
**Depends on**: Phase 5
**Research**: Unlikely (existing Claude integration)
**Plans**: TBD

Key tasks:
- Parallel analysis of both contracts
- Comparison view for analysis results
- Highlight differences in risk scores, key terms, obligations

### Phase 7: Webhook Reliability
**Goal**: Fix silent Stripe webhook failures and add test coverage
**Depends on**: Phase 6
**Research**: Unlikely (Stripe patterns established)
**Plans**: TBD

Key tasks:
- Add logging to all webhook early returns
- Add error tracking for webhook failures
- Create Stripe webhook test suite
- Add tests for untested API routes (priority endpoints)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Fixes | 1/1 | Complete | 2026-01-11 |
| 2. Redis Rate Limiting | 1/1 | Complete | 2026-01-11 |
| 3. Comparison UI | 1/1 | Complete | 2026-01-11 |
| 4. Diff Engine | 1/1 | Complete | 2026-01-11 |
| 5. Template Matching | 1/1 | Complete | 2026-01-11 |
| 6. Comparative Analysis | 0/TBD | Not started | - |
| 7. Webhook Reliability | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-11*
*Milestone: v1.1 Comparison + Stability*
