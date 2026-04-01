# E2E UI Test Suite — Requirements

## Goal

Provide a set of end-to-end UI tests that exercise the Sanskrit Student native app from user gesture to rendered result, running against a real device or simulator. These tests complement the existing acceptance tests (which stub external dependencies) by catching integration issues that mocked tests cannot surface.

---

## Critical User Journeys

The following journeys represent the highest-value paths through the app and must be covered by the E2E suite.

### Journey 1 — Text Translation (happy path)
1. User opens app on the home screen.
2. User taps **Start Translating**.
3. User types Sanskrit text into the input field.
4. User taps **Translate**.
5. App displays a loading indicator.
6. App renders the translation result (original text, IAST transliteration, word-by-word breakdown, alternative translations).

### Journey 2 — Camera OCR Translation (happy path)
1. User opens app and taps **Photograph Text (OCR)**.
2. App requests camera permission (first run).
3. User grants permission and is presented with the live camera view.
4. User takes a photo of Devanagari text.
5. App shows a preview with crop overlay.
6. User taps **Translate**.
7. App shows processing progress (Uploading → OCR → Translating).
8. App navigates to the translate screen with populated results.

### Journey 3 — Camera OCR Translation (retake)
1. User reaches the photo preview screen.
2. User taps **Retake**.
3. App returns to the live camera view with no state carried over.

---

## Tooling Decision

### Recommendation: **Maestro**

| Criterion | Maestro | Detox | Appium |
|---|---|---|---|
| Expo compatibility | Excellent — first-class support | Good but requires native build | Good but verbose config |
| Test authoring | Simple YAML DSL | JS/TS | JS/TS or many languages |
| Setup complexity | Low | Medium-high (native build hooks) | High |
| CI integration | Simple CLI | Moderate | Moderate |
| Stability / flakiness | Low (built-in auto-waiting) | Medium | Medium |
| Community momentum | Growing rapidly | Mature | Mature but declining |

**Rationale:** The project uses Expo managed workflow. Maestro runs against the compiled app binary without requiring ejection, native build configuration, or test hooks injected into production code. Its YAML-based DSL is readable and keeps test scenarios close to natural language, aligning with our Gherkin-style acceptance criteria. Detox remains a viable fallback if Maestro proves insufficient for a specific scenario.

---

## Acceptance Criteria for the Test Suite

### Coverage
- All six user journeys listed above are covered by at least one Maestro flow.

### Execution Environment
- Tests run on iOS Simulator (iPhone 15, iOS 17) in CI.
- Tests run on Android Emulator (Pixel 6, API 33) in CI.
- A developer can run any single flow locally with one command: `maestro test <flow>.yaml`.

### CI Integration
- E2E flows execute as a separate CI job (not blocking the unit/acceptance test job).
- The CI job runs on every PR targeting `main`.
- A failed E2E job blocks merge.

### Flakiness Budget
- No flow may have an observed failure rate above 5% on a stable build over 20 consecutive CI runs.
- Any flow exceeding this threshold must be fixed or removed before the suite ships.

### Test Isolation
- Each flow starts from a known app state (fresh install or cleared storage).
- Flows do not depend on each other's side effects.

### Backend Handling
- The E2E suite runs against a local backend (started as part by the developer or by CI setup) or production. *NO STAGING ENVIRONMENT*

### Documentation
- A `README.md` in the test folder documents how to run the suite locally and in CI.

---

## Out of Scope

- History screen (marked "Coming Soon" in the app).
- Performance benchmarking (covered separately if needed).
- Accessibility / screen-reader testing (future epic).
- Visual regression / screenshot diffing (future epic).
