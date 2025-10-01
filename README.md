# @maxifjaved/elysia-env

> Type-safe environment variable validation for Elysia.js - feels native, works
> beautifully

Lightweight environment validator for [Elysia](https://elysiajs.com) using
TypeBox. Get runtime validation, automatic type conversion, and full TypeScript
inference.

## Installation

```bash
bun add @maxifjaved/elysia-env
```

## Quick Start

```ts
import { Elysia, t } from "elysia";
import { env } from "@maxifjaved/elysia-env";

new Elysia()
  .use(env({
    PORT: t.Number({ default: 3000 }),
    API_KEY: t.String({ minLength: 10 }),
  }))
  .get("/", ({ env }) => env.PORT) // Fully typed!
  .listen(3000);
```

## Features

- ✅ **Native API**: `.use(env({...}))` - no `t.Object` wrapper needed
- ✅ **Type conversion**: Converts strings to numbers/booleans automatically
- ✅ **Full type safety**: Perfect TypeScript inference in handlers
- ✅ **Prefix filtering**: For monorepos (`prefix: 'APP_'`)
- ✅ **Error handling**: exit/warn/silent/custom callbacks
- ✅ **Zero overhead**: Uses TypeBox (already in Elysia)

## Usage

### Basic Example

```ts
const app = new Elysia()
  .use(env({
    DATABASE_URL: t.String({ format: "uri" }),
    PORT: t.Number({ default: 3000 }),
    NODE_ENV: t.Enum({ dev: "development", prod: "production" }),
  }))
  .get("/config", ({ env }) => env); // All typed!
```

### Dynamic Port Configuration

For proper TypeScript type inference, use one of these patterns:

**Pattern 1: Inline usage (Recommended - Best type inference)**
```ts
const app = new Elysia()
  .use(env({
    PORT: t.Number({ default: 3000 }),
    API_KEY: t.String(),
  }))
  .get("/", ({ env }) => env.API_KEY); // ✅ Fully typed!

// Access from app instance after using the plugin
const port = app.decorator.env.PORT;
app.listen(port);
```

**Pattern 2: Store plugin in variable**
```ts
const envPlugin = env({
  PORT: t.Number({ default: 3000 }),
  API_KEY: t.String(),
});

// Apply plugin using .use() - this enables type inference
const app = new Elysia().use(envPlugin);

app.get("/", ({ env }) => env.API_KEY); // ✅ Fully typed!

// Access validated values
const port = envPlugin.decorator.env.PORT;
app.listen(port);
```

> **Note:** Always call `.use()` on a new Elysia instance to ensure proper TypeScript type inference. Avoid storing the app instance before applying the plugin.

### Options

```ts
env(schema, {
  source: { ... },           // Custom env source (default: process.env)
  prefix: 'APP_',           // Only load vars with prefix
  onError: 'exit',          // 'exit' | 'warn' | 'silent' | function
  onSuccess: (env) => {}    // Called after validation
})
```

### Type Conversion

```ts
// process.env = { PORT: "3000", ENABLED: "true" }
env({
  PORT: t.Number(), // "3000" → 3000
  ENABLED: t.Boolean(), // "true" → true
});
```

### Prefix Filtering

```ts
// process.env = { APP_KEY: 'secret', OTHER: 'ignored' }
env({
  KEY: t.String(), // Reads APP_KEY
}, { prefix: "APP_" });
```

## TypeBox Types

**Important:** Use TypeBox types, not Elysia HTTP types:

- ✅ `t.Number()` - for environment variables
- ❌ `t.Numeric()` - for HTTP validation only

```ts
env({
  // Strings
  API_KEY: t.String({ minLength: 10 }),
  DB_URL: t.String({ format: "uri" }),

  // Numbers
  PORT: t.Number({ default: 3000 }),

  // Booleans
  CACHE: t.Boolean({ default: true }),

  // Enums
  NODE_ENV: t.Enum({ dev: "dev", prod: "prod" }),

  // Optional
  REDIS_URL: t.Optional(t.String()),
});
```

## API

### `env<T>(variables, options?)`

**Parameters:**

- `variables` - TypeBox schema properties
- `options` - Optional configuration

**Returns:** Elysia plugin with validated `env` in context

**Alias:** `createEnv` available for explicit naming

## Troubleshooting

### TypeScript Error: "Property 'env' does not exist"

If you see this error in your route handlers:

```
Property 'env' does not exist on type '{ body: unknown; query: ...'
```

**Solution:** Make sure you're using `.use()` to apply the plugin:

```ts
// ❌ Wrong - creates app before plugin
const app = new Elysia();
const envPlugin = env({ PORT: t.Number() });
app.use(envPlugin);
app.get("/", ({ env }) => env.PORT); // TypeScript error!

// ✅ Correct - use plugin inline or on new instance
const app = new Elysia().use(env({
  PORT: t.Number()
}));
app.get("/", ({ env }) => env.PORT); // Works!

// ✅ Also correct - store plugin, then use on new instance
const envPlugin = env({ PORT: t.Number() });
const app = new Elysia().use(envPlugin);
app.get("/", ({ env }) => env.PORT); // Works!
```

### Using t.Enum for String Unions

TypeBox doesn't have the same `t.Enum()` API as Elysia. Use `t.Union()` with `t.Literal()`:

```ts
// ❌ Wrong
NODE_ENV: t.Enum({ development: "development", production: "production" })

// ✅ Correct
NODE_ENV: t.Union([
  t.Literal("development"),
  t.Literal("production")
], { default: "development" })
```

## License

MIT © [maxifjaved](https://www.npmjs.com/~maxifjaved)
