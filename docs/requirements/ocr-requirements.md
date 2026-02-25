# Requirements: Camera OCR Translation

**Feature:** Enable spiritual practitioners to photograph Devanagari Sanskrit text and receive accurate translations

**Epic:** OCR Translation
**Wave:** DISCUSS (Requirements Gathering)
**Status:** Ready for DESIGN wave

---

## Functional Requirements

### FR-1: Camera Capture
**Priority:** Must Have  
**Job Traceability:** Job 1 (Access Sacred Teachings)

- **FR-1.1:** Mobile app shall provide "Take Photo" button on home screen
- **FR-1.2:** Tapping "Take Photo" shall open device camera with landscape frame overlay (70% screen width)
- **FR-1.3:** Camera view shall display guidance: "Best results: photograph 2-6 lines"
- **FR-1.4:** User shall be able to manually trigger shutter button to capture photo
- **FR-1.5:** System shall support photographing Devanagari text containing 2-6 lines (typical sutra length)

### FR-2: Photo Preview & Confirmation
**Priority:** Must Have  
**Job Traceability:** Job 2 (Trust the Extraction), Job 4 (Error Recovery)

- **FR-2.1:** After capture, system shall display photo preview
- **FR-2.2:** Preview shall show prompt: "Is the text clear and in focus?"
- **FR-2.3:** Preview shall provide "Use This Photo" button (primary action)
- **FR-2.4:** Preview shall provide "Retake" button (secondary action)
- **FR-2.5:** User shall be able to pinch-to-zoom on preview to verify focus quality
- **FR-2.6:** Tapping "Retake" shall return to camera view without losing session

### FR-3: Image Upload & Validation
**Priority:** Must Have  
**Job Traceability:** Job 4 (Error Recovery)

- **FR-3.1:** System shall validate image format (PNG, JPG, JPEG, WEBP, TIFF only)
- **FR-3.2:** System shall validate image size (maximum 5 MB)
- **FR-3.3:** System shall validate via magic bytes, not just MIME type (security)
- **FR-3.4:** System shall reject files exceeding 5 MB with specific error message
- **FR-3.5:** System shall reject unsupported formats with list of supported formats
- **FR-3.6:** Error messages shall be actionable (e.g., "Try cropping to just text area")

### FR-4: OCR Extraction
**Priority:** Must Have  
**Job Traceability:** Job 1 (Access Sacred Teachings)

- **FR-4.1:** System shall extract Devanagari text from uploaded image using Google Cloud Vision API
- **FR-4.2:** System shall use language hints (Hindi/Sanskrit: `hi`, `sa`) for better accuracy
- **FR-4.3:** System shall return extracted Devanagari text as UTF-8 string
- **FR-4.4:** System shall return confidence score (0.0 to 1.0) for extraction quality
- **FR-4.5:** System shall reject extractions with confidence < 0.10 (no readable text)

### FR-5: Confidence Score Display
**Priority:** Must Have  
**Job Traceability:** Job 2 (Trust the Extraction)

- **FR-5.1:** System shall display confidence score as color-coded badge:
  - Green "High Confidence (X%)" for ≥ 90%
  - Yellow "Medium Confidence (X%)" for 70-89%
  - Orange "Low Confidence (X%)" for < 70%
- **FR-5.2:** For confidence < 70%, system shall display warning message
- **FR-5.3:** Warning shall provide actionable guidance (e.g., "Retake with better lighting")
- **FR-5.4:** Low confidence path shall offer "Upload Different Image" and "See Translation Anyway" options

### FR-6: Visual Verification
**Priority:** Must Have  
**Job Traceability:** Job 2 (Trust the Extraction)

- **FR-6.1:** System shall display side-by-side comparison: original photo (thumbnail) | extracted Devanagari text
- **FR-6.2:** User shall be able to tap original photo thumbnail to expand full-screen
- **FR-6.3:** User shall be able to tap extracted Devanagari text to copy to clipboard
- **FR-6.4:** Visual comparison shall be accessible to non-Devanagari readers (pattern matching)

### FR-7: Script Normalization
**Priority:** Must Have  
**Job Traceability:** Job 1 (Access Sacred Teachings)

- **FR-7.1:** System shall convert extracted Devanagari to IAST transliteration
- **FR-7.2:** IAST output shall be ASCII-compatible (readable by users who cannot read Devanagari)
- **FR-7.3:** System shall use existing script normalizer service (no new implementation)

### FR-8: Translation Output
**Priority:** Must Have  
**Job Traceability:** Job 1 (Access Sacred Teachings)

- **FR-8.1:** System shall provide IAST transliteration with Copy button
- **FR-8.2:** System shall provide word-by-word breakdown (expandable list)
- **FR-8.3:** System shall provide primary English translation with Copy button
- **FR-8.4:** System shall provide alternative translations (collapsible section)
- **FR-8.5:** Each word in breakdown shall be tappable to expand meanings
- **FR-8.6:** System shall use existing LLM translation service (no new implementation)

### FR-9: Processing Feedback
**Priority:** Must Have  
**Job Traceability:** Job 2 (Trust the Extraction)

- **FR-9.1:** System shall display progressive status messages during processing:
  - "Uploading image..."
  - "Reading Devanagari text..."
  - "Translating..."
- **FR-9.2:** Total processing time shall be under 5 seconds for typical image
- **FR-9.3:** System shall provide visual progress indicator (spinner or progress bar)

### FR-10: Copy Functionality
**Priority:** Must Have  
**Job Traceability:** Job 1 (Access Sacred Teachings)

- **FR-10.1:** User shall be able to copy IAST text to clipboard
- **FR-10.2:** User shall be able to copy primary translation to clipboard
- **FR-10.3:** System shall display "Copied!" confirmation after copy action
- **FR-10.4:** Copied content shall be pasteable into Notes apps or study journals

---

## Non-Functional Requirements

### NFR-1: Performance
**Priority:** Must Have

- **NFR-1.1:** Photo to translation total time shall be < 5 seconds (95th percentile)
- **NFR-1.2:** Camera launch time shall be < 1 second
- **NFR-1.3:** OCR API call timeout shall be 10 seconds (user patience threshold)

### NFR-2: Usability
**Priority:** Must Have

- **NFR-2.1:** First-time users shall see lighting tip on camera launch
- **NFR-2.2:** Error messages shall be written for non-technical users (avoid jargon)
- **NFR-2.3:** Touch targets shall be minimum 44x44 points (mobile accessibility)
- **NFR-2.4:** UI shall work on screens as small as iPhone SE (375x667 points)

### NFR-3: Privacy
**Priority:** Must Have

- **NFR-3.1:** Uploaded images shall never be persisted to disk or database
- **NFR-3.2:** Images shall be processed in-memory only
- **NFR-3.3:** Images shall be deleted immediately after translation (ephemeral lifecycle)
- **NFR-3.4:** Image deletion shall occur in finally block (guaranteed cleanup even on errors)

### NFR-4: Security
**Priority:** Must Have

- **NFR-4.1:** Image validation shall check magic bytes, not just MIME type
- **NFR-4.2:** File size limit (5 MB) shall be enforced to prevent DoS
- **NFR-4.3:** Supported formats shall be restricted to image types only (no executable formats)

### NFR-5: Reliability
**Priority:** Should Have

- **NFR-5.1:** System shall handle network timeouts gracefully with retry guidance
- **NFR-5.2:** System shall handle OCR API failures with user-friendly error messages
- **NFR-5.3:** System shall handle camera permission denial with fallback guidance

---

## Out of Scope (Deferred to Future Iterations)

- ❌ Screenshot upload workflow (mobile screenshots from websites)
- ❌ Save to history / bookmarks feature
- ❌ Crop / rotate / brightness adjustment tools
- ❌ Multi-scan quick-repeat workflow
- ❌ Desktop webcam support
- ❌ Handwritten Devanagari recognition
- ❌ Manual correction of OCR errors
- ❌ Offline OCR (requires network connection)

---

## Dependencies

### External Services
- Google Cloud Vision API (OCR extraction)
- Claude LLM API (translation, already in use)

### Existing Components (No Changes Required)
- Script Normalizer (Devanagari → IAST conversion)
- LLM Translation Service (word breakdown, translations)
- GraphQL API infrastructure

### New Components Required
- Camera UI component (mobile)
- Image upload handler
- Image validation logic
- OcrTranslationService (orchestrator)
- GoogleVisionOcrEngine (adapter)
- InMemoryImageStorage (storage strategy)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Photo to translation time | < 5 seconds | 95th percentile |
| OCR confidence score | ≥ 90% | Average across clear images |
| Error recovery rate | > 80% | Users successfully retake after failure |
| User satisfaction | High empowerment feeling | Post-translation survey |
| Repeat usage | Users return for next sutra | Session continuation rate |

---

## Acceptance Criteria Summary

Detailed acceptance criteria in: `acceptance-criteria.md`

High-level criteria:
1. ✅ User can photograph 2-6 line Devanagari sutra
2. ✅ System extracts text with ≥ 90% confidence (clear images)
3. ✅ User sees confidence badge and visual verification
4. ✅ User receives IAST, word breakdown, and translation
5. ✅ User can copy IAST and translation to notes
6. ✅ Low confidence images show actionable warnings
7. ✅ Upload failures provide specific error guidance
8. ✅ Total time < 5 seconds for happy path

---

**Traceability:**
- Every requirement traces to at least one Job Story (JTBD Phase 1)
- Every requirement maps to journey phases (Journey Design Phase 2)
- Every requirement will have acceptance tests (DISTILL wave)

**Next:** User Stories with explicit job traceability
