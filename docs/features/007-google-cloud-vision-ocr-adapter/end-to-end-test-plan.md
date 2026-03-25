# End-to-End Test Plan: Google Cloud Vision OCR Adapter

These tests verify that the real `GoogleVisionOcrEngine` works correctly against
the live Google Cloud Vision API. They are intentionally small in scope — covering
only the key scenarios that cannot be verified with stubs.

---

## Prerequisites

### Credentials

Set up once per machine. Either option works:

**Option A — Application Default Credentials (simplest):**
```bash
gcloud auth application-default login
```

**Option B — Service account key file:**
```bash
export GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/sanskrit-student-vision-key.json
```

Tests detect credentials automatically. If neither is set, all E2E tests are
skipped — they will never block `npm test`.

### Image fixtures

Place these files in `tests/fixtures/images/`. The project root already has
suitable source images:

| Fixture file | Source | What it should show |
|---|---|---|
| `clear-devanagari.png` | Copy `devanagari-test-input.png` | Printed Devanagari text, clean background |
| `no-text.png` | Any blank image | No readable text at all |
| `invalid.bin` | Create with `echo "notanimage" > invalid.bin` | Corrupt/non-image bytes |

---

## Test file

```
tests/e2e/google-vision-ocr-engine.e2e.ts
```

Uses `createTestServer({ ocrEngine: new GoogleVisionOcrEngine(...) })` to swap
in the real OCR engine while keeping the LLM client, image storage, and
validator mocked. All tests are wrapped in `describe.skipIf(!hasCredentials)`.

---

## Test cases

### TC1 — Extract Devanagari text from a real image (happy path)

**Why:** Core contract. Verifies the adapter is wired correctly end-to-end and
the Vision API returns usable OCR output.

**Setup:** `clear-devanagari.png` loaded as a Buffer.

**Steps:**
1. Call `engine.extractText(imageBuffer, { languageHints: ['sa', 'hi'] })`

**Assertions:**
- `result.text` is a non-empty string
- `result.text` contains at least one Devanagari character (Unicode range `\u0900–\u097F`)
- `result.confidence` is between 0.0 and 1.0 inclusive

> Does not assert exact text — OCR output varies by image quality.

---

### TC2 — No text in image returns empty result

**Why:** Verifies the adapter handles a zero-annotation response without
throwing, returning a well-defined empty result.

**Setup:** `no-text.png` loaded as a Buffer.

**Steps:**
1. Call `engine.extractText(imageBuffer)`

**Assertions:**
- Does not throw
- `result.text` is `''`
- `result.confidence` is `0.0`

---

### TC3 — Invalid credentials throw OcrAuthenticationError

**Why:** Verifies the error mapping path for authentication failure — the
single error scenario that can be deterministically triggered against the live API.

**Setup:** Construct engine with deliberately bad credentials:
```typescript
new GoogleVisionOcrEngine({
  credentials: { client_email: 'bad@fake.iam', private_key: 'not-a-key' }
})
```

**Steps:**
1. Call `engine.extractText(Buffer.from('any'))`

**Assertions:**
- Throws `OcrAuthenticationError`
- Error message references credentials or authentication

---

### TC4 — Invalid image buffer throws OcrInvalidImageError

**Why:** Verifies the error mapping path for a rejected image payload — the
other error scenario reliably triggerable without special infrastructure.

**Setup:** `invalid.bin` loaded as a Buffer (non-image bytes).

**Steps:**
1. Call `engine.extractText(invalidBuffer)`

**Assertions:**
- Throws `OcrInvalidImageError`
- Error message describes the rejection reason

---

## What is NOT covered here

| Scenario | Why excluded |
|---|---|
| Rate limit (`OcrRateLimitError`) | Cannot trigger deterministically against live API |
| Service unavailable (`OcrServiceUnavailableError`) | Cannot trigger deterministically |
| Unexpected error (`OcrError` fallback) | Cannot trigger deterministically |
| Language hints wiring (AC2) | Requires inspecting the API request, not the response; verified in adapter unit tests |
| Detected language field (AC3) | Not yet in the GraphQL schema; verify directly on `OcrResult.language` once AC3 is implemented |
| Confidence normalisation (AC6) | Covered by TC1 confidence range assertion; edge-case input requires a stub |

The three untestable error paths (rate limit, service unavailable, unexpected)
are verified in the TDD acceptance tests using a stubbed Vision client. See
`high-level-design.md` cycles 8, 9, 11.

---

## Running the tests

```bash
# Skip E2E tests (default — credentials not required)
npm test

# Run E2E tests with ADC
npx vitest run tests/e2e/google-vision-ocr-engine.e2e.ts

# Run E2E tests with key file
GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
  npx vitest run tests/e2e/google-vision-ocr-engine.e2e.ts
```
