# /build - Build and Verify

Build the application and run all checks for production readiness.

## Quick Build

```bash
npm run build
```

## Full Verification

```bash
echo "1/4 Lint..." && npm run lint
echo "2/4 TypeScript..." && npm run typecheck
echo "3/4 Tests..." && npm test -- --run
echo "4/4 Build..." && npm run build
echo "Done!"
```

## Individual Steps

### Lint Check
```bash
npm run lint
```

### TypeScript Check
```bash
npm run typecheck
```

### Tests
```bash
npm test -- --run
```

### Production Build
```bash
npm run build
```

## Build Output

After successful build, `.next/` contains:
- Static pages (prerendered)
- Server-side routes
- API routes
- Optimized assets

## Common Build Errors

| Error | Fix |
|-------|-----|
| Type errors | Run `npm run typecheck` to see details |
| Lint errors | Run `npm run lint -- --fix` |
| Test failures | Run `npm test` to see which tests fail |
| Missing deps | Run `npm install` |
