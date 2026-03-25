# Test Plan: Google Cloud Vision OCR Adapter

## Overview

The `GoogleVisionOcrEngine` adapter sits between the domain's `OcrEngine` port and the
Google Cloud Vision API. Testing has three layers:

| Layer | Speed | Real API? | Run in CI? |
|-------|-------|-----------|-----------|
| Adapter unit tests (stubbed SDK) | < 1 s | No | Yes (always) |
| Contract smoke tests (real API) | ~2–5 s each | Yes | Optional |
| End-to-end integration (full stack) | ~5–10 s | Yes | On demand |

This document covers all three layers.

---

## Layer 1: Adapter Unit Tests (Stubbed)

### Location

`tests/unit/adapters/google-vision-ocr-engine.test.ts`

### How they work

The `@google-cloud/vision` `ImageAnnotatorClient` is injected via the constructor so tests
can pass a stub without any network calls. No Google credentials are needed.

```typescript
// Injecting a stub — no real SDK or credentials required
const stubClient = {
  documentTextDetection: vi.fn().mockResolvedValue([fakeResponse])
};
const engine = new GoogleVisionOcrEngine({ client: stubClient });
```

### What to set up (human tasks)

Nothing. These tests run with `npm test` out of the box. No credentials, no environment
variables, no external services.

### Test cases mapped to acceptance criteria

#### AC1 — Extract Devanagari text from a clear image

```
Stub returns: fullTextAnnotation.text = "सत्यमेव जयते", pages[0].confidence = 0.96
Assert: result.text === "सत्यमेव जयते"
Assert: result.confidence === 0.96
```

#### AC2 — Language hints are passed to the Vision API

```
Call extractText with options { languageHints: ["hi", "sa"] }
Assert: stubClient.documentTextDetection was called with
        imageContext.languageHints === ["hi", "sa"]
```

#### AC3 — Detected language is returned

```
Stub returns: textAnnotations[0].locale = "sa"
Assert: result.language === "sa"
```

#### AC4 — No text detected

```
Stub returns: fullTextAnnotation = null (or empty text)
Assert: result.text === ""
Assert: result.confidence === 0.0
```

#### AC5 — Mixed script — full output returned without filtering

```
Stub returns: fullTextAnnotation.text = "Hello योग", pages[0].confidence = 0.91
Assert: result.text === "Hello योग"
Assert: result.confidence === 0.91
```

#### AC6 — Confidence normalised to 0.0–1.0

```
Stub returns: pages[0].confidence = 95  (hypothetical percentage value)
Assert: result.confidence >= 0.0 && result.confidence <= 1.0
```

#### AC7 — Authentication failure → OcrAuthenticationError

```
Stub throws: gRPC error { code: 16 }  (UNAUTHENTICATED)
Assert: throws OcrAuthenticationError
Assert: error.message contains "credentials"
Assert: error.cause is the original gRPC error
```

#### AC8 — Rate limit → OcrRateLimitError

```
Stub throws: gRPC error { code: 8 }  (RESOURCE_EXHAUSTED)
Assert: throws OcrRateLimitError
Assert: error.message contains "rate limit"
```

#### AC9 — Service unavailable → OcrServiceUnavailableError

```
Stub throws: gRPC error { code: 14 }  (UNAVAILABLE)
Assert: throws OcrServiceUnavailableError
Assert: error.message contains "temporarily unavailable"
```

#### AC10 — Invalid image → OcrInvalidImageError

```
Stub throws: gRPC error { code: 3 }  (INVALID_ARGUMENT)
Assert: throws OcrInvalidImageError
Assert: error.message describes the rejection
```

#### AC11 — Unexpected error → OcrError (base class)

```
Stub throws: gRPC error { code: 999 }  (unknown)
Assert: throws OcrError (not a subclass)
Assert: error.cause is the original error
```

### Running the tests

```bash
npm test                          # all tests
npx vitest run tests/unit         # unit tests only
npx vitest run tests/unit --reporter=verbose  # with individual test names
```

---

## Layer 2: Contract Smoke Tests (Real Google Cloud Vision API)

These tests call the actual Vision API with small real images to confirm that the adapter's
request/response mapping is correct against the live service.

### Location

`tests/contract/google-vision-ocr-engine.contract.test.ts`

### What you need to set up (human tasks)

**Step 1 — Create a Google Cloud project and enable Vision API**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. Enable the **Cloud Vision API** for that project
4. Navigate to **IAM & Admin → Service Accounts**
5. Create a service account with the **Cloud Vision API User** role
6. Generate a JSON key and download it

**Step 2 — Provide credentials to the test environment**

Place the key in a location outside the repository (never commit credentials):

```
~/.config/gcloud/sanskrit-student-vision-key.json
```

Then set the environment variable (add to your shell profile or a `.env.test.local` file
that is git-ignored):

```bash
export GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/sanskrit-student-vision-key.json
```

Alternatively use Application Default Credentials:

```bash
gcloud auth application-default login
# No GOOGLE_CLOUD_VISION_KEY_FILE needed — ADC is picked up automatically
```

**Step 3 — Provide test image files**

Place these files in `tests/fixtures/images/` (git-ignored for binary files, or stored with
Git LFS):

| File | Content | Used for |
|------|---------|----------|
| `clear-devanagari.png` | Clear printed Devanagari text | AC1, AC2, AC3 |
| `no-text.png` | Blank or non-text image | AC4 |
| `mixed-script.png` | Both Latin and Devanagari text | AC5 |

You can use the existing files in the repository root as starting points:
- `devanagari-test-input.png`
- `devanagari-complex-text.png`

### How tests skip gracefully when credentials are absent

```typescript
const keyFile = process.env.GOOGLE_CLOUD_VISION_KEY_FILE;
const skip = !keyFile && !process.env.GOOGLE_APPLICATION_CREDENTIALS;

describe.skipIf(skip)('Contract: Google Cloud Vision OCR Engine', () => {
  // ...
});
```

Tests that require real credentials are skipped automatically in CI unless the environment
variable is explicitly set.

### Running the contract tests

```bash
# With key file
GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
  npx vitest run tests/contract

# With ADC (after gcloud auth application-default login)
npx vitest run tests/contract
```

### Testing error conditions with the real API

Some error scenarios cannot be triggered by sending a bad image — they require specific API
conditions (rate limit, auth failure). Approach for each:

| Error | How to trigger in contract tests |
|-------|----------------------------------|
| `OcrAuthenticationError` | Instantiate the adapter with a deliberately invalid key object `{ credentials: { client_email: 'bad@bad.com', private_key: 'notakey' } }` and call `extractText` |
| `OcrRateLimitError` | Hard to trigger reliably; keep as stub-only test (AC8) |
| `OcrServiceUnavailableError` | Hard to trigger reliably; keep as stub-only test (AC9) |
| `OcrInvalidImageError` | Pass a 1-byte buffer `Buffer.from([0x00])` — Vision rejects it as invalid image content |

---

## Layer 3: End-to-End Integration

Exercises the full stack: image upload → GraphQL mutation → `GoogleVisionOcrEngine` →
translation response.

### Location

`tests/integration/ocr-translation-google-vision.integration.test.ts`

### What you need to set up

Same credentials as Layer 2 plus a running server (or use the in-process test server from
`tests/helpers/test-server.ts` wired with `GoogleVisionOcrEngine` instead of the mock).

### Running

```bash
GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
  npx vitest run tests/integration
```

---

## CI Configuration

### Always-on (no secrets required)

```yaml
# .github/workflows/ci.yml (or Vercel build settings)
- run: npm test   # runs all tests; contract/integration skip automatically
```

### Optional: nightly contract run with real API

```yaml
# .github/workflows/contract.yml
on:
  schedule:
    - cron: '0 2 * * *'   # 2 AM UTC nightly
  workflow_dispatch:        # manual trigger

jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx vitest run tests/contract
        env:
          GOOGLE_CLOUD_VISION_CREDENTIALS: ${{ secrets.GOOGLE_CLOUD_VISION_CREDENTIALS }}
```

To use a JSON key in GitHub Actions without writing it to disk:

```typescript
// In the test setup file
if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
  const creds = JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS);
  // pass creds object directly to GoogleVisionOcrEngine({ credentials: creds })
}
```

Add the JSON key content as a GitHub repository secret named
`GOOGLE_CLOUD_VISION_CREDENTIALS`.

---

## Summary: What You Need to Set Up

| Task | Required for | One-time? |
|------|-------------|-----------|
| `npm test` to pass | Nothing — works immediately | — |
| Contract tests | Google Cloud project + Vision API enabled | Yes |
| Contract tests | Service account JSON key file | Yes |
| Contract tests | Set `GOOGLE_CLOUD_VISION_KEY_FILE` env var | Yes (per machine) |
| Contract tests | Test images in `tests/fixtures/images/` | Yes |
| CI contract tests | GitHub secret `GOOGLE_CLOUD_VISION_CREDENTIALS` | Yes (once per repo) |

The Layer 1 unit tests cover every acceptance criterion and run anywhere with `npm test`.
Layers 2 and 3 are additive confidence; they are optional for day-to-day development.
