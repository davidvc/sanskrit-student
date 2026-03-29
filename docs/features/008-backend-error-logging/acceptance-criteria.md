# Acceptance Criteria: Backend Error Logging

## AC-1: GraphQL resolver errors are logged with full stack traces

```gherkin
Given a GraphQL mutation or query is executed
When the resolver throws a domain error (e.g. OcrAuthenticationError, TranslationError)
Then the error is logged server-side at the ERROR level
And the log entry includes the error type, message, and full stack trace
And the log entry includes the GraphQL field path where the error occurred
```

## AC-2: Nested cause chains are preserved in logs

```gherkin
Given a domain error wraps an underlying cause (e.g. OcrAuthenticationError wrapping a gRPC error)
When the error is logged
Then the log entry includes the cause chain
And each cause's message and stack trace are present in the log output
```

## AC-3: Development logs are human-readable

```gherkin
Given the server is running with NODE_ENV not set to "production"
When an error is logged
Then the log output is formatted in a human-readable, colorized format
And timestamps are displayed in a local, readable format
```

## AC-4: Production logs are structured JSON

```gherkin
Given the server is running with NODE_ENV set to "production"
When an error is logged
Then the log output is a single-line JSON object written to stdout
And the JSON includes level, timestamp, message, and serialized error fields
```

## AC-5: Unhandled promise rejections are logged before process exit

```gherkin
Given the server process is running
When an unhandled promise rejection occurs
Then the rejection reason is logged at the ERROR level with its stack trace
And the process exits with a non-zero exit code
```

## AC-6: Uncaught exceptions are logged before process exit

```gherkin
Given the server process is running
When an uncaught synchronous exception is thrown
Then the exception is logged at the ERROR level with its stack trace
And the process exits with a non-zero exit code
```

## AC-7: Non-error GraphQL responses produce no error log output

```gherkin
Given a GraphQL mutation or query is executed
When the resolver returns a successful result
Then no ERROR-level log entries are written
```
