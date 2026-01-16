---
title: TypeScript Module Configuration
impact: CRITICAL
impactDescription: Module resolution errors, build failures
tags: typescript, tsconfig, module, esm, bundler
category: config
---

## TypeScript Module Configuration

**Impact: CRITICAL (Module resolution errors, build failures)**

Mastra requires modern TypeScript module settings. Using CommonJS or older
Node.js module resolution will cause import errors and build failures.
The project must use ES2022 modules with bundler resolution.

### What to Check

- tsconfig.json exists in project root
- `module` is set to `ES2022` or `ESNext`
- `moduleResolution` is set to `bundler` (not `node` or `node16`)
- `target` is `ES2022` or higher
- `esModuleInterop` is enabled
- `strict` mode is recommended

### Incorrect Configuration

```json
// tsconfig.json - WILL CAUSE ERRORS
{
  "compilerOptions": {
    "target": "ES5",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": false
  }
}
```

**Common Error Messages:**

```
Cannot find module '@mastra/core' or its corresponding type declarations.
ERR_REQUIRE_ESM: require() of ES Module not supported.
```

### Correct Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

### Why These Settings Matter

| Setting | Value | Reason |
|---------|-------|--------|
| `module` | `ES2022` | Mastra uses ES modules exclusively |
| `moduleResolution` | `bundler` | Modern resolution for bundled apps |
| `target` | `ES2022` | Required for async/await and modern syntax |
| `esModuleInterop` | `true` | Allows default imports from CommonJS |
| `strict` | `true` | Catches type errors early |

### How to Fix

1. Open `tsconfig.json` in your project root
2. Update `module` to `"ES2022"`
3. Update `moduleResolution` to `"bundler"`
4. Update `target` to `"ES2022"`
5. Restart your IDE/editor to pick up changes
6. Run `npm run build` to verify no errors

### Package.json Type

Also ensure your `package.json` has the correct type:

```json
{
  "type": "module"
}
```

### Reference

- [Manual Installation Guide](https://mastra.ai/docs/v1/getting-started/manual-install)
- [TypeScript ESM Documentation](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
