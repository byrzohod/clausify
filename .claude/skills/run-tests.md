# /run-tests - Run All Tests

Run the complete test suite for Clausify including unit, integration, and E2E tests.

## Test Types

- **Unit Tests**: 57 tests covering utilities, parsers, components
- **Integration Tests**: 13 tests covering API routes
- **E2E Tests**: 27 tests covering user flows (per browser)

## Commands to Execute

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests (Chromium only for speed)
npx playwright test --project=chromium
```

## Quick Verification

For a quick check before committing:
```bash
npm run lint && npm run typecheck && npm run test:unit
```

## Full CI Check

To run everything that CI would check:
```bash
npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run build
```
