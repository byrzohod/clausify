# Testing Patterns

**Analysis Date:** 2026-01-11

## Test Framework

**Runner:**
- Vitest 2.1.8 - Unit and integration tests
- Config: `vitest.config.ts` (unit), `vitest.integration.config.ts` (integration)

**Assertion Library:**
- Vitest built-in expect
- @testing-library/jest-dom for DOM matchers
- Matchers: toBe, toEqual, toThrow, toHaveBeenCalled, toBeVisible

**Run Commands:**
```bash
npm test                          # Run all tests (watch mode)
npm run test:unit                 # Unit tests only
npm run test:integration          # Integration tests only
npm run test:e2e                  # E2E tests (Playwright)
npm run test:coverage             # Generate coverage report
```

## Test File Organization

**Location:**
- Unit tests: `tests/unit/**/*.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`
- E2E tests: `tests/e2e/**/*.spec.ts`
- Co-located: `src/**/*.test.ts` (alternative)

**Naming:**
- Unit tests: `{module}.test.ts`
- Integration tests: `{feature}.test.ts`
- E2E tests: `{flow}.spec.ts`

**Structure:**
```
tests/
├── unit/
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── pdf.test.ts
│   │   │   ├── docx.test.ts
│   │   │   └── index.test.ts
│   │   ├── ai/
│   │   │   └── prompt.test.ts
│   │   └── utils.test.ts
│   ├── auth/
│   │   └── google-oauth.test.ts
│   ├── api/
│   │   └── demo.test.ts
│   └── security/
│       └── middleware.test.ts
├── integration/
│   └── api/
│       ├── auth.test.ts
│       └── contracts.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── home.spec.ts
│   ├── demo.spec.ts
│   └── pricing.spec.ts
├── setup.ts                      # Unit test setup
└── setup.integration.ts          # Integration test setup
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle success case', async () => {
      // arrange
      const input = createTestData();

      // act
      const result = await functionName(input);

      // assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('Error message');
    });
  });
});
```

**Patterns:**
- Use `describe` for grouping related tests
- Use `beforeEach` for per-test setup
- Use `vi.clearAllMocks()` to reset mocks
- Arrange/Act/Assert structure
- One assertion focus per test

## Mocking

**Framework:**
- Vitest built-in mocking (vi)
- Module mocking via `vi.mock()` at top of file

**Patterns:**
```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock specific function
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

// In test
const mockFn = vi.mocked(functionName);
mockFn.mockResolvedValue({ data: 'test' });

expect(mockFn).toHaveBeenCalledWith('expected arg');
```

**What to Mock:**
- External APIs (Claude, Stripe)
- File system operations
- Database queries (Prisma)
- Authentication (getSession)
- Environment dependencies

**What NOT to Mock:**
- Pure functions and utilities
- Internal business logic under test
- Type definitions

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

// Mock response data
const mockPdfData = {
  text: 'Contract content here',
  numpages: 2,
  info: { Title: 'Test Contract' },
};
```

**Location:**
- Factory functions: Define in test file or `tests/factories/`
- Shared fixtures: `tests/fixtures/`
- Mock data: Inline for simple cases, file for complex

## Coverage

**Requirements:**
- No enforced coverage target
- Focus on critical paths (parsers, API routes, auth)
- Coverage for awareness, not gatekeeping

**Configuration:**
- Provider: v8 (via @vitest/coverage-v8)
- Reporters: text, json, html
- Excludes: node_modules, tests/, **/*.d.ts, config files

**View Coverage:**
```bash
npm run test:coverage
open coverage/index.html
```

## Test Types

**Unit Tests:**
- Scope: Single function/module in isolation
- Mocking: Mock all external dependencies
- Speed: < 100ms per test
- Location: `tests/unit/`

**Integration Tests:**
- Scope: Multiple modules together
- Mocking: Mock external services (Stripe, storage)
- Environment: Node (not jsdom)
- Timeout: 30 seconds
- Location: `tests/integration/`

**E2E Tests:**
- Framework: Playwright
- Scope: Full user flows in real browser
- Browsers: Chrome, Firefox, Safari, Mobile
- Timeout: 60 seconds for AI operations
- Location: `tests/e2e/`

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
// Sync error
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null');
});

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('Error');
});
```

**Component Testing:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('renders and handles click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click me</Button>);

  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Global Mocks (setup.ts):**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
```

**Snapshot Testing:**
- Not currently used
- Prefer explicit assertions for clarity

---

*Testing analysis: 2026-01-11*
*Update when test patterns change*
