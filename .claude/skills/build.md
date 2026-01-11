# /build - Build and Verify Production Ready

Build the application and run all checks to ensure production readiness.

## Commands to Execute

```bash
echo "🔍 Running pre-build checks..."

# Lint check
echo ""
echo "1/5 ESLint..."
npm run lint || exit 1

# Type check
echo ""
echo "2/5 TypeScript..."
npm run typecheck || exit 1

# Unit tests
echo ""
echo "3/5 Unit Tests..."
npm run test:unit || exit 1

# Integration tests
echo ""
echo "4/5 Integration Tests..."
npm run test:integration || exit 1

# Build
echo ""
echo "5/5 Building..."
npm run build || exit 1

echo ""
echo "✅ All checks passed! Ready for deployment."
```

## Build Output

After successful build, check `.next/` directory for:
- Static pages (prerendered)
- Server-side routes
- API routes
- Assets

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```
