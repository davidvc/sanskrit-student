# Definition of Ready (DoR) Checklist: Camera OCR Translation

**Purpose:** Validate that the OCR feature is ready to move from DISCUSS wave to DESIGN wave

**Status:** ✅ READY FOR DESIGN WAVE

---

## DoR Criteria (All 8 Required)

### 1. ✅ Job Stories Documented
**Requirement:** All user jobs captured with functional, emotional, and social dimensions

**Evidence:**
- `docs/ux/ocr-translation/jtbd-job-stories.md` exists
- 4 job stories documented (3 in scope, 1 deferred):
  - Job 1: Access Sacred Teachings (Importance: 10, Opportunity: 18)
  - Job 2: Trust the Extraction (Importance: 9, Opportunity: 18)
  - Job 3: Mobile Screenshot (Deferred to future)
  - Job 4: Recover from Upload Issues (Importance: 7, Opportunity: 14)
- Each job includes functional, emotional, and social dimensions
- Each job has importance and satisfaction scores

**Validation:**  
✅ PASS - All jobs fully documented with complete JTBD analysis

---

### 2. ✅ Four Forces Mapped
**Requirement:** Push/Pull/Anxiety/Habit forces identified for each primary job

**Evidence:**
- `docs/ux/ocr-translation/jtbd-four-forces.md` exists
- Four Forces mapped for Jobs 1, 2, and 4:
  - **Push:** Cannot read Devanagari, wasting time on workarounds
  - **Pull:** Instant access, confidence in accuracy, empowerment
  - **Anxiety:** Fear of OCR errors in sacred texts, spiritual consequences
  - **Habit:** Managing without OCR, asking teachers, manual transcription
- Design implications derived from forces (reduce anxiety, overcome habit, amplify pull)

**Validation:**  
✅ PASS - All forces mapped with design implications

---

### 3. ✅ Journey Map Complete
**Requirement:** UX journey mapped with emotional arc, shared artifacts, and decision points

**Evidence:**
- `docs/ux/ocr-translation/journey-camera-visual.md` - Visual journey map with emotional arc
- `docs/ux/ocr-translation/journey-camera.yaml` - Structured journey schema
- `docs/ux/ocr-translation/journey-camera.feature` - 14 Gherkin scenarios
- 7 journey phases mapped:
  1. Encounter & Trigger
  2. Camera Launch
  3. Camera Capture
  4. Preview & Confirm
  5. Processing
  6. Trust Verification
  7. Translation & Learning
- Emotional arc: Blocked → Hopeful → Focused → Analytical → Trusting → Relieved → Empowered
- Happy path + 2 alternative paths (low confidence, upload failure)

**Validation:**  
✅ PASS - Complete journey with emotional coherence

---

### 4. ✅ Shared Artifacts Tracked
**Requirement:** All data artifacts have single source of truth documented

**Evidence:**
- `docs/ux/ocr-translation/shared-artifacts-registry.md` exists
- 7 shared artifacts documented with single sources:
  - `${originalImage}` - Source: User camera (ephemeral lifecycle)
  - `${extractedDevanagari}` - Source: Google Vision OCR
  - `${ocrConfidence}` - Source: Google Vision OCR
  - `${iastText}` - Source: Script Normalizer
  - `${wordBreakdown}` - Source: LLM Translation
  - `${translation}` - Source: LLM Translation
  - `${alternativeTranslations}` - Source: LLM Translation
- Artifact flow diagram shows dependencies
- Lifecycle (ephemeral vs session) defined for each
- No ambiguity about data sources

**Validation:**  
✅ PASS - All artifacts have single sources of truth

---

### 5. ✅ User Stories Written
**Requirement:** LeanUX user stories with clear acceptance criteria, traced to job stories

**Evidence:**
- `docs/requirements/ocr-user-stories.md` exists
- 12 user stories documented:
  - Stories 1-3: Core photography and OCR
  - Stories 4-5: Trust and error recovery
  - Stories 6-8: Translation outputs
  - Stories 9-12: UX polish and error handling
- Every story explicitly traces to a job story
- Story mapping table links stories to jobs
- MoSCoW prioritization applied (9 Must Have, 3 Should Have)

**Validation:**  
✅ PASS - All stories traced to jobs with clear priorities

---

### 6. ✅ Acceptance Criteria Testable
**Requirement:** Every story has Given-When-Then acceptance criteria

**Evidence:**
- `docs/requirements/ocr-acceptance-criteria.md` exists
- 20 acceptance criteria documented
- All criteria in Given-When-Then (Gherkin) format
- Test data specified for each criterion
- Expected outcomes defined
- Criteria trace back to user stories
- Criteria cover happy paths, alternative paths, and error cases

**Validation:**  
✅ PASS - All acceptance criteria are testable and complete

---

### 7. ✅ Functional Requirements Complete
**Requirement:** Functional and non-functional requirements documented

**Evidence:**
- `docs/requirements/ocr-requirements.md` exists
- 10 functional requirement categories (FR-1 through FR-10):
  - Camera capture, preview, validation, OCR, confidence display, verification, normalization, translation, processing feedback, copy functionality
- 5 non-functional requirement categories (NFR-1 through NFR-5):
  - Performance (< 5 seconds), usability, privacy (ephemeral images), security (magic bytes), reliability
- Out of scope items clearly documented
- Dependencies identified (Google Vision API, existing services)
- Success metrics defined

**Validation:**  
✅ PASS - Comprehensive requirements with NFRs

---

### 8. ✅ No Vague or Unresolved Steps
**Requirement:** Every journey step has clear inputs, outputs, and decision logic

**Evidence:**
- Journey YAML schema defines all steps with:
  - Clear actions
  - UI descriptions
  - Decision points with explicit options
  - Artifacts created/used at each step
  - Error paths with specific guidance
- No "TBD" or "to be determined" items
- All user decisions have defined outcomes
- All error scenarios have recovery paths

**Validation:**  
✅ PASS - No ambiguity in journey steps

---

## Additional Quality Gates

### ✅ Traceability Matrix Complete
Every artifact traces through the chain:

```
Job Stories
    ↓
User Stories
    ↓
Acceptance Criteria
    ↓
Journey Phases
    ↓
Shared Artifacts
```

**Evidence:**
- Every user story explicitly states job traceability
- Every acceptance criterion references user story
- Journey phases map to acceptance criteria
- Shared artifacts link to journey phases

**Validation:**  
✅ PASS - Full traceability chain intact

---

### ✅ No LeanUX Anti-Patterns Detected

**Checked for:**
- ❌ Speculation without evidence - NOT PRESENT (jobs based on persona research)
- ❌ Solutions disguised as problems - NOT PRESENT (jobs focus on outcomes, not features)
- ❌ Big upfront design - NOT PRESENT (MVP scope clearly defined, deferred items listed)
- ❌ Vague personas - NOT PRESENT (specific: spiritual practitioner who cannot read/type Devanagari)
- ❌ Untestable stories - NOT PRESENT (all acceptance criteria are Given-When-Then testable)

**Validation:**  
✅ PASS - No anti-patterns present

---

### ✅ Scope Boundaries Clear

**In Scope (MVP):**
- Mobile camera capture workflow
- Photo preview and quality verification
- OCR with Google Vision API
- Confidence scoring and visual verification
- IAST transliteration
- Word-by-word breakdown
- Primary and alternative translations
- Error recovery (file size, format, low confidence)

**Out of Scope (Deferred):**
- Screenshot upload workflow
- Save to history / bookmarks
- Crop / rotate / edit tools
- Multi-scan quick-repeat
- Desktop webcam support
- Handwritten Devanagari
- Offline OCR

**Validation:**  
✅ PASS - Clear boundaries prevent scope creep

---

### ✅ Dependencies Identified

**External Dependencies:**
- Google Cloud Vision API (OCR extraction)
- Claude LLM API (translation - already in use)

**Internal Dependencies:**
- Script Normalizer (existing - Devanagari → IAST)
- LLM Translation Service (existing - word breakdown, translations)
- GraphQL API infrastructure (existing)

**New Components Required:**
- Camera UI component (mobile)
- Image upload handler
- Image validation logic
- OcrTranslationService (orchestrator)
- GoogleVisionOcrEngine (adapter)
- InMemoryImageStorage (storage strategy)

**Validation:**  
✅ PASS - All dependencies documented

---

## DoR Summary

| DoR Criterion | Status | Evidence File |
|---------------|--------|---------------|
| 1. Job Stories Documented | ✅ PASS | jtbd-job-stories.md |
| 2. Four Forces Mapped | ✅ PASS | jtbd-four-forces.md |
| 3. Journey Map Complete | ✅ PASS | journey-camera-visual.md, journey-camera.yaml, journey-camera.feature |
| 4. Shared Artifacts Tracked | ✅ PASS | shared-artifacts-registry.md |
| 5. User Stories Written | ✅ PASS | ocr-user-stories.md |
| 6. Acceptance Criteria Testable | ✅ PASS | ocr-acceptance-criteria.md |
| 7. Functional Requirements Complete | ✅ PASS | ocr-requirements.md |
| 8. No Vague Steps | ✅ PASS | All journey documents |

**Overall DoR Status:** ✅ **READY FOR DESIGN WAVE**

---

## Handoff Package for DESIGN Wave

The following artifacts are ready for the solution-architect (DESIGN wave):

1. **JTBD Analysis:**
   - Job stories with opportunity scores
   - Four Forces analysis
   - Design implications

2. **Journey Design:**
   - Visual journey map with emotional arc
   - Structured YAML schema
   - Gherkin scenarios (14 scenarios)
   - Shared artifacts registry

3. **Requirements:**
   - Functional requirements (FR-1 through FR-10)
   - Non-functional requirements (NFR-1 through NFR-5)
   - User stories (12 stories, all traced to jobs)
   - Acceptance criteria (20 criteria, all testable)

4. **Quality Gates:**
   - Full traceability matrix
   - No LeanUX anti-patterns
   - Clear scope boundaries
   - Dependencies documented

**Next Step:** solution-architect creates high-level design, architecture diagrams, and technology selection based on these requirements.

---

**Signed off by:** nw-product-owner (Luna) via DISCUSS wave  
**Date:** 2026-02-24  
**Status:** ✅ APPROVED FOR HANDOFF TO DESIGN WAVE
