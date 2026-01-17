# Test Design: Sanskrit Translation Service

## Overview

This document describes the testing strategy for both local development and verifying deployed environments. Tests use a **mock LLM by default** to ensure fast, deterministic, cost-free testing.

## Core Principle: Mock by Default

All acceptance tests run against a mock LLM implementation that returns stubbed responses. This provides:

- **Fast execution** - No network calls, tests complete in milliseconds
- **Deterministic results** - Same input always produces same output
- **No API costs** - No Anthropic API calls during testing
- **No API key required** - Developers can run tests immediately
- **CI-friendly** - Tests can run on every commit without rate limits or costs

Real LLM integration is tested manually or via optional integration tests.

## Architecture for Testability

The system uses dependency injection to swap LLM implementations:

```
┌─────────────────────────────────────────────────────┐
│              TranslationService                      │
│                 (interface)                          │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│ MockTranslation │       │ LlmTranslation  │
│    Service      │       │    Service      │
│  (for tests)    │       │ (for production)│
└─────────────────┘       └─────────────────┘
```

The test server injects `MockTranslationService`, while production uses `LlmTranslationService`.

## Test Categories

### 1. Acceptance Tests (Primary)

Acceptance tests verify the GraphQL API contract using the mock LLM.

**Location:** `tests/acceptance/`

**What they test:**
- GraphQL query structure and response format
- Word-by-word breakdown contains required fields
- Grammatical forms and meanings are present
- Error handling for invalid input

**Execution:** Fast, no external dependencies.

### 2. Integration Tests (Optional, Manual)

Integration tests verify the real LLM produces valid responses.

**Location:** `tests/integration/`

**When to run:**
- Before major releases
- When changing LLM prompts
- When upgrading Anthropic SDK

**Execution:** Requires `ANTHROPIC_API_KEY`, incurs API costs.

### 3. Unit Tests (As Needed)

Unit tests for complex logic that benefits from isolation.

**Location:** `tests/unit/`

**When to use:**
- Complex parsing or transformation logic
- Error handling edge cases

## Mock LLM Implementation

### Stubbed Responses

The mock returns pre-defined responses for known test sutras:

```typescript
// tests/mocks/mock-translation-service.ts

const stubbedResponses: Record<string, TranslationResult> = {
  'atha yogānuśāsanam': {
    originalText: 'atha yogānuśāsanam',
    words: [
      {
        word: 'atha',
        grammaticalForm: 'indeclinable particle',
        meanings: ['now', 'thus', 'hence']
      },
      {
        word: 'yogānuśāsanam',
        grammaticalForm: 'nominative singular neuter compound',
        meanings: ['instruction on yoga', 'teaching of yoga']
      }
    ]
  }
  // Additional stubbed sutras...
};
```

### Handling Unknown Input

For sutras not in the stub list, the mock returns a generic valid response structure. This allows testing with arbitrary input while maintaining response format consistency.

## Local Testing

### Prerequisites

1. **Node.js** (v18 or later)
2. No API key required for standard tests

### Environment Setup

```bash
# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests (uses mock LLM)
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/acceptance/word-translation.test.ts
```

### Running Integration Tests (Optional)

```bash
# Set API key for real LLM tests
export ANTHROPIC_API_KEY="your-api-key-here"

# Run integration tests
npm run test:integration
```

## Testing Deployed Service

### Smoke Tests

After deployment, verify the service is operational with quick checks.

**Manual verification using curl:**

```bash
curl -X POST https://your-app.vercel.app/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { translateSutra(sutra: \"atha yogānuśāsanam\") { originalText words { word grammaticalForm meanings } } }"
  }'
```

### Health Check Endpoint

The deployed service exposes a health check:

```
GET /health
```

Returns `200 OK` with `{"status": "healthy"}` when operational.

## Test Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Only for integration tests | API key for Claude |
| `GRAPHQL_ENDPOINT` | No | Override endpoint for deployed testing |

### vitest.config.ts

- Node environment
- Test files in `tests/**/*.test.ts`
- Excludes `tests/integration/` from default test run

## Standard Test Data

### Test Sutras with Stubbed Responses

| Sutra | Source | Mock Response Summary |
|-------|--------|----------------------|
| `atha yogānuśāsanam` | Yoga Sutras 1.1 | 2 words: atha (particle), yogānuśāsanam (compound) |
| `yogaś citta-vṛtti-nirodhaḥ` | Yoga Sutras 1.2 | 4 words with sandhi handling |
| `tadā draṣṭuḥ svarūpe 'vasthānam` | Yoga Sutras 1.3 | 4 words |

### Adding New Test Cases

1. Add the sutra and expected response to `tests/mocks/stubbed-responses.ts`
2. Write the acceptance test using that sutra
3. The mock will return the stubbed response

## CI/CD

### Default Pipeline

```yaml
- npm install
- npm test          # Runs acceptance tests with mock (fast, free)
- npm run build     # Type check and build
```

### Optional: Periodic Integration Tests

Run integration tests on a schedule (e.g., weekly) or before releases:

```yaml
# Scheduled job with API key secret
- npm run test:integration
```
