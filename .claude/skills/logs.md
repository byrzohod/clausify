# /logs - View Production Logs

View Railway production logs for debugging.

## Commands

### Live Logs
```bash
railway logs
```

### Recent Logs (Last 100 Lines)
```bash
railway logs --tail 100
```

### Filter by Type
```bash
# Errors only
railway logs | grep -i error

# Webhooks
railway logs | grep "\[Webhook\]"

# Rate limiting
railway logs | grep "\[RateLimit\]"

# Auth issues
railway logs | grep "\[Auth\]"
```

## Log Prefixes

| Prefix | Source |
|--------|--------|
| `[Webhook]` | Stripe webhook handler |
| `[RateLimit]` | Rate limiting |
| `[HEALTH]` | Health check |
| `[Auth]` | Authentication |
| `[API]` | API routes |
| `[Email]` | Email service |

## Troubleshooting

| Issue | Look For |
|-------|----------|
| Payment issues | `[Webhook] signature` |
| Rate limit hits | `[RateLimit] blocked` |
| DB errors | `PrismaClient` |
| Auth failures | `[Auth] error` |
