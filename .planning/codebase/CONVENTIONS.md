# Coding Conventions

**Analysis Date:** 2026-01-11

## Naming Patterns

**Files:**
- React components: kebab-case.tsx (e.g., `risk-badge.tsx`, `file-upload.tsx`)
- Utility modules: kebab-case.ts (e.g., `pdf.ts`, `docx.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Test files: `*.test.ts` for Vitest, `*.spec.ts` for Playwright
- Type definitions: `index.ts` for barrel exports

**Functions:**
- camelCase for all functions (e.g., `parsePdf`, `uploadFile`, `getRateLimitKey`)
- Async functions: No special prefix
- Event handlers: `handle{EventName}` pattern (e.g., `handleClick`, `handleSubmit`)
- Validation: `is{Condition}` or `can{Action}` prefix (e.g., `isSupportedType`, `canUserAnalyze`)

**Variables:**
- camelCase for variables and parameters
- UPPER_SNAKE_CASE for constants (e.g., `MAX_FILE_SIZE`, `DEFAULT_ACCEPT`)
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces and types (e.g., `AnalysisResult`, `RiskBadgeProps`)
- No `I` prefix for interfaces
- Enums: PascalCase name, UPPER_SNAKE_CASE values (e.g., `ContractStatus.PENDING`)

## Code Style

**Formatting:**
- Tool: Prettier with `.prettierrc`
- Indentation: 2 spaces
- Quotes: Single quotes for strings
- Semicolons: Required
- Trailing commas: ES5 style
- Line length: Not explicitly limited

**Linting:**
- Tool: ESLint with `eslint-config-next`
- Run: `npm run lint`
- Extends: `next/core-web-vitals`

## Import Organization

**Order:**
1. React/Next.js imports (`react`, `next/*`)
2. External packages (`zod`, `lucide-react`)
3. Internal modules (`@/lib/*`, `@/components/*`)
4. Relative imports (`./utils`, `../types`)
5. Type imports (`import type { ... }`)

**Grouping:**
- Blank line between groups
- Related imports grouped together
- Destructured imports for multiple exports

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AnalysisResult } from '@/types';
```

## Error Handling

**Patterns:**
- Throw errors, catch at API route boundary
- Custom error classes: `ParseError`, `AIError`
- Async functions: try/catch, not .catch() chains

**Error Types:**
- Throw on: invalid input, missing dependencies, API failures
- Return on: expected failures (user not found returns 404)
- Log before throwing: `console.error('Context:', error)`

**API Response Pattern:**
```typescript
try {
  // business logic
} catch (error) {
  console.error('Operation error:', error);
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  );
}
```

## Logging

**Framework:**
- console.log for info/debug
- console.error for errors
- No structured logging library (yet)

**Patterns:**
- Log at service boundaries and error points
- Include context: `console.error('Upload error:', error)`
- Avoid logging sensitive data (tokens, passwords)

## Comments

**When to Comment:**
- Explain "why", not "what"
- Document non-obvious business logic
- Mark workarounds with context

**JSDoc/TSDoc:**
- Not required for internal functions
- Recommended for exported public APIs
- Use @param, @returns, @throws tags

**TODO Comments:**
- Format: `// TODO: description`
- Track in planning docs, not just code
- Link to issues if available

## Function Design

**Size:**
- Keep functions focused (single responsibility)
- Extract helpers for complex logic
- No strict line limit, but prefer < 50 lines

**Parameters:**
- Max 3 parameters preferred
- Use options object for 4+ parameters
- Destructure in parameter list

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Consistent return types (no union of unrelated types)

## Component Patterns

**Structure:**
```typescript
interface ComponentProps {
  required: string;
  optional?: boolean;
  className?: string;
}

export function ComponentName({
  required,
  optional = true,
  className,
}: ComponentProps) {
  // hooks first
  // then handlers
  // then render
  return (
    <div className={cn('base-classes', className)}>
      {/* content */}
    </div>
  );
}
```

**Patterns:**
- Named exports (no default exports)
- Props destructured in signature
- Optional props with default values
- `className` prop for style customization
- `data-testid` for testing hooks

**Client vs Server:**
- `'use client'` directive for interactive components
- Server components by default (Next.js 14)
- State and effects only in client components

## Module Design

**Exports:**
- Named exports preferred
- Barrel files (index.ts) for public API
- No default exports

**Barrel Files:**
- Re-export public API from index.ts
- Keep internal helpers private
- Avoid circular dependencies

**Example:**
```typescript
// src/lib/parsers/index.ts
export { parsePdf, ParseError } from './pdf';
export { parseDocx } from './docx';
export { parseDocument, isSupportedType } from './parser-utils';
```

---

*Convention analysis: 2026-01-11*
*Update when patterns change*
