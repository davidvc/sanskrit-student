# Implementation Plan: Word-by-Word Translation

## Goal

Make the acceptance test pass by implementing the `translateSutra` GraphQL resolver that returns word-by-word breakdowns with grammatical forms and meanings.

## Architecture Approach

Following hexagonal architecture to separate concerns. Tests use a mock implementation to avoid LLM costs and ensure fast, deterministic tests.

```
┌─────────────────────────────────────────────────────┐
│                  GraphQL Resolver                    │
│               (src/server.ts)                        │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│              TranslationService                      │
│           (port/interface)                           │
│         src/domain/translation-service.ts            │
└──────────────────────┬──────────────────────────────┘
                       │ implemented by
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│ MockTranslation │       │ LlmTranslation  │
│    Service      │       │    Service      │
│  (for tests)    │       │ (for production)│
└─────────────────┘       └─────────────────┘
```

## Implementation Steps

### Step 1: Define domain types

Create TypeScript types that represent the translation result structure. These are pure domain types with no external dependencies.

**File:** `src/domain/types.ts`

```typescript
export interface WordEntry {
  word: string;
  grammaticalForm: string;
  meanings: string[];
}

export interface TranslationResult {
  originalText: string;
  words: WordEntry[];
}
```

### Step 2: Define TranslationService interface (port)

Create an interface that defines the contract for translation services. This allows us to swap implementations (mock for testing, LLM for production).

**File:** `src/domain/translation-service.ts`

```typescript
export interface TranslationService {
  translateSutra(sutra: string): Promise<TranslationResult>;
}
```

### Step 3: Implement MockTranslationService (for tests)

Create a mock implementation that returns stubbed responses for known test sutras. This enables fast, deterministic, cost-free testing.

**File:** `tests/mocks/mock-translation-service.ts`

Key responsibilities:
- Return pre-defined responses for standard test sutras
- Return a generic valid response for unknown input
- No external dependencies

### Step 4: Wire up the GraphQL resolver

Update the server to:
- Accept a `TranslationService` via dependency injection
- Create factory functions for test and production configurations
- Call the service in the resolver

**File:** `src/server.ts` (modify existing)

### Step 5: Run acceptance test and verify it passes

Execute `npm test` and confirm the test passes with the mock implementation.

### Step 6: Implement LlmTranslationService (for production)

Create the Claude-powered implementation that:
- Sends the sutra to Claude with a structured prompt
- Parses the response into our domain types
- Handles errors gracefully

**File:** `src/adapters/llm-translation-service.ts`

Key responsibilities:
- Construct prompt that asks Claude for word-by-word breakdown
- Use structured output or JSON parsing to get reliable response format
- Map LLM response to `TranslationResult` type

## Dependencies Between Steps

```
Step 1 (types) ─────┐
                    ├──→ Step 3 (mock) ──→ Step 4 (wire up) ──→ Step 5 (verify)
Step 2 (interface) ─┘
                    │
                    └──→ Step 6 (LLM adapter) - can be done after Step 5
```

- Steps 1 and 2 have no dependencies and can be done first (in either order)
- Step 3 depends on Steps 1 and 2
- Step 4 depends on Step 3
- Step 5 depends on Step 4
- Step 6 depends on Steps 1 and 2, but can be done after tests pass with mock

## Testing Notes

- Acceptance tests use `MockTranslationService` by default
- No API key required to run tests
- Tests are fast and deterministic
- Optional integration tests can verify real LLM behavior (see test-design.md)

## Environment Requirements

- Node.js v18+
- No API key required for acceptance tests
- `ANTHROPIC_API_KEY` only needed for production deployment or integration tests
