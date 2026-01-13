# /test - Run Test Suite

Run the complete test suite for Clausify.

## Quick Run

```bash
npm test -- --run
```

## Test Summary

| Type | Count | Command |
|------|-------|---------|
| Unit Tests | 554 | `npm test -- --run` |
| E2E Tests | 27 | `npm run test:e2e` |

## Commands

### Run All Tests (Non-Watch)
```bash
npm test -- --run
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run E2E Tests (Playwright)
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm test -- --run tests/unit/api/analyze.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --run -t "webhook"
```

### Watch Mode (Development)
```bash
npm test
```

## Key Test Locations

| Area | Location | Tests |
|------|----------|-------|
| API Routes | `tests/unit/api/` | ~150 |
| Components | `tests/unit/components/` | ~100 |
| Libraries | `tests/unit/lib/` | ~200 |
| Security | `tests/unit/security/` | ~20 |
| E2E | `tests/e2e/` | 27 |

## Expected Output

All 554 tests should pass:

```
Test Files  53 passed (53)
     Tests  554 passed (554)
  Duration  ~5s
```
