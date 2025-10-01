import type { TObject, TProperties, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Elysia, t } from "elysia";

/**
 * Options for environment variable validation.
 *
 * @template T - TypeBox schema properties type
 */
export type EnvOptions<T extends TProperties> = {
  /**
   * Custom environment variables source to use instead of process.env.
   * Useful for testing, secret managers, or custom configuration sources.
   *
   * @example
   * ```ts
   * // Using custom source for testing
   * createEnv(schema, {
   *   source: { API_KEY: 'test-key', PORT: '3000' }
   * })
   * ```
   *
   * @example
   * ```ts
   * // Combining multiple sources
   * createEnv(schema, {
   *   source: { ...process.env, ...await getSecrets() }
   * })
   * ```
   *
   * @default process.env
   */
  source?: Record<string, unknown>;

  /**
   * Only load environment variables with this prefix.
   * The prefix will be stripped from variable names in the validated output.
   *
   * Useful for monorepos or when multiple apps share the same environment.
   *
   * @example
   * ```ts
   * // With process.env = { APP_API_KEY: 'abc', APP_PORT: '3000', OTHER: 'xyz' }
   * createEnv(
   *   t.Object({ API_KEY: t.String(), PORT: t.Numeric() }),
   *   { prefix: 'APP_' }
   * )
   * // Results in: { API_KEY: 'abc', PORT: 3000 }
   * ```
   */
  prefix?: string;

  /**
   * Defines how to handle validation errors.
   *
   * - `'exit'`: Log error and exit process with code 1 (default, recommended for production)
   * - `'warn'`: Log warning and continue execution (useful for development)
   * - `'silent'`: Continue without logging (use with custom onError handler)
   * - `function`: Custom error handler receiving error details
   *
   * @example
   * ```ts
   * createEnv(schema, {
   *   onError: (errors) => {
   *     logToSentry(errors);
   *     throw new Error('Invalid environment configuration');
   *   }
   * })
   * ```
   *
   * @default 'exit'
   */
  onError?:
    | "exit"
    | "warn"
    | "silent"
    | ((errors: Record<string, string>) => void);

  /**
   * Callback executed after successful validation.
   * Useful for logging, analytics, or additional processing.
   *
   * @example
   * ```ts
   * createEnv(schema, {
   *   onSuccess: (env) => {
   *     console.log(`✅ Loaded config for ${env.APP_NAME}`);
   *   }
   * })
   * ```
   */
  onSuccess?: (env: Static<TObject<T>>) => void;
};

/**
 * Validates environment variables - feels native to Elysia.
 *
 * @template T - TypeBox schema properties
 * @param variables - Schema properties (not wrapped in t.Object)
 * @param options - Optional configuration
 * @returns Elysia plugin with validated env
 *
 * @example
 * Clean and simple - just like Elysia:
 * ```ts
 * import { Elysia, t } from 'elysia'
 * import { env } from '@maxifjaved/elysia-env'
 *
 * new Elysia()
 *   .use(env({
 *     PORT: t.Numeric({ default: 3000 }),
 *     API_KEY: t.String({ minLength: 10 })
 *   }))
 *   .get('/', ({ env }) => env.PORT) // Fully typed!
 *   .listen(3000)
 * ```
 */
export function env<T extends TProperties>(
  variables: T,
  options: EnvOptions<T> = {},
) {
  const schema = t.Object(variables);
  const {
    source = process.env,
    prefix,
    onError = "exit",
    onSuccess,
  } = options;

  // Apply prefix filtering if specified
  let processedSource = source;
  if (prefix) {
    processedSource = Object.entries(source).reduce(
      (acc, [key, value]) => {
        if (key.startsWith(prefix)) {
          const newKey = key.substring(prefix.length);
          acc[newKey] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  // Apply transformations using Value.Parse (like @yolk-oss/elysia-env)
  // Order: Clean → Default → Decode → Convert
  const processed = Value.Parse(
    ['Clean', 'Default', 'Decode', 'Convert'],
    schema,
    processedSource,
  );

  // Validate against schema
  if (!Value.Check(schema, processed)) {
    const errors = [...Value.Errors(schema, processed)].reduce(
      (acc, e) => {
        const path = e.path.substring(1) || "root";
        acc[path] = e.message;
        return acc;
      },
      {} as Record<string, string>,
    );

    if (typeof onError === "function") {
      onError(errors);
    } else {
      const errorMessage = Object.entries(errors)
        .map(([key, msg]) => `  - ${key}: ${msg}`)
        .join("\n");

      switch (onError) {
        case "exit":
          console.error(`❌ Invalid environment variables:\n${errorMessage}`);
          process.exit(1);
        case "warn":
          console.warn(`⚠️  Invalid environment variables:\n${errorMessage}`);
          break;
        case "silent":
          break;
      }
    }
  } else {
    // Call success callback if validation passed
    onSuccess?.(processed as Static<TObject<T>>);
  }

  return new Elysia({ name: "env" }).decorate(
    "env",
    processed as Static<typeof schema>,
  );
}

// Keep createEnv as alias for those who prefer explicit naming
export const createEnv = env;
