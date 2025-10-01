# @maxifjaved/elysia-env

> Type-safe environment variable validation for Elysia.js

A lightweight, type-safe environment variable validator for [Elysia](https://elysiajs.com) using TypeBox schemas. Get runtime validation, automatic type conversion, and full TypeScript inference with zero dependencies beyond what Elysia already uses.

## Why @maxifjaved/elysia-env?

**Feels like native Elysia:**
- ✅ **Clean API**: `.use(env({ ... }))` - simple and composable
- ✅ **No `t.Object` wrapper**: Just pass properties directly
- ✅ **No `t.Optional` for defaults**: Fields with defaults are automatically typed correctly
- ✅ **Clear validation**: Explicit Convert → Default → Check pipeline
- ✅ **Zero overhead**: Uses TypeBox (already in Elysia)
- ✅ **Full type safety**: Perfect TypeScript inference in route handlers

## Installation

```bash
bun add @maxifjaved/elysia-env
# or
npm install @maxifjaved/elysia-env
# or
pnpm add @maxifjaved/elysia-env
```

## Quick Start

```ts
import { Elysia, t } from 'elysia'
import { env } from '@maxifjaved/elysia-env'

new Elysia()
  .use(env({
    PORT: t.Numeric({ default: 3000 }),
    API_KEY: t.String({ minLength: 10 }),
    NODE_ENV: t.Enum(
      { development: 'development', production: 'production' },
      { default: 'development' }
    )
  }))
  .get('/', ({ env }) => ({
    port: env.PORT,      // ← Fully typed!
    nodeEnv: env.NODE_ENV
  }))
  .listen(3000)
```

**That's it!** Clean, simple, feels like native Elysia.

## Features

### 🎯 Type-Safe Environment Access

```ts
app.get('/config', ({ env }) => {
  env.PORT          // number
  env.API_KEY       // string
  env.NODE_ENV      // 'development' | 'production'
  env.UNKNOWN       // ❌ TypeScript error!
});
```

### 🔄 Automatic Type Conversion

```ts
// process.env = { PORT: "3000", ENABLED: "true" }

const envPlugin = createEnv(
  t.Object({
    PORT: t.Numeric(),       // Converts "3000" → 3000
    ENABLED: t.Boolean()     // Converts "true" → true
  })
);
```

### 🎨 Default Values

```ts
const envPlugin = createEnv(
  t.Object({
    PORT: t.Numeric({ default: 3000 }),
    LOG_LEVEL: t.String({ default: 'info' })
  })
);
// No need for t.Optional!
```

### 📦 Prefix Filtering (Monorepos)

```ts
// process.env = {
//   APP_API_KEY: 'secret',
//   APP_DB_URL: 'postgres://...',
//   OTHER_VAR: 'ignored'
// }

const envPlugin = createEnv(
  t.Object({
    API_KEY: t.String(),    // Reads APP_API_KEY
    DB_URL: t.String()       // Reads APP_DB_URL
  }),
  { prefix: 'APP_' }
);
```

### 🚨 Custom Error Handling

```ts
createEnv(schema, {
  onError: (errors) => {
    logToSentry(errors);
    throw new Error('Invalid environment configuration');
  }
});

// Or use built-in modes:
createEnv(schema, { onError: 'exit' });   // Default: log and exit(1)
createEnv(schema, { onError: 'warn' });   // Log warning and continue
createEnv(schema, { onError: 'silent' }); // Silent failure
```

### ✅ Success Callbacks

```ts
createEnv(schema, {
  onSuccess: (env) => {
    console.log(`✅ Config loaded for ${env.APP_NAME}`);
    trackAnalytics({ environment: env.NODE_ENV });
  }
});
```

### 🧪 Testing with Custom Sources

```ts
const testEnv = createEnv(
  schema,
  {
    source: {
      API_KEY: 'test-key',
      PORT: '8080'
    }
  }
);
```

## API Reference

### `createEnv<T>(schema, options?)`

Creates an Elysia plugin that validates and injects environment variables.

**Parameters:**
- `schema`: `TObject<T>` - TypeBox object schema defining your environment variables
- `options?`: `EnvOptions<T>` - Optional configuration

**Returns:** `Elysia` plugin with validated env in context

### `EnvOptions<T>`

```ts
{
  source?: Record<string, unknown>;      // Custom env source (default: process.env)
  prefix?: string;                       // Filter vars by prefix
  onError?: 'exit' | 'warn' | 'silent' | ((errors: Record<string, string>) => void);
  onSuccess?: (env: Static<TObject<T>>) => void;
}
```

## Real-World Example

```ts
import { Elysia, t } from 'elysia';
import { createEnv } from '@maxifjaved/elysia-env';

// Define your schema
const envPlugin = createEnv(
  t.Object({
    // Required
    DATABASE_URL: t.String({ format: 'uri' }),
    API_SECRET: t.String({ minLength: 32 }),

    // With defaults
    PORT: t.Numeric({ default: 3000, minimum: 1, maximum: 65535 }),
    NODE_ENV: t.Enum(
      { development: 'development', production: 'production', test: 'test' },
      { default: 'development' }
    ),

    // Optional
    REDIS_URL: t.Optional(t.String({ format: 'uri' })),
    LOG_LEVEL: t.Union(
      [t.Literal('debug'), t.Literal('info'), t.Literal('warn'), t.Literal('error')],
      { default: 'info' }
    )
  }),
  {
    onSuccess: (env) => {
      console.log(`🚀 Server starting on port ${env.PORT}`);
    },
    onError: (errors) => {
      console.error('Environment validation failed:', errors);
      process.exit(1);
    }
  }
);

// Use in your app
const app = new Elysia()
  .use(envPlugin)
  .get('/health', ({ env }) => ({
    status: 'ok',
    environment: env.NODE_ENV,
    port: env.PORT
  }))
  .listen(3000);

export type Env = typeof app extends Elysia<infer E>
  ? E extends { decorator: { env: infer T } }
    ? T
    : never
  : never;
```

## Comparison with `@yolk-oss/elysia-env`

| Feature | @maxifjaved/elysia-env | @yolk-oss/elysia-env |
|---------|------------------|----------------------|
| Type safety | ✅ Full inference | ✅ Full inference |
| Default values | ✅ No `t.Optional` needed | ❌ Requires `t.Optional` wrapper |
| Validation pipeline | ✅ Convert → Default → Check | ❌ Opaque `Value.Parse` |
| Prefix filtering | ✅ | ✅ |
| Error handling | ✅ exit/warn/silent/custom | ✅ exit/warn/silent/custom |
| Success callback | ✅ | ✅ |
| Dependencies | ✅ Just TypeBox | ✅ Just TypeBox |
| Code size | ~200 lines | ~200 lines |
| Documentation | ✅ Comprehensive JSDoc | ⚠️  Basic |

## TypeBox Schema Reference

Common schema patterns for environment variables:

```ts
t.Object({
  // Strings
  API_KEY: t.String({ minLength: 10 }),
  DATABASE_URL: t.String({ format: 'uri' }),

  // Numbers
  PORT: t.Numeric({ minimum: 1, maximum: 65535 }),
  TIMEOUT_MS: t.Number({ default: 5000 }),

  // Booleans
  ENABLE_CACHE: t.Boolean({ default: true }),

  // Enums
  LOG_LEVEL: t.Enum({ debug: 'debug', info: 'info', warn: 'warn' }),
  NODE_ENV: t.Union([t.Literal('dev'), t.Literal('prod')]),

  // Optional
  REDIS_URL: t.Optional(t.String()),

  // With defaults (no Optional needed!)
  MAX_RETRIES: t.Number({ default: 3 })
})
```

## License

MIT

## Contributing

Issues and PRs welcome! This package was built to be simpler and more explicit than existing solutions while maintaining full feature parity.
