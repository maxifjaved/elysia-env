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

```ts
const envPlugin = env({
  PORT: t.Number({ default: 3000 }),
});

app.use(envPlugin);

// Access validated values before .listen()
const port = (envPlugin.decorator as any).env.PORT;
app.listen(port);
```

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

## License

MIT © [maxifjaved](https://www.npmjs.com/~maxifjaved)
