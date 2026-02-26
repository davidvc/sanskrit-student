# Handoff to DELIVER Wave: OCR Translation Feature

**From:** nw-acceptance-designer (Quinn) - DISTILL Wave
**To:** nw-software-crafter - DELIVER Wave
**Date:** 2026-02-25
**Status:** ✅ READY FOR IMPLEMENTATION

---

## Executive Summary

The acceptance test suite for the OCR Translation feature is complete and ready for implementation. This handoff includes:

- ✅ 13 backend acceptance scenarios (65% of total 20 AC)
- ✅ 1 walking skeleton (user-centric, demonstrable)
- ✅ 7 UI scenarios documented (35%, deferred to UI framework selection)
- ✅ Mandate compliance validated (CM-A/B/C)
- ✅ Peer review approved (6 dimensions)

**Implementation Approach:** Outside-In TDD with one acceptance test enabled at a time.

---

## What's Been Completed (DISTILL Wave)

### Phase 1: Context Understanding ✅

**Analyzed:**
- DISCUSS wave outputs (JTBD, journey design, 20 acceptance criteria)
- DESIGN wave outputs (high-level architecture, component boundaries)
- Existing test infrastructure (Vitest, MockOcrEngine, InMemoryImageStorage)

**Key Findings:**
- Primary persona: Spiritual practitioner who CANNOT read Devanagari (OCR is essential)
- Critical jobs: Access sacred teachings (Opp Score: 18/20), Trust the extraction (18/20)
- Architecture: Hexagonal with driving port = GraphQL API `translateSutraFromImage`
- Confidence thresholds: High ≥90%, Medium 70-89%, Low <70%, Reject <10%

### Phase 2: Scenario Design ✅

**Created:**
- 1 walking skeleton scenario (AC-6: Clear Devanagari extraction)
- 12 focused scenarios organized into 4 milestones
- 7 UI scenarios documented for future implementation

**Organization:**
- Milestone 1: Basic Extraction (4 scenarios)
- Milestone 2: Confidence Handling (2 scenarios)
- Milestone 3: Error Handling (3 scenarios)
- Milestone 4: Word Translations (3 scenarios)

**Coverage:**
- Happy path: 62% (8/13 scenarios)
- Error path: 38% (5/13 scenarios) - Close to 40% target

### Phase 3: Test Infrastructure ✅

**Implemented:**
```
tests/acceptance/ocr-translation/
├── walking-skeleton.test.ts           # AC-6 (PASSING ✅)
├── milestone-1-basic-extraction.test.ts   # AC-6, AC-10, AC-18, AC-19
├── milestone-2-confidence-handling.test.ts # AC-7, AC-9
├── milestone-3-error-handling.test.ts     # AC-15, AC-16, AC-20
└── milestone-4-word-translations.test.ts  # AC-11, AC-12, AC-13
```

**Test Execution:**
```bash
npm test tests/acceptance/ocr-translation/walking-skeleton.test.ts
# ✅ 1 test passing (8ms)
```

**Skip Strategy:**
- Walking skeleton: ✅ ENABLED (currently passing)
- All other tests: Tagged with `it.skip()` for one-at-a-time implementation

### Phase 4: Validation ✅

**Peer Review:** ✅ APPROVED (all 6 dimensions)
- Correctness: ✅ Tests validate user outcomes
- Maintainability: ✅ Business language, no jargon
- Readability: ✅ User-centric, demo-able
- Coverage: ✅ 38% error paths (target 40%)
- Performance: ✅ < 2 seconds full suite
- Isolation: ✅ Independent, parallelizable

**Mandate Compliance:**
- CM-A (Hexagonal Boundary): ✅ GraphQL driving port only
- CM-B (Business Language): ✅ Zero technical jargon
- CM-C (Walking Skeleton + Counts): ✅ 1 skeleton + 12 focused = 13 total

**Definition of Done:** ✅ All criteria met

---

## What Needs to Be Done (DELIVER Wave)

### Your Mission

Implement the OCR translation feature using Outside-In TDD with the following workflow:

1. **Enable ONE acceptance test** (remove `it.skip()` from one scenario)
2. **Run test → Watch it FAIL** (RED)
3. **Write minimal production code → Make it PASS** (GREEN)
4. **Refactor** while keeping tests green
5. **Run `/ocr-review`** for automated code review
6. **Address feedback** from review
7. **Commit** with message format: `AC-X: [description]`
8. **Repeat** for next test

### Implementation Order (One at a Time)

**Start here:**

#### 1️⃣ Walking Skeleton (AC-6) - **ALREADY PASSING** ✅

```bash
npm test tests/acceptance/ocr-translation/walking-skeleton.test.ts
# Status: ✅ PASSING (implementation already exists)
```

This proves the infrastructure is ready. Now proceed with focused scenarios.

#### 2️⃣ Milestone 1: Basic Extraction

Enable tests in `milestone-1-basic-extraction.test.ts` one at a time:

**2.1. AC-10: IAST Transliteration**
```typescript
it.skip('should convert Devanagari to IAST transliteration', ...)
// Remove .skip, run test, implement
```

**2.2. AC-18: Reject Extremely Low Confidence**
```typescript
it.skip('should reject image with extremely low confidence', ...)
// Remove .skip, run test, implement
```

**2.3. AC-19: Multi-Line Sutras**
```typescript
it.skip('should handle multi-line sutras with preserved structure', ...)
// Remove .skip, run test, implement
```

#### 3️⃣ Milestone 2: Confidence Handling

Enable tests in `milestone-2-confidence-handling.test.ts`:

**3.1. AC-7: High Confidence Badge Data**
```typescript
it.skip('should return high confidence data for clear images', ...)
```

**3.2. AC-9: Low Confidence Warning**
```typescript
it.skip('should warn when image quality affects accuracy', ...)
```

#### 4️⃣ Milestone 3: Error Handling

Enable tests in `milestone-3-error-handling.test.ts`:

**4.1. AC-15: File Too Large**
```typescript
it.skip('should reject oversized image with actionable guidance', ...)
```

**4.2. AC-16: Unsupported Format**
```typescript
it.skip('should reject unsupported file format with format list', ...)
```

**4.3. AC-20: Ephemeral Lifecycle (2 tests)**
```typescript
it.skip('should delete uploaded image after processing', ...)
it.skip('should delete uploaded image even on processing errors', ...)
```

#### 5️⃣ Milestone 4: Word Translations

Enable tests in `milestone-4-word-translations.test.ts`:

**5.1. AC-11: Word-by-Word Breakdown**
```typescript
it.skip('should provide word-by-word breakdown with meanings', ...)
```

**5.2. AC-12: Primary Translation**
```typescript
it.skip('should provide primary translation', ...)
```

**5.3. AC-13: Alternative Translations**
```typescript
it.skip('should provide alternative translations for interpretative variety', ...)
```

---

## Architecture Context

### Hexagonal Architecture (Review)

```
┌─────────────────────────────────────────────────────────────┐
│ Driving Adapters (Entry Points)                            │
│ ┌──────────────┐  ┌──────────────┐                        │
│ │ GraphQL API  │  │ CLI          │                        │
│ │ (PRIMARY)    │  │ (Secondary)  │                        │
│ └──────┬───────┘  └──────┬───────┘                        │
│        │                 │                                 │
│        └────────┬────────┘                                 │
│                 ▼                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Application Layer (Driving Ports)                   │   │
│ │ - translateSutraFromImage (GraphQL mutation)        │   │
│ └─────────────────────────────────────────────────────┘   │
│                 │                                           │
│                 ▼                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Domain Layer (Business Logic)                       │   │
│ │ - OcrTranslationService (orchestrator)              │   │
│ │ - ImageValidator                                    │   │
│ │ - ScriptNormalizer (existing)                       │   │
│ │ - TranslationService (existing)                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                 │                                           │
│                 ▼                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Driven Ports (Interfaces)                           │   │
│ │ - OcrEngine (interface)                             │   │
│ │ - ImageStorageStrategy (interface)                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                 │                                           │
│                 ▼                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Driven Adapters (External Dependencies)             │   │
│ │ - MockOcrEngine (testing)                           │   │
│ │ - GoogleVisionOcrAdapter (production - TODO)        │   │
│ │ - InMemoryImageStorage (testing/simple)             │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Your Implementation Scope

**What You'll Implement:**

1. **GraphQL Mutation** (if not done):
   ```graphql
   type Mutation {
     translateSutraFromImage(image: Upload!): OcrTranslationResult!
   }

   type OcrTranslationResult {
     extractedText: String!
     iastText: [String!]!
     words: [WordBreakdown!]!
     alternativeTranslations: [String!]
     ocrConfidence: Float!
     ocrWarnings: [String!]
   }
   ```

2. **OcrTranslationService** (orchestrator):
   - Validate image (format, size)
   - Store image temporarily
   - Call OcrEngine.extractText()
   - Call ScriptNormalizer.normalize()
   - Call TranslationService.translate()
   - Clean up image (finally block)
   - Return OcrTranslationResult

3. **Image Validation Logic**:
   - Check file size ≤ 5 MB (AC-15)
   - Check format in [PNG, JPG, WEBP, TIFF] (AC-16)
   - Verify magic bytes (security)

4. **Confidence Handling**:
   - High: ≥ 90% → No warnings
   - Medium: 70-89% → Optional warning
   - Low: < 70% → Warning message (AC-9)
   - Reject: < 10% → Error "No readable text detected" (AC-18)

5. **Ephemeral Lifecycle** (AC-20):
   ```typescript
   async translateFromImage(upload: Upload): Promise<OcrTranslationResult> {
     let imageId: string | undefined;
     try {
       imageId = await this.imageStorage.store(upload);
       const imageBuffer = await this.imageStorage.retrieve(imageId);
       // ... OCR and translation ...
       return result;
     } finally {
       if (imageId) {
         await this.imageStorage.delete(imageId); // Always cleanup
       }
     }
   }
   ```

**What Already Exists (Reuse):**
- ✅ MockOcrEngine (returns text based on filename)
- ✅ InMemoryImageStorage
- ✅ ScriptNormalizer (Devanagari → IAST)
- ✅ TranslationService (word breakdown, translations)
- ✅ Test infrastructure (Vitest, helpers)

---

## Test Execution Guide

### Run Individual Tests

```bash
# Walking skeleton (already passing)
npm test tests/acceptance/ocr-translation/walking-skeleton.test.ts

# Milestone 1: Basic extraction
npm test tests/acceptance/ocr-translation/milestone-1-basic-extraction.test.ts

# Milestone 2: Confidence handling
npm test tests/acceptance/ocr-translation/milestone-2-confidence-handling.test.ts

# Milestone 3: Error handling
npm test tests/acceptance/ocr-translation/milestone-3-error-handling.test.ts

# Milestone 4: Word translations
npm test tests/acceptance/ocr-translation/milestone-4-word-translations.test.ts

# All OCR tests
npm test tests/acceptance/ocr-translation/
```

### Enable One Test at a Time

**Before:**
```typescript
it.skip('should convert Devanagari to IAST transliteration', async () => {
  // Test implementation
});
```

**After (to enable):**
```typescript
it('should convert Devanagari to IAST transliteration', async () => {
  // Test implementation
});
```

### Watch Mode (Recommended)

```bash
npm test tests/acceptance/ocr-translation/milestone-1-basic-extraction.test.ts -- --watch
```

This gives you instant feedback as you implement.

---

## RED-GREEN-REFACTOR Example

### Example: Implementing AC-10 (IAST Transliteration)

**Step 1: Enable Test (Remove `.skip`)**

```typescript
// File: milestone-1-basic-extraction.test.ts
it('should convert Devanagari to IAST transliteration', async () => {
  const imageFile = { ... };
  const response = await server.executeQuery(...);
  expect(result.iastText).toEqual(['satyameva jayate']); // ❌ WILL FAIL
});
```

**Step 2: Run Test → RED**

```bash
npm test milestone-1-basic-extraction.test.ts
# FAIL: expected undefined to equal ['satyameva jayate']
```

**Step 3: Implement Minimal Code → GREEN**

```typescript
// File: src/services/OcrTranslationService.ts
async translateFromImage(upload: Upload): Promise<OcrTranslationResult> {
  const ocrResult = await this.ocrEngine.extractText(imageBuffer);

  // NEW: Call ScriptNormalizer
  const iastLines = await this.scriptNormalizer.normalize(ocrResult.text);

  return {
    extractedText: ocrResult.text,
    iastText: iastLines, // ✅ NOW RETURNS ARRAY
    // ...
  };
}
```

**Step 4: Run Test → GREEN**

```bash
npm test milestone-1-basic-extraction.test.ts
# ✅ PASS: 1 test passed
```

**Step 5: Refactor (If Needed)**

- Extract normalization logic to helper method
- Add error handling
- Improve variable names

**Step 6: Run `/ocr-review`**

```bash
# Review provides feedback on:
# - Code quality
# - SOLID principles
# - Hexagonal architecture compliance
# - Test coverage
```

**Step 7: Commit**

```bash
git add .
git commit -m "AC-10: Convert Devanagari to IAST transliteration

- Add ScriptNormalizer integration to OcrTranslationService
- Return iastText as array of strings (one per line)
- Test verifies IAST output matches expected transliteration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step 8: Repeat for Next Test**

Enable AC-18, run RED-GREEN-REFACTOR cycle again.

---

## Key Constraints

### DO

✅ **Enable ONE test at a time** (prevents testing theater)
✅ **Run test before implementing** (verify it fails for the right reason)
✅ **Write minimal code** to make test pass (no gold-plating)
✅ **Refactor after green** (clean up while test protects you)
✅ **Commit after each passing test** (small, atomic commits)
✅ **Use `/ocr-review`** after each implementation (catch issues early)
✅ **Exercise driving port only** (GraphQL mutation, not internal services)
✅ **Use real internal services** (OcrTranslationService, ScriptNormalizer, etc.)
✅ **Mock only external dependencies** (MockOcrEngine for Google Vision API)

### DON'T

❌ **Don't enable multiple tests** before first one passes
❌ **Don't skip the RED step** (verify test can fail)
❌ **Don't write production code** before enabling a test
❌ **Don't directly invoke internal services** in tests (use GraphQL mutation)
❌ **Don't write unit tests** unless explicitly requested
❌ **Don't gold-plate** (implement only what the test requires)
❌ **Don't skip `/ocr-review`** (feedback is valuable)
❌ **Don't forget cleanup** (AC-20: images must be deleted)

---

## Confidence Thresholds (Critical for AC-7, AC-9, AC-18)

```typescript
// Confidence score interpretation
const confidence = ocrResult.confidence;

if (confidence < 0.1) {
  // AC-18: Reject (no readable text)
  throw new Error('No readable text detected. Please retake with clearer image of Devanagari text.');
}

if (confidence < 0.7) {
  // AC-9: Low confidence warning
  warnings.push('Low OCR confidence - please verify extracted text');
  // But still proceed with translation
}

// AC-7: High confidence (≥ 90%)
// No warnings, proceed normally
```

**MockOcrEngine Behavior:**
- `satyameva-jayate.png` → confidence: 0.96 (high)
- `low-quality-noisy-om.png` → confidence: 0.65 (low, with warning)
- `no-devanagari-english-only.png` → confidence: 0.05 (reject)

---

## Expected Deliverables (End of DELIVER Wave)

1. ✅ All 13 acceptance tests passing (walking skeleton + 12 focused)
2. ✅ Production code committed (OcrTranslationService, validation, etc.)
3. ✅ `/ocr-review` feedback addressed for each test
4. ✅ GraphQL mutation `translateSutraFromImage` working E2E
5. ✅ Image lifecycle tested (AC-20: cleanup guaranteed)
6. ✅ Error messages actionable (AC-15, AC-16, AC-18, AC-9)
7. ✅ Confidence handling implemented (AC-7, AC-9, AC-18)

---

## Questions?

### Q: What if a test is unclear?

**A:** Refer back to:
- `docs/requirements/ocr-acceptance-criteria.md` (original AC definition)
- `docs/ux/ocr-translation/journey-camera.feature` (user journey context)
- Test comments (Given-When-Then in code)

### Q: What if I need to modify the test?

**A:** Tests represent acceptance criteria. If you truly need to change a test:
1. Document why in a comment
2. Consult with product owner (ensure AC still met)
3. Update test-scenarios.md to reflect change

### Q: What about UI tests (AC-1 to AC-5, AC-8, AC-14, AC-17)?

**A:** Deferred. See `docs/features/003-ocr-translation/distill/ui-tests-deferred.md`. These will be implemented after:
- UI framework selected (React Native vs Expo)
- Camera API integrated
- Backend API fully working

### Q: Can I add unit tests?

**A:** Not unless explicitly needed. Acceptance tests provide sufficient coverage through the driving port. Unit tests create maintenance burden without added value in this case.

---

## Success Criteria

**You're done when:**

- [x] All 13 acceptance tests passing ✅
- [x] `/ocr-review` feedback addressed for all tests ✅
- [x] Code follows hexagonal architecture (ports/adapters) ✅
- [x] Image lifecycle verified (cleanup guaranteed) ✅
- [x] Error messages are actionable and user-friendly ✅
- [x] Confidence handling matches thresholds (90%, 70%, 10%) ✅
- [x] Feature is demo-able to stakeholders ✅

---

## File Manifest

### Test Files (Your Guide)

```
tests/acceptance/ocr-translation/
├── walking-skeleton.test.ts               # START HERE ✅
├── milestone-1-basic-extraction.test.ts   # THEN THIS
├── milestone-2-confidence-handling.test.ts
├── milestone-3-error-handling.test.ts
└── milestone-4-word-translations.test.ts
```

### Documentation (Reference)

```
docs/features/003-ocr-translation/distill/
├── HANDOFF-TO-DELIVER.md          # THIS FILE
├── acceptance-review.md           # Peer review results
├── test-scenarios.md              # Scenario details
├── walking-skeleton.md            # Walking skeleton design
├── mandate-compliance.md          # CM-A/B/C evidence
└── ui-tests-deferred.md           # Future UI tests
```

### Source Files (To Implement)

```
src/
├── graphql/
│   └── resolvers/
│       └── ocr-mutation.ts        # translateSutraFromImage resolver
├── services/
│   └── OcrTranslationService.ts   # Orchestrator (main implementation)
├── domain/
│   ├── ports/
│   │   ├── OcrEngine.ts           # Interface (already exists)
│   │   └── ImageStorageStrategy.ts # Interface (already exists)
│   └── validators/
│       └── ImageValidator.ts      # Format/size validation
└── adapters/
    ├── MockOcrEngine.ts           # Test adapter (already exists)
    └── InMemoryImageStorage.ts    # Simple adapter (already exists)
```

---

## Good Luck!

You have everything you need to implement this feature using Outside-In TDD. The walking skeleton is already passing, proving the infrastructure is ready.

**Remember:**
- One test at a time
- RED → GREEN → REFACTOR
- Commit after each passing test
- Use `/ocr-review` for feedback
- Focus on user outcomes, not internal mechanisms

**You got this!** 🚀

---

**Handoff Date:** 2026-02-25
**From:** Quinn (nw-acceptance-designer)
**To:** nw-software-crafter
**Status:** ✅ APPROVED - Ready for implementation
