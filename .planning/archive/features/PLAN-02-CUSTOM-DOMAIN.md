# Custom Domain Plan

> Feature: Custom domain configuration (clausify.com / clausify.ai / clausify.app)
> Priority: HIGH
> Effort: Small (2-4 hours)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md

---

## Executive Summary

Configure a professional custom domain for Clausify to build brand recognition and user trust. A memorable domain is essential for marketing and credibility.

---

## Business Value

| Metric | Impact |
|--------|--------|
| Brand Recognition | Professional appearance |
| SEO | Better search ranking potential |
| Trust | Users trust custom domains more |
| Marketing | Memorable for word-of-mouth |
| Email | Enable branded email (future) |

---

## Domain Options Analysis

### Recommended Domains (in order of preference)

| Domain | Availability | Price/Year | Pros | Cons |
|--------|-------------|------------|------|------|
| clausify.app | Check | ~$14 | Modern, tech-focused | Less common TLD |
| clausify.ai | Check | ~$80 | AI association | Expensive |
| clausify.io | Check | ~$40 | Startup-friendly | Common in tech |
| clausify.co | Check | ~$30 | Short, professional | Could confuse with .com |
| clausify.com | Check | ~$12 | Most trusted | Likely taken |
| getclausify.com | Check | ~$12 | Available alternative | Longer |
| tryclausify.com | Check | ~$12 | Action-oriented | Longer |

### Registrar Recommendations

| Registrar | Pros | Cons |
|-----------|------|------|
| **Cloudflare** | No markup, free privacy, fast DNS | Limited TLDs |
| Namecheap | Cheap, good UI | Some markup |
| Google Domains | Simple, integrated | Sold to Squarespace |
| Porkbun | Cheapest for many TLDs | Less known |

**Recommendation:** Cloudflare Registrar for best value and performance.

---

## Technical Architecture

### DNS Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                     DNS (Cloudflare)                        │
│                                                             │
│  clausify.app  ─────▶  CNAME ─────▶  railway.app           │
│  www.clausify.app ──▶  CNAME ─────▶  railway.app           │
│                                                             │
│  Optional:                                                  │
│  api.clausify.app ──▶  CNAME ─────▶  railway.app           │
│  mail.clausify.app ─▶  MX ────────▶  email provider        │
└─────────────────────────────────────────────────────────────┘
```

### SSL/TLS

- Railway provides automatic SSL via Let's Encrypt
- Cloudflare provides additional edge SSL
- Recommend: Full (strict) SSL mode in Cloudflare

---

## Implementation Plan

### Phase 1: Domain Purchase (30 minutes)

#### Step 1.1: Check Availability
```bash
# Use whois or domain registrar search
whois clausify.app
```

#### Step 1.2: Purchase Domain
1. Go to Cloudflare Registrar (or chosen registrar)
2. Search for domain
3. Add to cart and checkout
4. Enable auto-renewal
5. Enable WHOIS privacy (free on Cloudflare)

#### Step 1.3: Verify Ownership
- Check email for verification
- Confirm in registrar dashboard

### Phase 2: Railway Custom Domain (30 minutes)

#### Step 2.1: Add Domain in Railway
```bash
# Via CLI
railway domain add clausify.app

# Or via dashboard:
# Project > Settings > Domains > Add Custom Domain
```

#### Step 2.2: Get DNS Target
Railway will provide a CNAME target like:
```
clausify.up.railway.app
```

### Phase 3: DNS Configuration (30 minutes)

#### Step 3.1: Configure DNS Records

**Required Records:**
```
Type    Name    Value                           TTL
CNAME   @       clausify.up.railway.app         Auto
CNAME   www     clausify.up.railway.app         Auto
```

**If using Cloudflare (recommended additional settings):**
```
# Enable proxy (orange cloud) for DDoS protection
# Set SSL mode to "Full (strict)"
```

#### Step 3.2: Wait for Propagation
- Usually 5-30 minutes
- Can take up to 48 hours (rare)

```bash
# Check propagation
dig clausify.app
nslookup clausify.app
```

### Phase 4: SSL Certificate (Automatic)

#### Step 4.1: Railway SSL
- Railway auto-provisions Let's Encrypt certificate
- Usually ready within 5-10 minutes
- Check in Railway dashboard

#### Step 4.2: Verify SSL
```bash
# Check certificate
curl -vI https://clausify.app 2>&1 | grep -A2 "SSL certificate"

# Or use SSL Labs
# https://www.ssllabs.com/ssltest/
```

### Phase 5: Application Configuration (30 minutes)

#### Step 5.1: Update Environment Variables
```bash
# Update NEXTAUTH_URL
railway variables --set "NEXTAUTH_URL=https://clausify.app"

# Update any hardcoded URLs
```

#### Step 5.2: Update Stripe Webhook
1. Go to Stripe Dashboard > Webhooks
2. Update endpoint URL: `https://clausify.app/api/webhooks/stripe`
3. Or add new endpoint and keep old one temporarily

#### Step 5.3: Update OAuth Callbacks
If using Google OAuth:
1. Go to Google Cloud Console
2. Add authorized redirect URI: `https://clausify.app/api/auth/callback/google`

### Phase 6: Redirects Configuration (30 minutes)

#### Step 6.1: www to non-www Redirect
Add to `next.config.js`:
```javascript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.clausify.app' }],
      destination: 'https://clausify.app/:path*',
      permanent: true,
    },
  ];
}
```

#### Step 6.2: Railway Domain Redirect
Add redirect from `*.up.railway.app` to custom domain:
```javascript
// In middleware.ts
if (request.headers.get('host')?.includes('railway.app')) {
  return NextResponse.redirect(
    new URL(request.url.replace(/.*railway\.app/, 'https://clausify.app'))
  );
}
```

---

## Testing Strategy

### DNS Verification
```bash
# Check A/CNAME records
dig clausify.app
dig www.clausify.app

# Check from multiple locations
# Use https://dnschecker.org/
```

### SSL Verification
```bash
# Check certificate validity
openssl s_client -connect clausify.app:443 -servername clausify.app

# Check SSL grade
# https://www.ssllabs.com/ssltest/
```

### Functional Testing
- [ ] Homepage loads at https://clausify.app
- [ ] www redirects to non-www
- [ ] HTTP redirects to HTTPS
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] OAuth callbacks work

### SEO Verification
- [ ] Canonical URLs are correct
- [ ] Sitemap accessible at /sitemap.xml
- [ ] robots.txt accessible at /robots.txt
- [ ] No duplicate content warnings

---

## Cloudflare Configuration (If Using)

### Recommended Settings

#### SSL/TLS
- Mode: Full (strict)
- Always Use HTTPS: On
- Minimum TLS Version: 1.2
- Opportunistic Encryption: On

#### Speed
- Auto Minify: HTML, CSS, JS
- Brotli: On
- Early Hints: On
- Rocket Loader: Test first (can break JS)

#### Caching
- Caching Level: Standard
- Browser Cache TTL: 4 hours
- Always Online: On

#### Security
- Security Level: Medium
- Challenge Passage: 30 minutes
- Browser Integrity Check: On

#### Page Rules (Optional)
```
# Cache static assets aggressively
URL: clausify.app/_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month

# Bypass cache for API
URL: clausify.app/api/*
Cache Level: Bypass
```

---

## Cost Estimate

| Item | One-time | Annual |
|------|----------|--------|
| Domain (.app) | - | $14 |
| Domain (.ai) | - | $80 |
| Cloudflare | Free | Free |
| SSL | Free | Free |
| **Total (.app)** | - | **$14/year** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| SSL Grade | A+ |
| DNS Propagation | < 1 hour |
| Page Load Time | < 2s |
| Uptime | 99.9% |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DNS propagation delay | Medium | Low | Wait, use low TTL initially |
| SSL certificate issue | Low | High | Railway auto-handles |
| Domain expiry | Low | Critical | Enable auto-renewal |
| Typosquatting | Medium | Low | Register similar domains |

---

## Checklist

### Pre-Launch
- [ ] Domain purchased
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Environment variables updated
- [ ] Stripe webhook updated
- [ ] OAuth callbacks updated
- [ ] Redirects configured

### Post-Launch
- [ ] All pages load correctly
- [ ] SSL grade is A+
- [ ] Analytics tracking domain
- [ ] Search Console configured
- [ ] Social media links updated

---

## Future Considerations

### Email Configuration
When ready for branded email:
```
Type    Name            Value                   TTL
MX      @               mx1.emailprovider.com   Auto
TXT     @               v=spf1 include:...      Auto
TXT     _dmarc          v=DMARC1; p=...         Auto
```

### Subdomains
Potential future subdomains:
- `api.clausify.app` - API access (future feature)
- `docs.clausify.app` - Documentation
- `status.clausify.app` - Status page
- `blog.clausify.app` - Blog (if separate)

---

## Commands Reference

```bash
# Check DNS propagation
dig clausify.app
nslookup clausify.app

# Check SSL certificate
curl -vI https://clausify.app

# Railway domain commands
railway domain add clausify.app
railway domain list
railway domain remove clausify.app
```
