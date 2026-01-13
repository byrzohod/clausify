# /lint - Run ESLint

Check code quality with ESLint.

## Command

```bash
npm run lint
```

## Fix Auto-fixable Issues

```bash
npm run lint -- --fix
```

## Check Specific Files

```bash
npx eslint src/app/api/analyze/
npx eslint "src/**/*.tsx"
```

## Common Issues

| Issue | Fix |
|-------|-----|
| Unused variables | Remove or prefix with `_` |
| Missing dependencies | Add to useEffect deps array |
| Any type | Add proper TypeScript types |
| Console statements | Remove before commit |

## Configuration

ESLint config is in `eslint.config.mjs` with:
- Next.js recommended rules
- TypeScript strict checking
- React hooks rules
