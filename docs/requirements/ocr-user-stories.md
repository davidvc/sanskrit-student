# User Stories: Camera OCR Translation

**Format:** LeanUX User Story  
**Template:** As a [persona], I want [capability], so that [benefit/outcome]

**Traceability:** Every story explicitly traces to a Job Story from JTBD analysis

---

## Epic: Camera OCR Translation for Sanskrit Study

### Story 1: Photograph Devanagari Text with Camera
**Job Traceability:** Job 1 (Access Sacred Teachings)

**Story:**
> As a spiritual practitioner studying Sanskrit  
> Who cannot read or type Devanagari script  
> I want to photograph Devanagari text directly with my phone camera  
> So that I can access the meaning without manual transcription

**Acceptance Criteria:**
- Given I open the app, when I tap "Take Photo", then the camera opens
- Given the camera is open, when I see a landscape frame overlay, then I know where to position the text
- Given I see guidance "photograph 2-6 lines", then I know the optimal composition
- Given I position my phone over a sutra, when I tap shutter, then the photo is captured
- Given I capture a photo, when I see the preview, then I can verify quality before submitting

**Definition of Done:**
- Camera launches in < 1 second
- Frame overlay is visible and guides composition
- Shutter button is responsive and captures photo
- All acceptance tests pass

---

### Story 2: Verify Photo Quality Before Processing
**Job Traceability:** Job 2 (Trust the Extraction), Job 4 (Error Recovery)

**Story:**
> As a user who wants accurate OCR results  
> I want to preview my photo and verify it's clear before processing  
> So that I don't waste time on blurry images that will have low confidence

**Acceptance Criteria:**
- Given I capture a photo, when I see the preview, then I can pinch-to-zoom to check focus
- Given the preview shows my photo, when I see "Is the text clear?", then I know what to verify
- Given I'm satisfied with quality, when I tap "Use This Photo", then processing begins
- Given the photo is blurry, when I tap "Retake", then I return to camera view without starting over

**Definition of Done:**
- Preview displays captured photo immediately
- Pinch-to-zoom works on preview
- "Use This Photo" and "Retake" buttons are clearly visible
- Retake flow returns to camera without losing session
- All acceptance tests pass

---

### Story 3: Extract Devanagari Text with OCR
**Job Traceability:** Job 1 (Access Sacred Teachings)

**Story:**
> As a user who has photographed Devanagari text  
> I want the system to extract the text accurately using OCR  
> So that I can get a translation without typing

**Acceptance Criteria:**
- Given I submit a clear photo, when OCR processes it, then Devanagari text is extracted
- Given extraction completes, when I see the result, then it includes a confidence score
- Given the image has 2-6 lines, when OCR runs, then all lines are extracted
- Given OCR confidence is < 10%, when processing completes, then I see "No readable text" error

**Definition of Done:**
- Google Cloud Vision API integration works
- Devanagari text is correctly extracted as UTF-8 string
- Confidence score is returned (0.0-1.0)
- Language hints (Hindi/Sanskrit) are used for accuracy
- Extremely low confidence (<10%) is rejected with clear error
- All acceptance tests pass

---

### Story 4: See Confidence Score and Visual Verification
**Job Traceability:** Job 2 (Trust the Extraction)

**Story:**
> As a spiritual practitioner concerned about accuracy in sacred texts  
> I want to see how confident the OCR is and visually compare the extraction  
> So that I can trust the translation or know to retake the photo

**Acceptance Criteria:**
- Given OCR confidence ≥ 90%, when results display, then I see green "High Confidence (X%)" badge
- Given OCR confidence 70-89%, when results display, then I see yellow "Medium Confidence (X%)" badge
- Given OCR confidence < 70%, when results display, then I see orange "Low Confidence (X%)" badge
- Given any confidence level, when results display, then I see side-by-side: original photo | extracted text
- Given I want to verify details, when I tap the photo thumbnail, then it expands full-screen

**Definition of Done:**
- Confidence badge displays with correct color coding
- Side-by-side comparison is visually clear
- Thumbnail tap expands to full-screen
- Users can pattern-match extraction to photo (even without reading Devanagari)
- All acceptance tests pass

---

### Story 5: Receive Actionable Guidance for Low Confidence
**Job Traceability:** Job 4 (Error Recovery)

**Story:**
> As a user whose photo produced low OCR confidence  
> I want specific guidance on how to improve the photo  
> So that I can successfully get an accurate translation without technical frustration

**Acceptance Criteria:**
- Given OCR confidence < 70%, when results display, then I see warning: "Image quality may affect accuracy"
- Given the warning appears, when I read the guidance, then it says "Retake with better lighting, less blur, or crop closer"
- Given I see low confidence, when I view options, then I see "Upload Different Image" and "See Translation Anyway"
- Given I tap "Upload Different Image", when camera opens, then I can retake immediately without restarting

**Definition of Done:**
- Warning message is clear and non-technical
- Guidance is actionable (specific fixes, not vague "failed")
- Both options ("retry" and "proceed anyway") are available
- Retry flow is seamless (no starting over)
- All acceptance tests pass

---

### Story 6: Receive IAST Transliteration
**Job Traceability:** Job 1 (Access Sacred Teachings)

**Story:**
> As a user who cannot read Devanagari  
> I want to see the IAST (Latin alphabet) transliteration  
> So that I can read the Sanskrit text phonetically

**Acceptance Criteria:**
- Given OCR extraction succeeds, when translation displays, then I see IAST transliteration
- Given IAST is displayed, when I see it, then it's in ASCII characters I can read
- Given I want to save it, when I tap the Copy button, then IAST is copied to clipboard
- Given I paste in Notes app, when I check, then the IAST text appears correctly

**Definition of Done:**
- IAST conversion uses existing script normalizer
- IAST is displayed prominently
- Copy button works and shows "Copied!" confirmation
- Clipboard content is pasteable in other apps
- All acceptance tests pass

---

### Story 7: Study Word-by-Word Breakdown
**Job Traceability:** Job 1 (Access Sacred Teachings)

**Story:**
> As a Sanskrit learner  
> I want to see word-by-word meanings for each word in the sutra  
> So that I can understand the grammar and vocabulary, not just the overall translation

**Acceptance Criteria:**
- Given translation completes, when I scroll down, then I see a word-by-word breakdown section
- Given the breakdown is shown, when I see the word list, then each word is tappable to expand
- Given I tap a word, when it expands, then I see meanings array for that word
- Given I want to see all meanings, when I tap "Expand All", then all words expand

**Definition of Done:**
- Word breakdown uses existing LLM translation service
- Each word is expandable/collapsible
- Expand All button works
- Words show in IAST format (readable)
- All acceptance tests pass

---

### Story 8: See Primary and Alternative Translations
**Job Traceability:** Job 1 (Access Sacred Teachings)

**Story:**
> As a spiritual practitioner studying sacred texts  
> I want to see both a primary translation and alternative interpretations  
> So that I can understand different nuances and deepen my comprehension

**Acceptance Criteria:**
- Given translation completes, when I see the results, then I see the primary translation prominently
- Given I want other perspectives, when I tap "Alternative Translations", then it expands
- Given alternatives expand, when I read them, then I see 2-4 different translation options
- Given I want to save a translation, when I tap Copy, then it copies to clipboard

**Definition of Done:**
- Primary translation is clearly labeled
- Alternative translations are collapsible (avoid overwhelming)
- Copy button works for primary translation
- Alternatives provide interpretative variety
- All acceptance tests pass

---

### Story 9: See Processing Progress
**Job Traceability:** Job 2 (Trust the Extraction)

**Story:**
> As a user waiting for OCR and translation  
> I want to see progress indicators showing what's happening  
> So that I trust the system is working and know how long to wait

**Acceptance Criteria:**
- Given I submit a photo, when processing starts, then I see "Uploading image..." message
- Given upload completes, when OCR starts, then I see "Reading Devanagari text..." message
- Given OCR completes, when translation starts, then I see "Translating..." message
- Given all steps complete, when I check total time, then it's under 5 seconds

**Definition of Done:**
- Progress messages display in sequence
- Visual spinner or progress bar is shown
- Total happy path time < 5 seconds (95th percentile)
- User feels informed, not abandoned
- All acceptance tests pass

---

### Story 10: Recover from File Too Large Error
**Job Traceability:** Job 4 (Error Recovery)

**Story:**
> As a user who uploaded a large image file  
> I want a clear error message explaining the size limit  
> So that I know to crop the image and can retry easily

**Acceptance Criteria:**
- Given my image is 6.2 MB, when upload validation runs, then I see error: "Image too large (6.2 MB). Maximum is 5 MB."
- Given I see the error, when I read the guidance, then it says "Try cropping to just the text area"
- Given I understand the fix, when I tap "Try Again", then I return to camera view
- Given I crop tighter, when I retake, then the smaller image uploads successfully

**Definition of Done:**
- File size validation enforces 5 MB limit
- Error message shows actual size and limit
- Guidance is specific and actionable
- Retry flow is seamless
- All acceptance tests pass

---

### Story 11: Recover from Unsupported Format Error
**Job Traceability:** Job 4 (Error Recovery)

**Story:**
> As a user who accidentally uploaded a non-image file  
> I want to know which formats are supported  
> So that I can use the correct file type

**Acceptance Criteria:**
- Given I upload a PDF file, when validation runs, then I see error: "Format not supported (.pdf)"
- Given I see the error, when I read the message, then it lists supported formats: "PNG, JPG, WEBP"
- Given I understand, when I tap "Try Again", then I can select a valid image format

**Definition of Done:**
- Format validation checks magic bytes (security)
- Supported formats: PNG, JPG, JPEG, WEBP, TIFF
- Error message is clear and non-technical
- Retry flow is seamless
- All acceptance tests pass

---

### Story 12: See Lighting Tip on First Use
**Job Traceability:** Job 4 (Error Recovery - Proactive)

**Story:**
> As a first-time user  
> I want to see a helpful tip about lighting before I take my first photo  
> So that I can avoid poor quality images and low confidence results

**Acceptance Criteria:**
- Given I'm using the app for the first time, when camera launches, then I see tip: "💡 Tip: Use bright, even lighting for best results"
- Given I see the tip, when 3 seconds pass, then it disappears automatically
- Given I've used the app before, when camera launches, then I don't see the tip again

**Definition of Done:**
- Tip displays on first use only
- Tip auto-dismisses after 3 seconds
- Tip does not reappear on subsequent uses
- All acceptance tests pass

---

## Story Mapping to Jobs

| Job Story | User Stories |
|-----------|--------------|
| **Job 1: Access Sacred Teachings** | Stories 1, 3, 6, 7, 8 |
| **Job 2: Trust the Extraction** | Stories 2, 4, 9 |
| **Job 4: Recover from Upload Issues** | Stories 5, 10, 11, 12 |

---

## Story Prioritization (MoSCoW)

### Must Have (MVP)
- ✅ Story 1: Photograph with camera
- ✅ Story 2: Verify photo quality
- ✅ Story 3: Extract text with OCR
- ✅ Story 4: See confidence score and visual verification
- ✅ Story 5: Actionable guidance for low confidence
- ✅ Story 6: IAST transliteration
- ✅ Story 7: Word-by-word breakdown
- ✅ Story 8: Primary and alternative translations
- ✅ Story 9: Processing progress indicators

### Should Have (MVP+)
- ✅ Story 10: File too large error recovery
- ✅ Story 11: Unsupported format error recovery
- ✅ Story 12: First-use lighting tip

### Won't Have (Deferred)
- Screenshot upload workflow
- Save to history
- Crop/rotate tools
- Multi-scan quick-repeat

---

**Next:** Acceptance Criteria (detailed testable scenarios)
