# Journey Map: Camera Study Workflow - Photograph Sanskrit Text for Translation

## User Context
**Persona:** Maria Santos, spiritual practitioner studying Yoga Sutras at home
**Job to Be Done:** Access sacred Devanagari teachings without being blocked by unfamiliar script
**Trigger:** Encounters 4-line sutra in physical book that she cannot read or type
**Environment:** Home desk with book lamp, phone nearby, study notebook open

---

## Emotional Arc Overview

```
Empowerment/Understanding
        |                                           ┌────────────────┐
        |                                      ┌────┤   LEARNING     │
        |                                 ┌────┤    │  (Gratitude)   │
        |                            ┌────┤    └────┴────────────────┘
        |                       ┌────┤    │  VERIFICATION
        |                  ┌────┤    │    │  (Reassured)
Neutral |─────────────┬────┤    └────┴────┘
        |   INITIATE  │    │  CAPTURE
        |  (Hopeful)  │    │  (Trusting)
        |             └────┘
        |
Blocked/Frustrated
        └─────────────────────────────────────────────────────────────> Time
             Start    Camera   Photo   OCR      Verify    Translate   Copy/Continue
```

**Key Emotional Transitions:**
- **Blocked → Hopeful:** Opens app, sees clear "Take Photo" option
- **Hopeful → Trusting:** Camera opens smoothly, guidance frame shows where to position text
- **Trusting → Patient:** Takes photo, sees processing feedback, knows it's working
- **Patient → Reassured:** Sees high confidence score (94%), extracted text matches image
- **Reassured → Empowered:** Gets accurate translation with word breakdown
- **Empowered → Grateful:** Copies to notes, barrier removed, can continue spiritual study

---

## Journey Steps with TUI Mockups

### Step 1: Initiate Scan
**Emotional State:** Blocked by Devanagari → Hopeful (sees solution)

**Context:** Maria encounters sutra 1.2 in her Yoga Sutras book. She cannot read the Devanagari script.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  Sanskrit Student           ☰       │
├─────────────────────────────────────┤
│                                     │
│   What would you like to            │
│   translate today?                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    📝  Translate Text       │   │
│  │                             │   │
│  │    Enter or paste Sanskrit  │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    📷  Take Photo           │   │
│  │                             │   │
│  │    Scan text from book      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  💡 Tip: Use bright, even          │
│     lighting for best results       │
│                                     │
└─────────────────────────────────────┘
```

**User Action:** Taps "Take Photo"

**Observable Artifacts:**
- Button label: "Take Photo"
- Helper text: "Scan text from book"
- One-time tip about lighting

---

### Step 2: Position Camera
**Emotional State:** Trusting (system is guiding me)

**Context:** Camera opens, Maria sees guidance frame showing where to position the sutra text.

**Mobile Screen (Camera View):**
```
┌─────────────────────────────────────┐
│  ← Back                      Flash  │
├─────────────────────────────────────┤
│                                     │
│         Camera viewfinder           │
│                                     │
│    ┌─────────────────────────┐     │
│    │                         │     │
│    │  Position text within   │     │
│    │  this frame             │     │
│    │                         │     │
│    │  Best results:          │     │
│    │  photograph 2-6 lines   │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
│         [Book page visible          │
│          through camera]            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│              ⚪                     │
│           [Capture]                 │
└─────────────────────────────────────┘
```

**User Action:**
1. Positions phone over sutra in book
2. Adjusts distance until text fills frame (4 lines visible)
3. Taps capture button

**Observable Artifacts:**
- ${cameraFrame}: Landscape rectangle (70% screen width)
- ${guidanceText}: "Position text within this frame"
- ${recommendationText}: "Best results: photograph 2-6 lines"
- ${captureButton}: Large circular button at bottom

---

### Step 3: Preview Photo
**Emotional State:** Checking quality (cautious but confident)

**Context:** Photo captured, Maria previews to ensure text is clear and readable.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  Take Photo                         │
├─────────────────────────────────────┤
│                                     │
│  [Photo Preview - Full Screen]      │
│                                     │
│   योगश्चित्तवृत्तिनिरोधः।           │
│   (Devanagari text visible          │
│    in captured photo)               │
│                                     │
│  (Pinch to zoom and check focus)    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Is the text clear?                 │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │              │  │             │ │
│  │   Retake     │  │  Use This   │ │
│  │              │  │   Photo     │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**User Action:**
- Pinches to zoom, checks text is crisp and in focus
- Confirms: Taps "Use This Photo"

**Observable Artifacts:**
- ${photoPreview}: Full-screen image preview
- ${qualityPrompt}: "Is the text clear?"
- ${retakeButton}: Secondary action
- ${confirmButton}: Primary action "Use This Photo"

---

### Step 4: Processing (OCR + Translation)
**Emotional State:** Patient (trusting system is working)

**Context:** Photo submitted, system processing OCR and translation. Maria waits.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  Translating...                     │
├─────────────────────────────────────┤
│                                     │
│                                     │
│          ⟳                          │
│                                     │
│    Reading Devanagari text...       │
│                                     │
│                                     │
│    ▓▓▓▓▓▓▓▓░░░░ 65%                │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Processing Steps (invisible to user but happening):**
1. Upload photo to server
2. Store via InMemoryImageStorage
3. Pass to GoogleVisionOcrEngine
4. Extract Devanagari text
5. Calculate confidence score
6. Pass to NormalizingTranslationService
7. Convert Devanagari → IAST
8. Translate with Claude
9. Generate word breakdown
10. Cleanup stored image

**Expected Duration:** 3-8 seconds

**Observable Artifacts:**
- ${processingSpinner}: Animated spinner
- ${statusMessage}: "Reading Devanagari text..."
- ${progressBar}: Visual progress (65%)

---

### Step 5: Verification (Trust Building)
**Emotional State:** Reassured (high confidence, can verify)

**Context:** OCR complete, Maria sees extracted text with high confidence score. She can compare to original.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  ✓ Translation Complete             │
├─────────────────────────────────────┤
│                                     │
│  OCR Confidence: 94% ✓              │
│  ━━━━━━━━━━━━━━━━━━━━ High         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Extracted Text              │   │
│  │                             │   │
│  │ योगश्चित्तवृत्तिनिरोधः।     │   │
│  │                             │   │
│  │ [📎 Copy]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ IAST                        │   │
│  │                             │   │
│  │ yogaś-citta-vṛtti-nirodhaḥ  │   │
│  │                             │   │
│  │ [📎 Copy]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ▼ Show Original Photo              │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Translation ▼                      │
│                                     │
└─────────────────────────────────────┘
```

**User Action:**
- Reviews extracted Devanagari (matches what she sees in book)
- Sees high confidence score (reassured)
- Optionally taps "Show Original Photo" to compare side-by-side

**Observable Artifacts:**
- ${ocrConfidence}: 94%
- ${confidenceIndicator}: Green progress bar + "High" label
- ${extractedDevanagari}: "योगश्चित्तवृत्तिनिरोधः।"
- ${iastText}: "yogaś-citta-vṛtti-nirodhaḥ"
- ${copyButtons}: One for Devanagari, one for IAST
- ${originalPhotoToggle}: Expandable section to show original image

---

### Step 6: Translation & Learning
**Emotional State:** Empowered (understanding achieved) → Grateful

**Context:** Maria expands translation section, sees word-by-word breakdown and alternative translations.

**Mobile Screen (scrolled down):**
```
┌─────────────────────────────────────┐
│  Translation ▲                      │
├─────────────────────────────────────┤
│                                     │
│  Primary Translation:               │
│  "Yoga is the cessation of the      │
│   fluctuations of consciousness."   │
│                                     │
│  [📎 Copy Translation]              │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Word-by-Word Breakdown:            │
│                                     │
│  • yogaḥ                            │
│    → yoga, union, spiritual path    │
│                                     │
│  • citta                            │
│    → consciousness, mind-stuff      │
│                                     │
│  • vṛtti                            │
│    → fluctuations, modifications    │
│                                     │
│  • nirodhaḥ                         │
│    → cessation, restraint, control  │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Alternative Translations:          │
│                                     │
│  "Yoga is the stilling of the       │
│   movements of the mind."           │
│                                     │
│  "Union is achieved through the     │
│   restraint of mental activity."    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Translate Another Passage   │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**User Action:**
- Reads translation
- Reviews word breakdown for deeper understanding
- Taps "Copy Translation" to paste into study notebook
- Taps "Translate Another Passage" to scan next sutra

**Observable Artifacts:**
- ${primaryTranslation}: Main translation text
- ${wordBreakdown}: Array of {word, meanings[]}
- ${alternativeTranslations}: Array of alternative phrasings
- ${copyTranslationButton}: Copy full translation
- ${nextPassageButton}: Quick restart for next scan

---

## Error Path: Low Confidence Warning

**Context:** Maria's second photo was taken in dim light, OCR confidence is 68%.

**Mobile Screen (Step 5 - Verification with Warning):**
```
┌─────────────────────────────────────┐
│  ⚠️ Translation Complete            │
├─────────────────────────────────────┤
│                                     │
│  OCR Confidence: 68% ⚠️             │
│  ━━━━━━━━━━░░░░░░░░░░ Medium        │
│                                     │
│  ⚠️ Low confidence detected         │
│     The image may be blurry or      │
│     poorly lit. Please verify       │
│     the extracted text carefully.   │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Retake with Better Lighting  │  │
│  └──────────────────────────────┘  │
│                                     │
│  Or continue anyway ▼               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Extracted Text              │   │
│  │                             │   │
│  │ योगश्चित्तवृततनरोधः।        │   │
│  │ (verify carefully)          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Translation ▼                      │
│  (Please verify against original)   │
│                                     │
└─────────────────────────────────────┘
```

**Emotional State:** Cautious (system warns me) → Supported (clear guidance)

**User Decision:**
- **Option A:** Taps "Retake with Better Lighting" → returns to camera
- **Option B:** Accepts medium confidence, proceeds to verify extracted text carefully

**Observable Artifacts:**
- ${ocrConfidence}: 68%
- ${confidenceIndicator}: Yellow/orange bar + "Medium" label
- ${warningMessage}: "Low confidence detected. The image may be blurry or poorly lit."
- ${retakeSuggestion}: Primary action button "Retake with Better Lighting"
- ${continueOption}: Secondary collapsed option "Or continue anyway"

---

## Error Path: Upload Failure (File Too Large)

**Context:** Maria tried uploading a high-res photo (6MB), exceeds 5MB limit.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  ❌ Upload Failed                   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│          ⚠️                         │
│                                     │
│  Image too large (6.2 MB)           │
│  Maximum file size: 5 MB            │
│                                     │
│  Suggestions:                       │
│  • Use lower camera resolution      │
│  • Photograph smaller text area     │
│    (2-6 lines recommended)          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Try Again               │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Adjust Camera Settings  │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Emotional State:** Frustrated (blocked) → Supported (clear actions)

**User Action:** Taps "Try Again", adjusts camera resolution, retakes photo

**Observable Artifacts:**
- ${errorType}: "Upload Failed"
- ${errorMessage}: "Image too large (6.2 MB). Maximum file size: 5 MB"
- ${actionableGuidance}: Bulleted list of suggestions
- ${retryButton}: "Try Again"
- ${settingsButton}: "Adjust Camera Settings" (deep link to camera settings)

---

## Error Path: Camera Permission Denied

**Context:** Maria denies camera permission when browser/app requests it.

**Mobile Screen:**
```
┌─────────────────────────────────────┐
│  Camera Access Required              │
├─────────────────────────────────────┤
│                                     │
│          📷🚫                       │
│                                     │
│  Camera access is needed to         │
│  photograph Sanskrit text.          │
│                                     │
│  Please enable camera permission    │
│  in your browser settings.          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Open Settings              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Or Upload Image Instead    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ← Back to Home                     │
│                                     │
└─────────────────────────────────────┘
```

**Emotional State:** Blocked (permission issue) → Guided (alternative path)

**User Action:**
- **Option A:** Taps "Open Settings", enables camera, returns to app
- **Option B:** Taps "Upload Image Instead" (fallback to gallery upload)

**Observable Artifacts:**
- ${errorType}: "Camera Access Required"
- ${permissionMessage}: "Camera access is needed to photograph Sanskrit text"
- ${settingsButton}: "Open Settings" (deep link)
- ${fallbackButton}: "Or Upload Image Instead"
- ${backButton}: "← Back to Home"

---

## Shared Artifacts Across Journey

| Artifact | Source Step | Used In Steps | Format | Notes |
|----------|-------------|---------------|--------|-------|
| ${originalImage} | Step 3 (Capture) | Step 5 (Verification toggle) | JPEG/PNG Buffer | Stored in InMemoryImageStorage, deleted after processing |
| ${extractedDevanagari} | Step 4 (OCR) | Step 5 (Display), Step 6 (Reference) | String (Devanagari) | Raw OCR output from Google Vision |
| ${ocrConfidence} | Step 4 (OCR) | Step 5 (Trust indicator) | Float 0.0-1.0 | Determines green/yellow/red UI treatment |
| ${iastText} | Step 4 (Normalization) | Step 5 (Display), Step 6 (Reference) | String (IAST) | Converted from Devanagari via Sanscript |
| ${wordBreakdown} | Step 4 (Translation) | Step 6 (Learning) | Array<{word, meanings[]}> | LLM-generated word analysis |
| ${primaryTranslation} | Step 4 (Translation) | Step 6 (Display) | String (English) | Main translation text |
| ${alternativeTranslations} | Step 4 (Translation) | Step 6 (Display) | Array<String> | Alternative phrasings |

---

## Integration Checkpoints

**Checkpoint 1: Camera → Preview**
- **Handoff:** Camera capture produces ${originalImage} buffer
- **Validation:** Image format (JPEG/PNG), size (<5MB)
- **Failure Mode:** Invalid format → show error, retry

**Checkpoint 2: Preview → OCR**
- **Handoff:** ${originalImage} passed to InMemoryImageStorage.store()
- **Validation:** Storage returns ${imageHandle}
- **Failure Mode:** Storage fails → show "Upload failed", retry

**Checkpoint 3: OCR → Normalization**
- **Handoff:** ${extractedDevanagari} + ${ocrConfidence} passed to script normalizer
- **Validation:** Confidence > 10% (reject if no text detected)
- **Failure Mode:** <10% confidence → show "No Devanagari text detected"

**Checkpoint 4: Normalization → Translation**
- **Handoff:** ${iastText} passed to TranslationService
- **Validation:** IAST text is valid Sanskrit
- **Failure Mode:** Translation fails → show error with extracted text (user can still copy)

**Checkpoint 5: Translation → Display**
- **Handoff:** ${wordBreakdown}, ${primaryTranslation}, ${alternativeTranslations} rendered in UI
- **Validation:** All fields populated
- **Failure Mode:** Partial failure → show what's available, mark missing fields

---

## Success Criteria for Journey

**Journey is successful when:**
1. ✅ User photographs sutra in <30 seconds (camera launch to capture)
2. ✅ OCR confidence ≥90% for clear images
3. ✅ User can visually verify extracted text matches original
4. ✅ Translation appears within 8 seconds of photo submission
5. ✅ User can copy IAST and translation to study notes
6. ✅ Low confidence images show actionable retake guidance
7. ✅ Upload failures provide clear recovery paths
8. ✅ User feels empowered (barrier removed) not anxious (tech friction)

---

## Quality Gates

**Emotional Coherence:**
- ✅ No jarring transitions (blocked → hopeful → trusting → reassured → empowered)
- ✅ Anxiety is addressed proactively (confidence score, warnings, guidance)
- ✅ Reverence for sacred texts maintained (no flippant language, accurate extraction critical)

**Horizontal Integration:**
- ✅ All ${artifacts} have single source of truth
- ✅ No orphaned data (everything tracked from capture → cleanup)
- ✅ Cleanup guaranteed even on error (finally block in OcrTranslationService)

**CLI UX Compliance (Mobile Edition):**
- ✅ Progressive disclosure (don't show translation until verification complete)
- ✅ Clear affordances (buttons labeled with outcomes: "Use This Photo" not "OK")
- ✅ Material honesty (mobile camera is a camera, not trying to be a scanner)

---

**Journey Map Status:** COMPLETE
**Next Artifact:** journey-camera-study.yaml (Journey Schema)
