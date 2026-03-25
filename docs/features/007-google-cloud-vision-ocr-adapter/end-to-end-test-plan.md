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

#### Local development — Application Default Credentials (ADC)

Service account key files are a security risk and are not used for local
development. Instead, authenticate once with your Google account:

```bash
gcloud auth application-default login
```

This writes short-lived credentials to
`~/.config/gcloud/application_default_credentials.json`. The
`@google-cloud/vision` library finds that file automatically — no environment
variable, no key file, and no code changes required. The e2e tests call
`new GoogleVisionOcrEngine()` with no credentials argument, so ADC is used
transparently.

You must have access to a Google Cloud project with the **Cloud Vision API
enabled**. Run this once to set the quota project:

```bash
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

#### CI — Workload Identity Federation (recommended)

Avoid storing long-lived service account keys as CI secrets. Instead, use
**Workload Identity Federation** to allow GitHub Actions to authenticate as a
service account without a key file. Setup is a one-time task in Google Cloud
Console — see the CI configuration section below for details.

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

Creates `GoogleVisionOcrEngine` with no credentials argument. The
`@google-cloud/vision` library resolves credentials automatically via ADC
(locally) or the environment configured by the CI workflow:

```typescript
import { GoogleVisionOcrEngine } from '../../src/adapters/google-vision-ocr-engine';

const engine = new GoogleVisionOcrEngine();
```

No `dotenv` import is needed — there is no credentials env var to load.

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

### TC4 — Invalid image buffer returns empty result

**Why:** Verifies the adapter handles unrecognised binary content without
throwing. The live Vision API treats arbitrary bytes leniently — it returns
no annotations rather than rejecting the request with INVALID_ARGUMENT.
The `OcrInvalidImageError` mapping for gRPC INVALID_ARGUMENT is verified in
the adapter tests using a stubbed client.

**Setup:** `invalid.bin` loaded as a Buffer (non-image bytes).

**Steps:**
1. Call `engine.extractText(invalidBuffer)`

**Assertions:**
- Does not throw
- `result.text` is `''`
- `result.confidence` is `0.0`

---

## What is NOT covered here

| Scenario | Why excluded |
|---|---|
| Rate limit (`OcrRateLimitError`) | Cannot trigger deterministically against live API |
| Service unavailable (`OcrServiceUnavailableError`) | Cannot trigger deterministically |
| Unexpected error (`OcrError` fallback) | Cannot trigger deterministically |
| `OcrInvalidImageError` for corrupt payload | Live API returns empty result rather than INVALID_ARGUMENT for arbitrary bytes; covered by adapter tests with stub |
| Language hints wiring (AC2) | Requires inspecting the API request, not the response; verified in adapter tests |
| Detected language field (AC3) | Not yet implemented; verify on `OcrResult.language` once AC3 is complete |
| Confidence normalisation (AC6) | Covered by TC1 range assertion; edge-case input requires a stub |

The three untestable error paths are verified in the TDD acceptance tests using
a stubbed Vision client. See `high-level-design.md` cycles 8, 9, 11.

---

## Running the tests

```bash
# One-time setup — authenticate with your Google account
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# Regular test suite — never touches real credentials, always uses MockOcrEngine
npm test

# E2E suite — uses ADC credentials set up above
npm run test:e2e
```

---

## CI configuration

Use **Workload Identity Federation** so GitHub Actions can authenticate as a
service account without a long-lived key file. This is a one-time setup in
Google Cloud.

**Step 1 — Create a Workload Identity Pool and Provider (run once):**

```bash
# Create the pool
gcloud iam workload-identity-pools create "github-actions" \
  --project="YOUR_PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions"

# Create the OIDC provider pointing at GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="YOUR_PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

**Step 2 — Create a service account and grant it Vision API access:**

```bash
gcloud iam service-accounts create vision-e2e \
  --project="YOUR_PROJECT_ID" \
  --display-name="Vision E2E Tests"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vision-e2e@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudvision.user"
```

**Step 3 — Allow GitHub Actions to impersonate the service account:**

```bash
gcloud iam service-accounts add-iam-policy-binding \
  vision-e2e@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --project="YOUR_PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO"
```

**Step 4 — GitHub Actions workflow:**

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
    permissions:
      id-token: write   # required for Workload Identity Federation
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github-provider
          service_account: vision-e2e@YOUR_PROJECT_ID.iam.gserviceaccount.com
      - run: npm ci
      - run: npm run test:e2e
```

The `google-github-actions/auth` step sets `GOOGLE_APPLICATION_CREDENTIALS` in
the environment, which the Vision library picks up automatically — no secrets
stored in GitHub.
