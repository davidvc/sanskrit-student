# Test Design: Backend Error Logging

## Testing Strategy

The contract under test is the `Logger` port: given a GraphQL operation that
fails, the logger receives calls with the right level, error type, stack trace,
and context. We do **not** test Pino internals or stdout formatting — those are
implementation details that can change freely.

### The Boundary

The `Logger` interface is the seam. Tests inject a `SpyLogger` (a test double
that records every call) and assert on the recorded data. The full GraphQL
stack runs as normal — `createServer`, resolvers, domain services, and adapters
all execute — so the tests exercise the real code path, not a stub.

If we later swap Pino for another library, these tests do not change.

---

## Test Infrastructure

### `SpyLogger`

A thin implementation of the `Logger` port that records every call:

```typescript
// tests/helpers/spy-logger.ts

import { Logger } from '../../src/domain/logger';

export interface ErrorCall {
  msg: string;
  error: unknown;
  context?: Record<string, unknown>;
}

export class SpyLogger implements Logger {
  readonly errorCalls: ErrorCall[] = [];
  readonly warnCalls: Array<{ msg: string; context?: Record<string, unknown> }> = [];

  debug(_msg: string): void {}
  info(_msg: string): void {}

  warn(msg: string, context?: Record<string, unknown>): void {
    this.warnCalls.push({ msg, context });
  }

  error(msg: string, error?: unknown, context?: Record<string, unknown>): void {
    this.errorCalls.push({ msg, error, context });
  }

  get lastError(): ErrorCall | undefined {
    return this.errorCalls.at(-1);
  }
}
```

### `createTestServer` extension

`TestServerOptions` gains an optional `logger` field. When omitted, a fresh
`SpyLogger` is created and returned alongside `mocks`:

```typescript
// tests/helpers/test-server.ts (additions)

export interface TestServer {
  executeQuery<T>(options: QueryOptions): Promise<GraphQLResponse<T>>;
  mocks: TestMocks;
  spyLogger: SpyLogger;   // ← new
}
```

This lets every test access the spy without extra setup.

---

## Test Cases

### AC-1: Resolver errors are logged with stack trace and path

**Scenario:** A domain error thrown during a resolver is captured by the logger.

**Setup:** Configure `MockOcrEngine` to throw an `OcrAuthenticationError`.
Execute the `translateSutraFromImage` mutation.

**Assertions:**
- `spyLogger.errorCalls` has exactly one entry
- `lastError.error` is (or wraps) an `OcrAuthenticationError` instance
- The error has a non-empty `.stack` string
- `lastError.context.path` equals `"translateSutraFromImage"`

---

### AC-2: Nested cause chains are preserved

**Scenario:** An `OcrAuthenticationError` wraps a lower-level gRPC error via
`cause`. Both ends of the chain appear in the logged error.

**Setup:** Configure `MockOcrEngine` to throw:
```typescript
new OcrAuthenticationError('auth failed', {
  cause: new Error('getting metadata from plugin failed')
});
```

**Assertions:**
- `lastError.error` has a `.cause` that is an `Error`
- `lastError.error.cause.message` equals `"getting metadata from plugin failed"`
- `lastError.error.cause.stack` is a non-empty string

*(The logger receives the live error object — cause preservation is a property
of the error construction, verified here end-to-end.)*

---

### AC-3: Successful operations produce no error log entries

**Scenario:** A happy-path translation produces no error-level noise.

**Setup:** Configure mocks for a successful OCR → translation flow.
Execute the mutation and receive a valid result.

**Assertion:**
- `spyLogger.errorCalls` is empty

---

### AC-4 & AC-5: Unhandled rejection / uncaught exception — process-level logging

These are process-event scenarios that run outside the GraphQL request cycle.
They are verified by an integration smoke test in `src/index.ts`:

- A manual test (or a startup integration test with a forked process) confirms
  that `logger.error` is called before `process.exit(1)`.
- Because forking a child process adds fragility, these two ACs are covered by
  a **code-review check** rather than an automated test: reviewers confirm that
  `process.on('uncaughtException')` and `process.on('unhandledRejection')`
  handlers call `logger.error` and `process.exit(1)`.

---

## What We Are Not Testing

| Topic | Reason |
|-------|--------|
| Pino JSON format in production | Pino's own test suite covers serialisation |
| `pino-pretty` dev output | Visual formatting, not behaviour |
| Log level filtering | Pino configuration detail, not our contract |
| stdout bytes | Too brittle; format can change without breaking the contract |

---

## Folder Layout

```
tests/
  acceptance/
    error-logging/
      ac1-resolver-error-logged.test.ts
      ac2-cause-chain-preserved.test.ts
      ac3-success-no-error-log.test.ts
  helpers/
    spy-logger.ts          ← new
    test-server.ts         ← extend with SpyLogger support
```
