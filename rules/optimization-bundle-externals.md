---
title: Bundler Externals Configuration
impact: LOW
impactDescription: Build failures, bloated bundles, deployment issues
tags: optimization, bundler, externals, deployment
category: optimization
---

## Bundler Externals Configuration

**Impact: LOW (Build failures, bloated bundles, deployment issues)**

Mastra uses native Node.js modules that cannot be bundled. When deploying
to serverless platforms or using bundlers (esbuild, webpack, rollup), these
packages must be marked as external to avoid build failures and runtime errors.

### What to Check

- Native modules are marked as external in bundler config
- @mastra/* packages are properly externalized
- Build output is appropriate size
- Serverless deployments don't fail on native modules
- Tree-shaking is working correctly

### Incorrect Configuration

```typescript
// esbuild: Missing externals - will fail on native modules
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  // No externals - tries to bundle everything!
  outdir: "dist",
});

// webpack: Not excluding native modules
module.exports = {
  entry: "./src/index.ts",
  target: "node",
  // No externals - build will fail or be huge
};

// Vercel/Next.js: Not configured for Mastra
// next.config.js without proper externals
```

### Correct Configuration

```typescript
// esbuild with proper externals
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: "dist",
  external: [
    // Native modules
    "better-sqlite3",
    "libsql",
    "@libsql/client",
    "pg",
    "pg-native",
    "mongodb",

    // AI SDK packages (have their own dependencies)
    "@ai-sdk/*",
    "ai",

    // Mastra packages
    "@mastra/*",

    // Other native/problematic packages
    "sharp",
    "canvas",
    "fsevents",
  ],
});
```

### Vercel/Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      // Database drivers
      "better-sqlite3",
      "@libsql/client",
      "libsql",
      "pg",
      "mongodb",

      // Mastra packages
      "@mastra/core",
      "@mastra/memory",
      "@mastra/libsql",
      "@mastra/rag",

      // AI packages
      "ai",
      "@ai-sdk/openai",
      "@ai-sdk/anthropic",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules as external
      config.externals = config.externals || [];
      config.externals.push({
        "better-sqlite3": "commonjs better-sqlite3",
        "@libsql/client": "commonjs @libsql/client",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
```

### Webpack Configuration

```javascript
// webpack.config.js
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  mode: process.env.NODE_ENV || "production",

  externals: [
    // Exclude all node_modules
    nodeExternals({
      // But allow certain packages to be bundled
      allowlist: [
        // Packages safe to bundle
        /^lodash/,
        /^zod/,
      ],
    }),
  ],

  // Or explicitly list externals
  // externals: {
  //   'better-sqlite3': 'commonjs better-sqlite3',
  //   '@libsql/client': 'commonjs @libsql/client',
  //   'pg': 'commonjs pg',
  // },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
```

### Serverless Framework Configuration

```yaml
# serverless.yml
service: mastra-app

provider:
  name: aws
  runtime: nodejs20.x

package:
  patterns:
    # Include node_modules that are external
    - "node_modules/better-sqlite3/**"
    - "node_modules/@libsql/**"
    - "node_modules/libsql/**"
    # Exclude unnecessary files
    - "!node_modules/**/README.md"
    - "!node_modules/**/*.d.ts"
    - "!node_modules/**/test/**"

custom:
  esbuild:
    bundle: true
    minify: true
    platform: node
    target: node20
    external:
      - better-sqlite3
      - "@libsql/client"
      - libsql
      - pg
      - mongodb
```

### Common Native Modules to Externalize

| Package | Reason | Alternative |
|---------|--------|-------------|
| better-sqlite3 | Native SQLite bindings | Use libsql for serverless |
| @libsql/client | LibSQL native | Required for Turso |
| pg | PostgreSQL native | Use pg-pool in serverless |
| mongodb | MongoDB native | Works but needs external |
| sharp | Image processing | Use cloud services |
| canvas | Canvas rendering | External only |
| bcrypt | Crypto bindings | Use bcryptjs |
| fsevents | macOS file watching | Dev only, exclude |

### Debugging Bundle Issues

```typescript
// Check bundle size and contents
import { build } from "esbuild";

const result = await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  external: ["better-sqlite3", "@libsql/*"],
  outdir: "dist",
  metafile: true,  // Generate metadata
});

// Analyze bundle
import fs from "fs";
fs.writeFileSync("meta.json", JSON.stringify(result.metafile));
// Use https://esbuild.github.io/analyze/ to visualize

// Or use esbuild's text analysis
const text = await analyzeMetafile(result.metafile);
console.log(text);
```

### Platform-Specific Considerations

```typescript
// Conditional externals based on deployment target
const getExternals = (target: "vercel" | "aws" | "cloudflare" | "local") => {
  const base = ["better-sqlite3", "@libsql/client", "pg", "mongodb"];

  switch (target) {
    case "cloudflare":
      // Cloudflare Workers have more restrictions
      return [...base, "fs", "path", "crypto", "net", "tls"];

    case "vercel":
      // Vercel Edge has similar restrictions
      return [...base, "fs", "child_process"];

    case "aws":
      // Lambda is more permissive
      return base;

    case "local":
      // Local dev - bundle everything
      return [];

    default:
      return base;
  }
};
```

### How to Fix

1. Identify native modules in your dependencies
2. Add them to bundler external configuration
3. For Next.js, use `serverComponentsExternalPackages`
4. For serverless, ensure external packages are included in deployment
5. Use bundle analyzer to verify externals are working
6. Test deployment to catch missing externals early

### Reference

- [esbuild External](https://esbuild.github.io/api/#external)
- [Next.js External Packages](https://nextjs.org/docs/app/api-reference/next-config-js/serverComponentsExternalPackages)
- [Mastra Deployment Guide](https://mastra.ai/docs/v1/deployment/overview)
