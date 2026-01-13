# /typecheck - TypeScript Check

Run TypeScript compiler to check for type errors.

## Command

```bash
npm run typecheck
```

Or directly:

```bash
npx tsc --noEmit
```

## Check Specific Files

```bash
npx tsc --noEmit src/app/api/analyze/[id]/route.ts
```

## Common Type Errors

| Error | Fix |
|-------|-----|
| Property does not exist | Add to interface or use optional chaining |
| Type 'X' is not assignable | Check return types match |
| Cannot find module | Run `npm install` or check import path |
| Object is possibly undefined | Add null check or use `!` |

## TypeScript Config

`tsconfig.json` uses:
- Strict mode enabled
- Path aliases (`@/` for `src/`)
- Next.js optimizations
