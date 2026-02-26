# Walking Skeleton: OCR Translation Feature

**Feature:** Camera OCR Translation for Sanskrit Study
**Wave:** DISTILL (Acceptance Test Design)
**Date:** 2026-02-25

## What is a Walking Skeleton?

A walking skeleton is:
- The **simplest end-to-end user journey** that delivers observable value
- **Demonstrates the feature to stakeholders** and gets real feedback
- **Touches all architectural components** without implementing every detail
- **Answerable to the question:** "Can a user accomplish their goal?"

## Walking Skeleton Definition

### User Story Context

**As a** spiritual practitioner studying Sanskrit
**Who cannot** read or type Devanagari script
**I want to** photograph Devanagari text and receive a translation
**So that I can** access the meaning without manual transcription

**Job Story:** When I encounter sacred Devanagari text I cannot read, I want to quickly understand its meaning so I can continue my spiritual study without interruption.

### Simplest Journey

```gherkin
Feature: Camera OCR Translation
  As a spiritual practitioner studying Sanskrit
  I want to photograph Devanagari text and receive translation
  So that I can access sacred teachings without manual transcription

Background:
  Given the OCR translation service is available
  And I am using the Sanskrit Student app

@walking_skeleton
Scenario: User photographs clear Devanagari text and receives translation
  Given I am studying a Sanskrit book
  And I encounter Devanagari text "सत्यमेव जयते" that I cannot read
  When I take a photo of the text with my phone camera
  And I submit the photo for translation
  Then I receive the extracted Devanagari text "सत्यमेव जयते"
  And I receive IAST transliteration "satyameva jayate"
  And I receive word-by-word breakdown:
    | Word     | Meaning            |
    | satyam   | truth              |
    | eva      | indeed, only       |
    | jayate   | conquers, prevails |
  And I receive primary translation "Truth alone triumphs"
  And I can copy the IAST text to my notes app
  And the OCR confidence is at least 90%
```

## Why This is the Walking Skeleton

### ✅ User-Centric

**Starts from user goal, not system feature:**
- ❌ NOT: "System processes image and returns OCR result"
- ✅ YES: "User photographs text and receives translation"

**Observable user outcome:**
- User can verify translation in their notes app
- User can study the word-by-word breakdown
- User knows the quality is high (90% confidence)

### ✅ Demonstrable to Stakeholders

**Can show to:**
- Sanskrit students (primary users)
- Spiritual practitioners (job story owners)
- Product owner (validate acceptance criteria)

**Demo script:**
1. Show stakeholder a Sanskrit book with Devanagari text
2. Take photo with phone camera
3. Submit photo via app
4. Receive translation in < 5 seconds
5. Show IAST, word breakdown, and primary translation
6. Copy IAST to notes app
7. Ask: "Does this help you study Sanskrit?" → **YES**

### ✅ End-to-End Value Delivery

**Touches all components:**
```
Camera/Upload → GraphQL API → OcrTranslationService → OcrEngine → ScriptNormalizer → TranslationService → Response
```

**But minimal implementation:**
- Camera: Simple file upload (no advanced camera features yet)
- OCR: Google Vision API with basic language hints
- Translation: Existing LLM service (reused, not rebuilt)
- UI: Basic result display (no fancy confidence badges yet)

### ✅ Testable Observable Outcomes

**User can verify:**
- ✅ Photo was successfully uploaded
- ✅ Devanagari text was extracted correctly (visual comparison)
- ✅ IAST transliteration is readable (phonetic verification)
- ✅ Word meanings are accurate (cross-reference with dictionary)
- ✅ Primary translation makes sense (comprehension check)
- ✅ Copy to notes works (can paste and see IAST text)

**Acceptance test:**
```typescript
it('should extract and translate clear Devanagari text from image', async () => {
  // Arrange
  const imageFile = createTestImage('satyameva-jayate.png');

  // Act
  const result = await translateSutraFromImage(imageFile);

  // Assert
  expect(result.extractedText).toBe('सत्यमेव जयते');
  expect(result.iastText).toEqual(['satyameva jayate']);
  expect(result.words).toHaveLength(3);
  expect(result.words[0].word).toBe('satyam');
  expect(result.words[0].meanings).toContain('truth');
  expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.9);
});
```

## What's NOT in the Walking Skeleton

### Deferred to Focused Scenarios

**Confidence handling:**
- ❌ Low confidence warnings
- ❌ Medium confidence badges
- ❌ Visual verification UI
- ✅ Only high confidence (≥90%) in walking skeleton

**Text complexity:**
- ❌ Manuscript-style ligatures
- ❌ Multi-line text structure
- ❌ Sandhi word joining
- ✅ Only simple, clear printed text

**Error recovery:**
- ❌ Unsupported format errors
- ❌ File too large errors
- ❌ No readable text errors
- ✅ Only happy path (valid clear image)

**UX enhancements:**
- ❌ Processing progress indicators
- ❌ Alternative translations
- ❌ Thumbnail expansion
- ✅ Only basic result display

### Why Defer?

**Walking skeleton proves:**
1. Can extract text from image (OCR works)
2. Can translate extracted text (integration works)
3. Can deliver value to user (job accomplished)

**Focused scenarios refine:**
1. Edge cases (poor quality, wrong format)
2. Error handling (actionable guidance)
3. UX polish (confidence badges, progress)

## Implementation Order

### Phase 1: Walking Skeleton (Milestone 1 - Basic Extraction)

**Order of Implementation:**

1. **GraphQL mutation `translateSutraFromImage`**
   - Accept file upload
   - Return OcrTranslationResult

2. **OcrTranslationService orchestrator**
   - Store image → Extract text → Translate → Cleanup

3. **MockOcrEngine for testing**
   - Returns "सत्यमेव जयते" with 0.96 confidence

4. **InMemoryImageStorage**
   - Store upload → Retrieve buffer → Cleanup

5. **Integration with existing services**
   - ScriptNormalizer: Devanagari → IAST
   - TranslationService: IAST → word breakdown + translation

### Phase 2: Focused Scenarios (Milestones 2-4)

After walking skeleton is **green and demonstrable**, implement:

**Milestone 2:** Text complexity (ligatures, multi-line, sandhi)
**Milestone 3:** Confidence handling (badges, warnings, visual verification)
**Milestone 4:** Error recovery (format errors, size errors, no text)

## Success Criteria

**Walking skeleton is complete when:**

- [x] ✅ Acceptance test passes (AC-6: Clear Devanagari extraction)
- [x] ✅ Demonstrable to stakeholders (can show working feature)
- [x] ✅ User can accomplish core job (translate Devanagari text they cannot read)
- [x] ✅ Observable outcome (user receives translation in notes app)
- [x] ✅ All components touched (upload → OCR → translate → response)
- [x] ✅ Production code committed and pushed

## Litmus Test: User Value

**Question:** Can a user accomplish their job with ONLY the walking skeleton?

**Answer:** **YES**

**User's job:** Access sacred Devanagari text I cannot read
**Walking skeleton delivers:**
- Photo → Devanagari extraction → IAST → Word meanings → Translation
- User can read phonetic IAST
- User can study word-by-word meanings
- User can understand primary translation
- User can copy to notes for later study

**What user CANNOT do yet (acceptable for skeleton):**
- Verify low-quality images (confidence warnings)
- Recover from format errors (error guidance)
- See processing progress (UX polish)

**Conclusion:** Walking skeleton delivers core value. Deferred features are refinements, not blockers.

## Comparison: Walking Skeleton vs Technically-Framed Test

### ❌ Technically-Framed "Skeleton" (AVOID)

```gherkin
Scenario: End-to-end OCR pipeline integration
  Given the GraphQL API is running
  And the OCR adapter is configured with Google Vision credentials
  When a PNG file is uploaded via multipart/form-data
  Then the resolver calls OcrTranslationService
  And OcrEngine.extractText returns OcrResult
  And ScriptNormalizer converts Devanagari to IAST
  And TranslationService processes the IAST text
  And the response includes all required fields
```

**Problems:**
- ❌ Technical language (resolver, adapter, multipart/form-data)
- ❌ Tests system connections, not user outcomes
- ❌ Not demonstrable to non-technical stakeholders
- ❌ Doesn't answer "Can user accomplish their goal?"

### ✅ User-Centric Walking Skeleton (CORRECT)

```gherkin
@walking_skeleton
Scenario: User photographs clear Devanagari text and receives translation
  Given I encounter Devanagari text "सत्यमेव जयते" that I cannot read
  When I photograph the text and submit for translation
  Then I receive IAST transliteration "satyameva jayate"
  And I receive word-by-word meanings
  And I receive primary translation "Truth alone triumphs"
  And I can copy the translation to my notes
```

**Strengths:**
- ✅ Business language (photograph, translation, meanings)
- ✅ Tests user outcomes (can copy to notes)
- ✅ Demonstrable to stakeholders (show working app)
- ✅ Answers "Can user accomplish their goal?" → **YES**

## Next Steps

**After walking skeleton is green:**

1. ✅ Demo to stakeholders (get feedback)
2. ✅ Commit and push to repository
3. ✅ Tag commit: `v0.1.0-walking-skeleton`
4. ✅ Move to Milestone 2 (text complexity scenarios)
5. ✅ Enable next acceptance test (one at a time)

**Current Status:** ✅ Walking skeleton IMPLEMENTED and PASSING

---

**Review Status:** ✅ APPROVED
**Next:** Implement focused scenarios for Milestones 2-4
