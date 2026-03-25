# High-Level Design: Google Cloud Vision OCR Adapter

## Architecture Overview

The `GoogleVisionOcrEngine` adapter integrates Google Cloud Vision into the existing hexagonal
architecture by implementing the `OcrEngine` port defined in `src/domain/ocr-engine.ts`.

```
┌────────────────────────────────────────────────────────────┐
│                        Domain Layer                        │
│                                                            │
│   OcrEngine (port interface)  ←  OcrTranslationService    │
│         ▲                                                  │
└─────────┼──────────────────────────────────────────────────┘
          │ implements
┌─────────┼──────────────────────────────────────────────────┐
│         │          Adapters Layer                          │
│                                                            │
│   GoogleVisionOcrEngine  ──→  Google Cloud Vision SDK      │
│   (new adapter)               (@google-cloud/vision)       │
│                                                            │
│   MockOcrEngine  (existing, for testing)                   │
└────────────────────────────────────────────────────────────┘
```

The adapter follows the same pattern established by `ClaudeLlmClient`:
- Constructor accepts credentials/options
- Delegates to vendor SDK
- Maps vendor responses to domain types
- Maps vendor errors to domain error types

## Key Components

### `GoogleVisionOcrEngine` (new file: `src/adapters/google-vision-ocr-engine.ts`)

Implements the `OcrEngine` port. Responsibilities:
- Initialise Google Cloud Vision `ImageAnnotatorClient` with credentials
- Map `OcrOptions.languageHints` to Vision API `imageContext`
- Call `documentTextDetection` (better for dense text than `textDetection`)
- Extract text and confidence from `fullTextAnnotation`
- Normalise confidence to `[0.0, 1.0]` (Vision returns values already in this range, but the
  adapter should clamp/validate defensively)
- Map detected locale from the first text annotation to `OcrResult.language`
- Translate vendor errors to domain error types

### Domain Error Types (new file: `src/domain/ocr-errors.ts`)

Hierarchy to keep the domain insulated from vendor error codes:

```
OcrError
├── OcrAuthenticationError    (UNAUTHENTICATED / invalid credentials)
├── OcrRateLimitError         (RESOURCE_EXHAUSTED / 429)
├── OcrServiceUnavailableError (UNAVAILABLE / 503)
└── OcrInvalidImageError      (INVALID_ARGUMENT for image payload)
```

All extend `OcrError`, which extends `Error`. Each carries the original cause via
`{ cause }` constructor option (Node 16.9+ standard).

## Data Flow

```
caller
  │
  ▼
GoogleVisionOcrEngine.extractText(imageBuffer, options?)
  │
  ├─ build ImageAnnotatorClient request
  │    ├─ image: { content: imageBuffer.toString('base64') }
  │    └─ imageContext: { languageHints: options?.languageHints ?? [] }
  │
  ├─ call client.documentTextDetection(request)
  │
  ├─ on success
  │    ├─ extract fullTextAnnotation.text  → OcrResult.text
  │    ├─ extract pages[0].confidence      → OcrResult.confidence (clamped 0-1)
  │    └─ extract textAnnotations[0].locale → OcrResult.language
  │
  └─ on error
       └─ map gRPC/HTTP status code → domain OcrError subclass
```

Empty response (no text found): return `{ text: '', confidence: 0.0 }`.

## API Changes

No changes to existing public contracts. The `OcrEngine` port is unchanged. The new adapter
and error types are additive.

The `GoogleVisionOcrEngine` constructor signature:

```typescript
interface GoogleVisionOcrEngineOptions {
  /** Path to service account key file, or explicit credentials object. */
  keyFilename?: string;
  credentials?: object;
}

constructor(options?: GoogleVisionOcrEngineOptions)
```

When no options are provided the adapter relies on Application Default Credentials (ADC),
consistent with Google Cloud SDK conventions.

## Dependencies

- `@google-cloud/vision` — official Vision API client library
- No other new runtime dependencies

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Credential management in tests | Tests stub the Vision client; no real API calls |
| Vision API confidence field location varies by response shape | Extract from `pages[0].confidence` with safe fallback to `0.0` |
| API version changes | Pin `@google-cloud/vision` version; upgrade deliberately |
| Rate limits in production | `OcrRateLimitError` surfaces to caller for retry/backoff decisions |

## References

- [ADR 0001 – Hybrid Translation Approach](../adr/0001-hybrid-translation-approach.md): The
  adapter fits the hexagonal pattern established for external integrations
- `src/domain/ocr-engine.ts` — `OcrEngine` port definition
- `src/adapters/claude-llm-client.ts` — Reference adapter showing error handling and options
  patterns to follow

---

## TDD Implementation Plan

Each acceptance criterion maps to one RED-GREEN-REFACTOR cycle.
Tests live in `tests/adapters/google-vision-ocr-engine.test.ts`.
All Vision API calls are stubbed — no network calls in tests.

### Cycle 0 — Error types (foundation)

Create `src/domain/ocr-errors.ts` with the four error classes.
No test of its own; these are verified implicitly by cycles 7-11.
(Run existing tests after to confirm nothing breaks.)

### Cycle 1 — Extract Devanagari text from a clear image

**RED:** Test stubs Vision client to return `"सत्यमेव जयते"` with confidence `0.96`.
Asserts `result.text === "सत्यमेव जयते"` and `result.confidence === 0.96`.

**GREEN:** Implement `GoogleVisionOcrEngine.extractText`:
- Build request, call stubbed client
- Map `fullTextAnnotation.text` and `pages[0].confidence` to result

**REFACTOR:** Extract private helpers `buildRequest` and `mapResponse`.

### Cycle 2 — Language hints are passed to the Vision API

**RED:** Test verifies the stub was called with `imageContext.languageHints: ["hi", "sa"]`
when `options.languageHints` contains those values.

**GREEN:** Pass `options?.languageHints ?? []` into `imageContext` in `buildRequest`.

**REFACTOR:** Ensure `buildRequest` is clean and readable.

### Cycle 3 — Detected language is returned in the result

**RED:** Stub returns `textAnnotations[0].locale = "sa"`. Assert `result.language === "sa"`.

**GREEN:** Extract locale from first annotation in `mapResponse`.

### Cycle 4 — No text detected

**RED:** Stub returns empty `fullTextAnnotation`. Assert `result.text === ""` and
`result.confidence === 0.0`.

**GREEN:** Add null/empty guard in `mapResponse`.

### Cycle 5 — Mixed script — adapter returns full API output without filtering

**RED:** Stub returns `"Hello योग"` with confidence `0.91`. Assert both text and confidence
pass through unchanged.

**GREEN:** No filtering logic exists, so this should already pass after Cycle 1. If not,
remove any inadvertent filtering.

### Cycle 6 — Confidence normalised to 0.0–1.0

**RED:** Stub returns confidence `95` (hypothetical percentage). Assert `result.confidence`
is in `[0.0, 1.0]`.

**GREEN:** Clamp: `Math.min(1.0, Math.max(0.0, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence))`.

**REFACTOR:** Extract `normaliseConfidence` helper.

### Cycle 7 — Authentication failure → `OcrAuthenticationError`

**RED:** Stub throws gRPC error with code `UNAUTHENTICATED` (16). Assert adapter throws
`OcrAuthenticationError`.

**GREEN:** Add error-mapping in a `mapError` private method. Check gRPC status codes.

**REFACTOR:** Centralise all error mapping in `mapError`.

### Cycle 8 — Rate limit → `OcrRateLimitError`

**RED:** Stub throws `RESOURCE_EXHAUSTED` (8) / HTTP 429. Assert `OcrRateLimitError`.

**GREEN:** Add case in `mapError`.

### Cycle 9 — Service unavailable → `OcrServiceUnavailableError`

**RED:** Stub throws `UNAVAILABLE` (14) / HTTP 503. Assert `OcrServiceUnavailableError`.

**GREEN:** Add case in `mapError`.

### Cycle 10 — Invalid image → `OcrInvalidImageError`

**RED:** Stub throws `INVALID_ARGUMENT` (3) for image payload. Assert `OcrInvalidImageError`.

**GREEN:** Add case in `mapError`.

### Cycle 11 — Unexpected error → `OcrError`

**RED:** Stub throws an unrecognised error code. Assert `OcrError` is thrown and
`error.cause` is the original error.

**GREEN:** Add fallback case in `mapError` wrapping unknown errors as `OcrError`.

**REFACTOR:** Review `mapError` for clarity; ensure all paths preserve `cause`.
