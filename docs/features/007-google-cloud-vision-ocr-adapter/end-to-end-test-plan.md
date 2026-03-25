# End-to-End Test Plan: Google Cloud Vision OCR Adapter

These tests verify that the real `GoogleVisionOcrEngine` works correctly against
the live Google Cloud Vision API. They are intentionally small in scope — covering
only the key scenarios that cannot be verified with stubs.

---

## Test suite separation

E2E tests and regular tests are completely independent suites:

| Command | Files run | Credentials required |
|---|---|---|
| `npm test` | `tests/**/*.test.ts` | No — always uses MockOcrEngine |
| `npm run test:e2e` | `tests/e2e/**/*.e2e.ts` | Yes — uses real Vision API |

`npm test` will never load or execute e2e files, regardless of whether
credentials are present in the environment. The mock OCR engine is hardwired
into the regular test suite.

---

## Prerequisites

### Credentials

**Step 1 — Get a service account key**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project and enable the **Cloud Vision API**
3. Navigate to **IAM & Admin → Service Accounts**
4. Create a service account, grant it the **Cloud Vision API User** role, generate
   a JSON key, and download it

**Step 2 — Set the environment variable**

`GOOGLE_CLOUD_VISION_CREDENTIALS` must contain the full JSON content of the
service account key (not a file path).

For local development, create a `.env` file in the project root (already
gitignored — never commit this):

```
GOOGLE_CLOUD_VISION_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

The e2e tests load this automatically via `dotenv`.

For GitHub Actions, add the same JSON string as a repository secret named
`GOOGLE_CLOUD_VISION_CREDENTIALS` (see CI configuration below).

### Image fixtures

Place these files in `tests/fixtures/images/`. The project root already has
suitable source images:

| Fixture file | Source | What it should show |
|---|---|---|
| `clear-devanagari.png` | Copy `devanagari-test-input.png` | Printed Devanagari text, clean background |
| `no-text.png` | Any blank image | No readable text at all |
| `invalid.bin` | `echo "notanimage" > invalid.bin` | Corrupt/non-image bytes |

---

## Test file

```
tests/e2e/google-vision-ocr-engine.e2e.ts
```

Reads `GOOGLE_CLOUD_VISION_CREDENTIALS`, parses it as JSON, and passes it to
`GoogleVisionOcrEngine` as the `credentials` option:

```typescript
import 'dotenv/config';
import { GoogleVisionOcrEngine } from '../../src/adapters/google-vision-ocr-engine';

const credentials = JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS!);
const engine = new GoogleVisionOcrEngine({ credentials });
```

If `GOOGLE_CLOUD_VISION_CREDENTIALS` is missing, the test file throws at load
time with a clear message. This is intentional — `npm run test:e2e` is always
a deliberate act that requires credentials to be configured.

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

**Setup:** Construct a separate engine instance with deliberately bad credentials:
```typescript
const badEngine = new GoogleVisionOcrEngine({
  credentials: { client_email: 'bad@fake.iam', private_key: 'not-a-key' }
});
```

**Steps:**
1. Call `badEngine.extractText(Buffer.from('any'))`

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
| Language hints wiring (AC2) | Requires inspecting the API request, not the response; verified in adapter tests |
| Detected language field (AC3) | Not yet implemented; verify on `OcrResult.language` once AC3 is complete |
| Confidence normalisation (AC6) | Covered by TC1 range assertion; edge-case input requires a stub |

The three untestable error paths are verified in the TDD acceptance tests using
a stubbed Vision client. See `high-level-design.md` cycles 8, 9, 11.

---

## Running the tests

```bash
# Regular test suite — never uses real credentials, always uses MockOcrEngine
npm test

# E2E suite — requires GOOGLE_CLOUD_VISION_CREDENTIALS in .env or environment
npm run test:e2e
```

---

## CI configuration

Add a GitHub Actions workflow that runs on demand or on a schedule. The
service account JSON is stored as a repository secret.

```yaml
# .github/workflows/e2e-vision.yml
name: E2E — Google Cloud Vision

on:
  workflow_dispatch:       # run manually from the Actions tab
  schedule:
    - cron: '0 2 * * *'   # optional: nightly at 02:00 UTC

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:e2e
        env:
          GOOGLE_CLOUD_VISION_CREDENTIALS: ${{ secrets.GOOGLE_CLOUD_VISION_CREDENTIALS }}
```

**To add the secret:**
1. Go to the repository on GitHub → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `GOOGLE_CLOUD_VISION_CREDENTIALS`
4. Value: paste the full contents of the service account JSON file
