# Clausify Logs

View production logs from Railway.

## View Live Logs

```bash
railway logs
```

## View Recent Logs

```bash
railway logs --tail 100
```

## Filter Logs

Look for specific patterns:

```bash
railway logs | grep -i error
railway logs | grep -i webhook
railway logs | grep -i "rate limit"
```

## Log Prefixes

The app uses consistent log prefixes:

| Prefix | Source |
|--------|--------|
| `[Webhook]` | Stripe webhook handler |
| `[RateLimit]` | Rate limiting middleware |
| `[HEALTH]` | Health check endpoint |
| `[Auth]` | Authentication |

## Common Issues

### Rate Limiting
Look for: `[RateLimit] REDIS_URL not configured`
Fix: Add Redis service to Railway

### Webhook Failures
Look for: `[Webhook] signature verification failed`
Fix: Verify `STRIPE_WEBHOOK_SECRET` is correct

### Database Issues
Look for: `PrismaClientInitializationError`
Fix: Check `DATABASE_URL` and database service status
