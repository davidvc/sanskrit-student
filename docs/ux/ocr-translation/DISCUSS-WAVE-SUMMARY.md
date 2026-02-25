# DISCUSS Wave Summary: Camera OCR Translation

**Wave:** DISCUSS (Wave 2 of 6 in NorthWave methodology)  
**Agent:** nw-product-owner (Luna) + orchestrator  
**Date:** 2026-02-24  
**Status:** ✅ COMPLETE - Ready for DESIGN wave

---

## Executive Summary

Successfully completed DISCUSS wave for Camera OCR Translation feature through three integrated phases:

1. **JTBD Analysis** - Uncovered user jobs, forces driving/resisting adoption, opportunity scoring
2. **Journey Design** - Mapped complete UX flow with emotional arc, shared artifacts, and decision points
3. **Requirements Gathering** - Crafted user stories, acceptance criteria, and DoR validation

**Key Insight:** Trust mechanisms (confidence scores, visual verification) are as critical as core OCR functionality for spiritual practitioners working with sacred Sanskrit texts.

---

## Phase 1: Jobs-to-be-Done Analysis

### Primary Persona
**Spiritual practitioner/layperson** studying Sanskrit scriptures (Yoga Sutras, Bhagavad Gita) who:
- **Cannot read Devanagari script**
- **Cannot type Devanagari** (no keyboard, no knowledge)
- Uses OCR as **essential access method**, not just convenience
- Studying for spiritual practice, not academic scholarship

### Job Stories (Prioritized by Opportunity Score)

| Rank | Job | Opportunity Score | Priority |
|------|-----|-------------------|----------|
| 1 | **Access Sacred Teachings** | 18 | HIGHEST |
| 1 | **Trust the Extraction** | 18 | HIGHEST |
| 3 | **Recover from Upload Issues** | 14 | MEDIUM |
| - | Mobile Screenshot | 17 | DEFERRED (future) |

### Four Forces Insights

**Critical Anxiety to Address:**
- "What if OCR makes errors in sacred text?" - Spiritual consequences of misunderstanding
- Requires transparency: confidence scores, visual verification, actionable warnings

**Habit to Overcome:**
- Users have been managing without OCR (finding IAST online, asking teachers)
- Need 10x speed advantage + demonstrated accuracy to break habit

**Pull to Amplify:**
- Instant access to any Sanskrit text (empowerment narrative)
- Freedom from script barrier (spiritual access, not just technical tool)

### Deliverables

- `docs/ux/ocr-translation/jtbd-job-stories.md`
- `docs/ux/ocr-translation/jtbd-four-forces.md`
- `docs/ux/ocr-translation/jtbd-opportunity-scores.md`

---

## Phase 2: Journey Design

### Primary Journey
**Mobile camera workflow** for photographing 2-6 line sutras from physical books

**NOT screenshot upload** (deferred to future iteration)

### Journey Phases (7 Total)

1. **Encounter & Trigger** - User studying book, hits Devanagari passage (Blocked)
2. **Camera Launch** - Tap "Take Photo", see lighting tip (Hopeful)
3. **Camera Capture** - Frame 2-6 lines, tap shutter (Focused)
4. **Preview & Confirm** - Verify quality, choose Use/Retake (Analytical)
5. **Processing** - Upload → OCR → Translate with progress feedback (Trusting)
6. **Trust Verification** - See confidence badge + side-by-side comparison (Relieved)
7. **Translation & Learning** - Study IAST, word breakdown, translations (Empowered)

### Emotional Arc

```
Empowered ┐                                          ┌───────
          │                                     ┌────┘
  Trusting│                                ┌────┘
          │                           ┌────┘
  Neutral │                      ┌────┘
          │                 ┌────┘
  Blocked └─────────────────┘
          Encounter  Camera  Preview  Process  Verify  Translate
```

### Shared Artifacts (7 Total)

All artifacts have **single source of truth**:

- `${originalImage}` - User camera (ephemeral)
- `${extractedDevanagari}` - Google Vision OCR
- `${ocrConfidence}` - Google Vision OCR
- `${iastText}` - Script Normalizer
- `${wordBreakdown}` - LLM Translation
- `${translation}` - LLM Translation
- `${alternativeTranslations}` - LLM Translation

### Deliverables

- `docs/ux/ocr-translation/journey-camera-visual.md` - Visual map with emotional arc
- `docs/ux/ocr-translation/journey-camera.yaml` - Structured schema (147 lines)
- `docs/ux/ocr-translation/journey-camera.feature` - 14 Gherkin scenarios
- `docs/ux/ocr-translation/shared-artifacts-registry.md` - Data flow documentation

---

## Phase 3: Requirements & User Stories

### Functional Requirements (10 Categories)

1. **Camera Capture** - Mobile-only, landscape frame, 2-6 line guidance
2. **Photo Preview** - Verify quality before submitting, pinch-to-zoom
3. **Image Validation** - Format, size (5 MB max), magic bytes security
4. **OCR Extraction** - Google Vision API, Devanagari with Hindi/Sanskrit hints
5. **Confidence Display** - Color-coded badges (green/yellow/orange)
6. **Visual Verification** - Side-by-side: original photo | extracted text
7. **Script Normalization** - Devanagari → IAST (existing service)
8. **Translation Output** - IAST, word breakdown, primary + alternative translations
9. **Processing Feedback** - Progressive status messages, < 5 seconds total
10. **Copy Functionality** - Copy IAST and translation to clipboard

### Non-Functional Requirements (5 Categories)

1. **Performance** - < 5 seconds photo-to-translation (95th percentile)
2. **Usability** - First-use lighting tip, non-technical error messages, mobile-optimized
3. **Privacy** - Ephemeral images (never persisted), automatic cleanup
4. **Security** - Magic bytes validation, 5 MB limit (DoS prevention)
5. **Reliability** - Graceful error handling, clear retry guidance

### User Stories (12 Total)

Every story explicitly traces to a job story:

| Story | Job | Priority |
|-------|-----|----------|
| 1-3: Camera, Preview, OCR | Job 1 | Must Have |
| 4-5: Confidence, Low Confidence Guidance | Job 2, Job 4 | Must Have |
| 6-8: IAST, Word Breakdown, Translations | Job 1 | Must Have |
| 9: Processing Progress | Job 2 | Must Have |
| 10-11: File Size, Format Errors | Job 4 | Should Have |
| 12: First-Use Tip | Job 4 | Should Have |

### Acceptance Criteria (20 Total)

All criteria testable in Given-When-Then format:
- AC 1-5: Camera launch, capture, preview, retake, submit
- AC 6-9: OCR extraction, confidence display, visual verification, low confidence warning
- AC 10-13: IAST, word breakdown, primary translation, alternative translations
- AC 14: Processing progress feedback
- AC 15-17: Error recovery (file size, format, first-use tip)
- AC 18-20: Edge cases (extremely low confidence, multi-line sutras, ephemeral lifecycle)

### Deliverables

- `docs/requirements/ocr-requirements.md` - Functional + non-functional requirements
- `docs/requirements/ocr-user-stories.md` - 12 stories with job traceability
- `docs/requirements/ocr-acceptance-criteria.md` - 20 testable criteria
- `docs/requirements/ocr-dor-checklist.md` - Definition of Ready validation

---

## Definition of Ready (DoR) Validation

### All 8 DoR Criteria: ✅ PASS

1. ✅ Job Stories Documented (4 jobs with dimensions)
2. ✅ Four Forces Mapped (Push/Pull/Anxiety/Habit for each job)
3. ✅ Journey Map Complete (7 phases, emotional arc, 14 scenarios)
4. ✅ Shared Artifacts Tracked (7 artifacts, single sources of truth)
5. ✅ User Stories Written (12 stories, all traced to jobs)
6. ✅ Acceptance Criteria Testable (20 criteria, all Given-When-Then)
7. ✅ Functional Requirements Complete (10 FR categories, 5 NFR categories)
8. ✅ No Vague Steps (all journey steps have clear inputs/outputs/decisions)

### Additional Quality Gates

- ✅ Traceability Matrix Complete (Jobs → Stories → Criteria → Journey → Artifacts)
- ✅ No LeanUX Anti-Patterns (no speculation, no vague personas, testable stories)
- ✅ Scope Boundaries Clear (MVP vs deferred items explicitly documented)
- ✅ Dependencies Identified (Google Vision API, existing services, new components)

---

## Key Design Decisions

### 1. Camera-First, NOT Screenshot Upload
**Rationale:** Focus MVP on deliberate study workflow (photographing physical books). Screenshot upload deferred to future iteration to avoid scope creep.

### 2. 2-6 Line Guidance (Not 1-3 Lines)
**Rationale:** Typical sutras are 4 lines, some up to 6 lines. Frame and guidance optimized for complete sutras, not fragmentary text.

### 3. Mobile-Only (No Desktop Webcam)
**Rationale:** Users studying physical books naturally reach for phone. Desktop out of scope for MVP.

### 4. Trust Mechanisms Essential
**Rationale:** Spiritual practitioners have high anxiety about errors in sacred texts. Confidence scores + visual verification are core features, not polish.

### 5. Ephemeral Image Storage (Privacy-First)
**Rationale:** Images deleted immediately after translation. No persistent storage by default. Respects user privacy and reduces security surface.

### 6. Actionable Error Messages
**Rationale:** "Retake with better lighting" beats "OCR failed". Users are non-technical, need specific guidance to recover.

---

## Out of Scope (Deferred to Future)

Clear boundaries to prevent scope creep:

- ❌ Screenshot upload workflow (separate iteration)
- ❌ Save to history / bookmarks (nice-to-have, not MVP)
- ❌ Crop / rotate / edit tools (keep simple, let users retake)
- ❌ Multi-scan quick-repeat (optimization, not essential)
- ❌ Desktop webcam support (mobile-first)
- ❌ Handwritten Devanagari (complex, low ROI)
- ❌ Offline OCR (requires network for Google Vision API)

---

## Success Metrics (How We'll Know It Works)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Photo to translation time | < 5 seconds | 95th percentile timing |
| OCR confidence score | ≥ 90% | Average across clear images |
| Error recovery rate | > 80% | Users successfully retake after failure |
| User empowerment feeling | High | Post-translation satisfaction survey |
| Repeat usage | Users translate multiple sutras | Session continuation rate |

---

## Handoff to DESIGN Wave

### Ready for Solution Architect

All artifacts ready for nw-solution-architect to begin DESIGN wave:

**Inputs to DESIGN:**
1. JTBD analysis with opportunity scores
2. Journey design with emotional arc
3. Functional and non-functional requirements
4. User stories with acceptance criteria
5. Shared artifacts registry (data flow)
6. DoR validation (all gates passed)

**Expected DESIGN Outputs:**
- High-level design document
- Architecture diagrams (C4 models)
- Component specifications
- Technology selection rationale
- API contracts
- Database schema (if needed)
- Security review
- Performance analysis

---

## File Manifest

### JTBD Analysis (Phase 1)
```
docs/ux/ocr-translation/
├── jtbd-job-stories.md        (4 job stories with dimensions)
├── jtbd-four-forces.md        (Push/Pull/Anxiety/Habit analysis)
└── jtbd-opportunity-scores.md (Prioritization with scores)
```

### Journey Design (Phase 2)
```
docs/ux/ocr-translation/
├── journey-camera-visual.md         (Visual map + emotional arc)
├── journey-camera.yaml              (Structured schema, 147 lines)
├── journey-camera.feature           (14 Gherkin scenarios)
└── shared-artifacts-registry.md     (7 artifacts, single sources)
```

### Requirements (Phase 3)
```
docs/requirements/
├── ocr-requirements.md           (Functional + non-functional requirements)
├── ocr-user-stories.md           (12 stories with job traceability)
├── ocr-acceptance-criteria.md    (20 testable criteria)
└── ocr-dor-checklist.md          (DoR validation, ✅ PASS)
```

### Summary
```
docs/ux/ocr-translation/
└── DISCUSS-WAVE-SUMMARY.md       (This document)
```

**Total Files Created:** 11  
**Total Lines of Documentation:** ~2,500+ lines

---

## Next Steps

1. **Immediate:** Peer review by nw-product-owner-reviewer (quality gate)
2. **Then:** Handoff to nw-solution-architect for DESIGN wave
3. **Design Output:** High-level design, architecture diagrams, API contracts
4. **After DESIGN:** nw-acceptance-designer creates E2E acceptance tests (DISTILL wave)
5. **After DISTILL:** nw-software-crafter implements via Outside-In TDD (DELIVER wave)

---

**Status:** ✅ **DISCUSS WAVE COMPLETE**  
**Quality:** All DoR criteria passed, no anti-patterns, full traceability  
**Ready for:** DESIGN wave (nw-solution-architect)

---

**Completed by:** Orchestrator (Claude Opus 4.6) + nw-product-owner (Luna)  
**Date:** 2026-02-24  
**Approval:** Ready for peer review and DESIGN wave handoff
