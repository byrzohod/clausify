# Clausify Test Suite

Run the complete test suite for Clausify.

## Test Types

1. **Unit Tests** (255 tests) - Test individual functions and components
2. **E2E Tests** (27 tests) - Test user flows with Playwright

## Commands

### Run All Unit Tests
```bash
npm test -- --run
```

### Run Unit Tests with Coverage
```bash
npm run test:coverage
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm test -- --run tests/unit/lib/auth/index.test.ts
```

### Run Tests in Watch Mode (Development)
```bash
npm test
```

## Test Locations

| Type | Location | Count |
|------|----------|-------|
| Unit Tests | `tests/unit/` | 255 |
| E2E Tests | `tests/e2e/` | 27 |

## Key Test Files

- `tests/unit/lib/auth/` - Authentication tests
- `tests/unit/lib/ai/` - AI integration tests
- `tests/unit/api/` - API route tests
- `tests/unit/components/` - Component tests
- `tests/unit/security/` - Security middleware tests
- `tests/e2e/` - Playwright E2E tests

## Adding New Tests

1. Create test file next to the code or in `tests/unit/`
2. Use Vitest for unit tests
3. Use Playwright for E2E tests
4. Follow existing patterns in the test files
