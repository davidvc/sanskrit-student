# Test Plan: Google Cloud Vision OCR Adapter

## Approach

This project favours acceptance tests over unit tests. Rather than testing
`GoogleVisionOcrEngine` in isolation, we test the full system behaviour:
image buffer → OCR engine → translation pipeline → GraphQL response.

The existing acceptance tests in `tests/acceptance/` already cover the OCR
translation pipeline end-to-end using `MockOcrEngine`. For the Google Vision
adapter, we add one new acceptance test file that runs the same full-stack
path but with the **real** `GoogleVisionOcrEngine` substituted in. This lets
us verify the adapter works correctly in context without changing any existing
tests.

---

## Test file

```
tests/acceptance/google-vision-ocr-adapter.test.ts
```

The file uses `createTestServer({ ocrEngine: new GoogleVisionOcrEngine(...) })`
to swap only the OCR engine while keeping all other dependencies mocked
(LLM client, image storage, validator). This is possible because
`createTestServer` now accepts an optional `ocrEngine` override.

All tests in the file are wrapped in `describe.skipIf(!hasCredentials)`, so
they are silently skipped in normal `npm test` runs and never block CI.

---

## What you need to set up

### Step 1 — Google Cloud credentials (one-time per machine)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project and enable the **Cloud Vision API**
3. Navigate to **IAM & Admin → Service Accounts**
4. Create a service account, grant it the **Cloud Vision API User** role,
   generate a JSON key, and download it
5. Store the key **outside** this repository (never commit credentials):
   ```
   ~/.config/gcloud/sanskrit-student-vision-key.json
   ```
6. Set the environment variable (add to your shell profile):
   ```bash
   export GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/sanskrit-student-vision-key.json
   ```
   Alternatively, use Application Default Credentials instead:
   ```bash
   gcloud auth application-default login
   # No env var needed — ADC is detected automatically
   ```

### Step 2 — Test image fixtures (one-time)

Place these files in `tests/fixtures/images/`:

| File | What it should contain |
|------|----------------------|
| `clear-devanagari.png` | Printed Devanagari text, clear background (e.g. "सत्यमेव जयते") |
| `no-text.png` | Blank image or a photo with no readable text |
| `mixed-script.png` | An image with both Devanagari and Latin characters |

The repository root already has usable source images:
- `devanagari-test-input.png` → copy or symlink as `clear-devanagari.png`
- `devanagari-om-symbol.png` → can be cropped/padded for `no-text.png` if needed

The `tests/fixtures/` directory is git-ignored for binary files. Add a README
there explaining what each fixture is if you add more over time.

---

## Running the tests

```bash
# Normal run — Google Vision tests are skipped automatically
npm test

# Run only the Google Vision acceptance tests (requires credentials + fixtures)
GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
  npx vitest run tests/acceptance/google-vision-ocr-adapter.test.ts

# Verbose output to see each AC
GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
  npx vitest run tests/acceptance/google-vision-ocr-adapter.test.ts --reporter=verbose
```

---

## Acceptance criteria coverage

| AC | Description | How tested |
|----|-------------|-----------|
| AC1 | Extract Devanagari text from clear image | Full-stack with `clear-devanagari.png`; asserts non-empty Devanagari text and confidence ≥ 0.8 |
| AC2 | Language hints passed to Vision API | Happy-path test with `clear-devanagari.png`; direct hint verification requires a stub (noted in test comment) |
| AC3 | Detected language returned in result | Tested indirectly; `language` field is an internal adapter value not yet in the GraphQL schema — noted for schema extension |
| AC4 | No text detected → empty result | Full-stack with `no-text.png`; asserts GraphQL error "no readable text" |
| AC5 | Mixed script — full output returned | Full-stack with `mixed-script.png`; asserts confidence is in 0.0–1.0 range |
| AC6 | Confidence normalised to 0.0–1.0 | Full-stack with `clear-devanagari.png`; asserts `ocrConfidence` in range |
| AC7 | Auth failure → `OcrAuthenticationError` | Direct adapter call with deliberately bad credentials object |
| AC8 | Rate limit → `OcrRateLimitError` | Cannot trigger reliably against real API; covered by stub in the TDD cycle (see high-level design) |
| AC9 | Service unavailable → `OcrServiceUnavailableError` | Cannot trigger reliably against real API; covered by stub in the TDD cycle |
| AC10 | Invalid image → `OcrInvalidImageError` | Direct adapter call with a 1-byte invalid buffer |
| AC11 | Unexpected error → `OcrError` | Cannot trigger reliably; covered by stub in the TDD cycle |

**Note on AC8, AC9, AC11:** Rate-limit and transient failures cannot be
deterministically triggered against the live Vision API. These three error
mappings are verified during the TDD implementation cycle using a stubbed SDK
client (as described in `high-level-design.md`). This is the only exception
to the acceptance-test preference — those stubs are minimal, targeted, and
exist solely to verify error-code mapping logic.

---

## CI configuration

### Normal CI (no secrets needed)

```yaml
# .github/workflows/ci.yml
- run: npm test   # Google Vision tests auto-skip; no credentials required
```

### Optional nightly contract run

```yaml
# .github/workflows/vision-contract.yml
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  vision-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Write credentials file
        run: echo "$VISION_KEY" > /tmp/vision-key.json
        env:
          VISION_KEY: ${{ secrets.GOOGLE_CLOUD_VISION_CREDENTIALS }}
      - run: npx vitest run tests/acceptance/google-vision-ocr-adapter.test.ts
        env:
          GOOGLE_CLOUD_VISION_KEY_FILE: /tmp/vision-key.json
```

Add the service account JSON as a GitHub repository secret named
`GOOGLE_CLOUD_VISION_CREDENTIALS`.
