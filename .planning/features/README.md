# Feature Plans Index

> Detailed implementation plans for upcoming Clausify features
> Last Updated: 2026-01-12

---

## Overview

| # | Feature | Priority | Effort | Status | Dependencies |
|---|---------|----------|--------|--------|--------------|
| 01 | [Production Deploy](./PLAN-01-PRODUCTION-DEPLOY.md) | HIGH | Medium | Planning | None |
| 02 | [Custom Domain](./PLAN-02-CUSTOM-DOMAIN.md) | HIGH | Small | Planning | #01 |
| 03 | [Email Notifications](./PLAN-03-EMAIL-NOTIFICATIONS.md) | MEDIUM | Medium | Planning | #01 |
| 04 | [OCR Scanned Docs](./PLAN-04-OCR-SCANNED-DOCS.md) | MEDIUM | Medium | Planning | #01 |
| 05 | [Browser Extension](./PLAN-05-BROWSER-EXTENSION.md) | LOW | Large | Planning | #01, #06 |
| 06 | [API Access](./PLAN-06-API-ACCESS.md) | LOW | Large | Planning | #01 |
| 07 | [Team Workspaces](./PLAN-07-TEAM-WORKSPACES.md) | LOW | X-Large | Planning | #01 |

---

## Recommended Implementation Order

### Phase A: Launch (Week 1-2)
```
┌─────────────────────┐     ┌─────────────────────┐
│  01. Production     │────▶│  02. Custom Domain  │
│      Deploy         │     │                     │
└─────────────────────┘     └─────────────────────┘
```

**Goal:** Get Clausify live on production with a professional domain.

### Phase B: Engagement (Week 3-4)
```
┌─────────────────────┐
│  03. Email          │
│      Notifications  │
└─────────────────────┘
```

**Goal:** Keep users engaged with timely notifications.

### Phase C: Expansion (Week 5-6)
```
┌─────────────────────┐
│  04. OCR for        │
│      Scanned Docs   │
└─────────────────────┘
```

**Goal:** Support more document types, reduce user friction.

### Phase D: Platform (Week 7-10)
```
┌─────────────────────┐     ┌─────────────────────┐
│  06. API Access     │────▶│  05. Browser        │
│                     │     │      Extension      │
└─────────────────────┘     └─────────────────────┘
```

**Goal:** Enable integrations and expand distribution channels.

### Phase E: Enterprise (Week 11-14)
```
┌─────────────────────┐
│  07. Team           │
│      Workspaces     │
└─────────────────────┘
```

**Goal:** Enable B2B sales with team features.

---

## Effort Estimates

| Effort | Definition | Hours |
|--------|------------|-------|
| Small | 2-4 hours | 2-4 |
| Medium | 1-3 days | 8-24 |
| Large | 1-2 weeks | 40-80 |
| X-Large | 3-4 weeks | 120-160 |

---

## Cost Summary

### One-Time Costs
| Item | Cost |
|------|------|
| Domain (.app) | $14 |
| Chrome Web Store | $5 |
| Apple Developer (Safari extension) | $99 |
| **Total** | **~$120** |

### Monthly Costs (Estimated at 1,000 users)
| Service | Cost |
|---------|------|
| Railway Hosting | $17 |
| Resend (emails) | $0 (free tier) |
| Google Cloud Vision (OCR) | $0-15 (optional) |
| **Total** | **~$17-32/mo** |

---

## Revenue Potential

| Feature | Revenue Impact |
|---------|---------------|
| Production Deploy | Required for any revenue |
| Email Notifications | +10-20% retention |
| OCR | +30-40% addressable market |
| API Access | $49-499/mo per customer |
| Team Workspaces | 3-5x ARPU vs individual |

---

## Tech Stack Additions

| Feature | New Dependencies |
|---------|-----------------|
| Email | Resend, @react-email/components |
| OCR | tesseract.js, pdf-to-img, sharp |
| Browser Extension | webextension-polyfill, Vite |
| API Access | OpenAPI spec, rate limiting |
| Team Workspaces | RBAC system |

---

## Quick Links

- [Main Roadmap](../../plans/ROADMAP.md)
- [Task Tracking](../../plans/TRACKING.md)
- [Improvement Plan](../IMPROVEMENT-PLAN.md)
- [Test Plan](../TEST-PLAN.md)

---

## Notes

1. **Start with #01 (Production Deploy)** - All other features depend on having a production environment.

2. **#02 (Custom Domain)** is quick and should be done immediately after deploy.

3. **#03 (Email)** provides the best ROI for retention with moderate effort.

4. **#04 (OCR)** significantly expands the addressable market.

5. **#05-07** are lower priority but open new revenue streams.

6. Each plan includes:
   - Business value analysis
   - Technical architecture
   - Step-by-step implementation
   - Testing strategy
   - Cost estimates
   - Success metrics
   - Risk mitigations
