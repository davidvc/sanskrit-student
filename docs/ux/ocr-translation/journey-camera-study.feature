# Feature: Camera Study Workflow - Photograph Sanskrit Text for Translation
# Epic: ocr-translation
# Journey: Camera Study Workflow (Primary)
# Persona: Maria Santos (spiritual practitioner, cannot read/type Devanagari)

Feature: Camera Study Workflow
  As a spiritual practitioner studying Sanskrit texts
  Who cannot read or type Devanagari script
  I want to photograph sutras from my physical books
  So that I can understand sacred teachings without being blocked by unfamiliar script

  Background:
    Given Maria Santos is studying the Yoga Sutras at her home desk
    And she has the physical book open to sutra 1.2
    And she encounters Devanagari text: "योगश्चित्तवृत्तिनिरोधः।"
    And she cannot read or type this script
    And she has the Sanskrit Student app open on her phone

  # ============================================================================
  # STEP 1: INITIATE SCAN
  # ============================================================================

  Scenario: User initiates camera scan from home screen
    Given Maria is on the app home screen
    And she sees two options: "Translate Text" and "Take Photo"
    When she taps "Take Photo"
    Then the camera view should open within 2 seconds
    And she should see a guidance frame overlaid on the viewfinder
    And she should feel hopeful that the system can help

  Scenario: First-time user sees lighting tip
    Given Maria is using the app for the first time
    And she is on the home screen
    When she sees the "Take Photo" button
    Then she should see a tip: "💡 Tip: Use bright, even lighting for best results"
    And the tip should only appear on first use

  Scenario: Camera permission denied - fallback to upload
    Given Maria taps "Take Photo"
    When the browser requests camera permission
    And Maria denies permission
    Then she should see an error message: "Camera access is needed to photograph Sanskrit text"
    And she should see a button: "Open Settings"
    And she should see a fallback option: "Or Upload Image Instead"
    And she should feel guided, not blocked

  # ============================================================================
  # STEP 2: POSITION CAMERA
  # ============================================================================

  Scenario: User positions camera over sutra text
    Given the camera view has opened
    When Maria positions her phone over the 4-line sutra in her book
    Then she should see a landscape-oriented frame (70% screen width)
    And the frame should contain guidance text: "Position text within this frame"
    And the frame should show recommendation: "Best results: photograph 2-6 lines"
    And she should see a large circular capture button at the bottom
    And she should feel trusting that the system is guiding her

  Scenario: User adjusts composition within frame
    Given the camera is open with guidance frame visible
    When Maria moves the phone closer to include only 4 lines (one full sutra)
    And the Devanagari text fills approximately 70% of the frame width
    Then the text should be clearly visible in the viewfinder
    And she should feel confident this composition will work

  Scenario: User cancels camera and returns to home
    Given the camera view is open
    When Maria taps the "← Back" button
    Then she should return to the app home screen
    And no photo should be captured

  # ============================================================================
  # STEP 3: PREVIEW PHOTO
  # ============================================================================

  Scenario: User captures photo and previews for quality
    Given Maria has positioned the camera over the sutra text
    When she taps the capture button
    Then the photo should be captured immediately
    And a preview screen should appear within 1 second
    And she should see the captured photo full-screen
    And she should see the prompt: "Is the text clear?"
    And she should see two buttons: "Retake" and "Use This Photo"
    And she should be able to pinch-to-zoom to verify text clarity

  Scenario: User verifies photo quality by zooming
    Given Maria is on the photo preview screen
    When she pinches to zoom on the Devanagari text
    Then she should see the text enlarged
    And she should be able to visually verify the text is crisp and in focus
    And she should feel cautious but confident in checking quality

  Scenario: User retakes photo due to blur
    Given Maria previews the captured photo
    And she notices the text is slightly blurry
    When she taps "Retake"
    Then she should return to the camera view (step 2)
    And the guidance frame should still be visible
    And she should be able to capture a new photo immediately

  Scenario: User confirms clear photo and proceeds
    Given Maria previews the captured photo
    And she zooms to verify the text is clear and readable
    When she taps "Use This Photo"
    Then the photo should be submitted for processing
    And she should see a processing screen
    And she should feel patient, trusting the system is working

  Scenario: Photo exceeds file size limit (5MB)
    Given Maria captures a high-resolution photo
    And the file size is 6.2 MB (exceeds 5 MB limit)
    When the system validates the file size
    Then she should see an error: "Image too large (6.2 MB). Maximum file size: 5 MB"
    And she should see suggestions:
      | Suggestion                                    |
      | Use lower camera resolution                   |
      | Photograph smaller text area (2-6 lines)      |
    And she should see buttons: "Try Again" and "Adjust Camera Settings"
    And she should feel supported with clear guidance

  # ============================================================================
  # STEP 4: OCR + TRANSLATION PROCESSING
  # ============================================================================

  Scenario: System processes photo through OCR and translation pipeline
    Given Maria has submitted a clear photo for processing
    When the system receives the photo (JPEG, 2.1 MB)
    Then the system should upload the image to the server
    And the system should store it via InMemoryImageStorage
    And the system should pass the buffer to GoogleVisionOcrEngine
    And GoogleVisionOcrEngine should extract: "योगश्चित्तवृत्तिनिरोधः।"
    And GoogleVisionOcrEngine should return confidence: 0.94
    And the system should pass the Devanagari text to ScriptNormalizer
    And ScriptNormalizer should convert to IAST: "yogaś-citta-vṛtti-nirodhaḥ"
    And the system should pass IAST to LlmTranslationService
    And LlmTranslationService should return:
      | Field                      | Value                                                          |
      | word_breakdown             | [{word: "yogaḥ", meanings: ["yoga", "union"]}, ...]            |
      | primary_translation        | "Yoga is the cessation of the fluctuations of consciousness."  |
      | alternative_translations   | ["Yoga is the stilling of the movements of the mind.", ...]    |
    And the system should call InMemoryImageStorage.cleanup() to delete the image
    And processing should complete within 8 seconds

  Scenario: User sees processing feedback while waiting
    Given Maria has submitted the photo
    When the system is processing OCR and translation
    Then she should see an animated spinner
    And she should see status text: "Reading Devanagari text..."
    And she should see a progress bar (indeterminate animation)
    And she should feel patient, knowing the system is working
    And the feedback should reassure her within 3 seconds

  Scenario: OCR confidence too low - no text detected
    Given Maria submits a very blurry photo
    When GoogleVisionOcrEngine processes the image
    And OCR confidence is 0.08 (below 10% threshold)
    Then the system should reject the OCR result
    And Maria should see error: "No Devanagari text detected in image."
    And she should see possible causes:
      | Cause                               |
      | Image is too blurry or out of focus |
      | Text is too small or far away       |
      | Lighting is too dark                |
      | Image contains no Devanagari script |
    And she should see "Retake Photo" button
    And she should feel guided to fix the issue

  Scenario: Upload fails due to network error
    Given Maria submits the photo
    When the network connection is unstable
    And the upload to server fails
    Then she should see error: "Upload failed. Please check your connection and try again."
    And she should see buttons: "Retry Upload" and "← Start Over"
    And she should feel supported with a clear retry path

  # ============================================================================
  # STEP 5: VERIFICATION (TRUST BUILDING)
  # ============================================================================

  Scenario: User verifies high-confidence OCR extraction
    Given OCR processing completed successfully with confidence 0.94
    When the verification screen appears
    Then Maria should see "OCR Confidence: 94% ✓"
    And the confidence indicator should be green with label "High"
    And she should see "Extracted Text" section with: "योगश्चित्तवृत्तिनिरोधः।"
    And she should see "IAST" section with: "yogaś-citta-vṛtti-nirodhaḥ"
    And each section should have a "📎 Copy" button
    And she should see a toggle: "▼ Show Original Photo"
    And she should feel reassured by the high confidence score

  Scenario: User compares extracted text to original photo
    Given Maria is on the verification screen
    And she wants to visually confirm the extraction accuracy
    When she taps "▼ Show Original Photo"
    Then the section should expand to show a thumbnail of her captured photo
    And she should be able to visually compare the original Devanagari in the photo
    And the extracted Devanagari text displayed above
    And she should feel confident the extraction is accurate

  Scenario: User copies IAST text to study notes
    Given Maria is on the verification screen
    And she sees the IAST text: "yogaś-citta-vṛtti-nirodhaḥ"
    When she taps the "📎 Copy" button in the IAST section
    Then the IAST text should be copied to her clipboard
    And she should see a brief confirmation: "Copied to clipboard"
    And she should be able to paste it into her study notes app

  Scenario: Low confidence extraction shows warning (68%)
    Given OCR processing completed with confidence 0.68
    When the verification screen appears
    Then Maria should see "OCR Confidence: 68% ⚠️"
    And the confidence indicator should be yellow/orange with label "Medium"
    And she should see warning: "⚠️ Low confidence detected. The image may be blurry or poorly lit. Please verify the extracted text carefully."
    And she should see a primary button: "Retake with Better Lighting"
    And she should see a collapsed section: "Or continue anyway ▼"
    And she should feel cautious but supported with clear options

  Scenario: User retakes photo after low confidence warning
    Given Maria sees a low confidence warning (68%)
    When she taps "Retake with Better Lighting"
    Then she should return to the camera view (step 2)
    And she should adjust the lighting (move to brighter area)
    And she should capture a new photo
    And she should feel supported in improving the result

  Scenario: User proceeds despite low confidence warning
    Given Maria sees a low confidence warning (68%)
    And she wants to proceed anyway (she trusts her book is clear)
    When she taps "Or continue anyway ▼"
    Then the section should expand to show extracted text with extra warnings
    And the extracted text should have a note: "(verify carefully)"
    And the translation section should have a note: "(Please verify against original)"
    And she should be able to scroll to see the translation
    And she should feel cautious but empowered to make the decision

  # ============================================================================
  # STEP 6: TRANSLATION & LEARNING
  # ============================================================================

  Scenario: User views primary translation and word breakdown
    Given Maria has verified the OCR extraction (high confidence)
    When she scrolls down to the "Translation ▼" section
    Then she should see the primary translation:
      """
      Yoga is the cessation of the fluctuations of consciousness.
      """
    And she should see a "📎 Copy Translation" button
    And she should see "Word-by-Word Breakdown:"
    And she should see word entries:
      | Word       | Meanings                                      |
      | yogaḥ      | yoga, union, spiritual path                   |
      | citta      | consciousness, mind-stuff                     |
      | vṛtti      | fluctuations, modifications                   |
      | nirodhaḥ   | cessation, restraint, control                 |
    And she should feel empowered by understanding the sacred text

  Scenario: User explores alternative translations
    Given Maria is viewing the translation section
    When she scrolls to "Alternative Translations:"
    Then she should see multiple phrasings:
      | Alternative Translation                                              |
      | Yoga is the stilling of the movements of the mind.                   |
      | Union is achieved through the restraint of mental activity.          |
    And she should be able to compare translations for deeper understanding
    And she should feel grateful for the depth of learning

  Scenario: User copies full translation to study notes
    Given Maria has read and understood the translation
    When she taps "📎 Copy Translation"
    Then the primary translation should be copied to clipboard
    And she should see confirmation: "Copied to clipboard"
    And she should switch to her study notes app
    And she should paste the translation into her notebook
    And she should feel empowered to continue her spiritual study

  Scenario: User translates next sutra in session
    Given Maria has completed translation of sutra 1.2
    And she wants to translate the next sutra (1.3) in her book
    When she scrolls to the bottom of the translation section
    And she taps "Translate Another Passage"
    Then she should return to the camera view (step 2)
    And the guidance frame should be ready
    And she should be able to immediately position camera over next sutra
    And the workflow should feel efficient for multi-sutra study sessions

  # ============================================================================
  # INTEGRATION CHECKPOINTS
  # ============================================================================

  Scenario: Complete happy path - end to end
    Given Maria encounters Devanagari sutra 1.2 in her Yoga Sutras book
    When she opens the app and taps "Take Photo"
    And she positions camera over 4-line sutra in guidance frame
    And she captures photo
    And she verifies photo is clear in preview
    And she taps "Use This Photo"
    And she waits 5 seconds for processing
    And she sees high confidence (94%) verification screen
    And she scrolls to translation section
    And she reads the translation and word breakdown
    And she taps "Copy Translation"
    And she pastes into her study notes
    Then Maria should feel:
      | Emotional State        | Stage                    |
      | Blocked/Frustrated     | Before using app         |
      | Hopeful                | Seeing "Take Photo"      |
      | Trusting               | Camera guidance          |
      | Patient                | Processing               |
      | Reassured              | High confidence score    |
      | Empowered              | Understanding translation|
      | Grateful               | Barrier removed          |
    And the total time from camera open to copied translation should be under 60 seconds
    And Maria should be able to continue studying the next sutra

  # ============================================================================
  # SHARED ARTIFACT VALIDATION
  # ============================================================================

  Scenario: Shared artifacts flow through pipeline correctly
    Given Maria submits a photo for processing
    Then the following artifacts should flow through the system:
      | Artifact               | Source                    | Used In                          | Format            |
      | original_image         | Camera capture (step 3)   | OCR input, verification toggle   | JPEG/PNG buffer   |
      | extracted_devanagari   | GoogleVisionOcrEngine     | Verification display, normalizer | Unicode string    |
      | ocr_confidence         | GoogleVisionOcrEngine     | Trust indicator, warnings        | Float 0.0-1.0     |
      | iast_text              | ScriptNormalizer          | Verification display, translation| IAST string       |
      | word_breakdown         | LlmTranslationService     | Learning section                 | Array of objects  |
      | primary_translation    | LlmTranslationService     | Display, copy                    | String            |
      | alternative_translations| LlmTranslationService    | Comparative study                | Array of strings  |
    And each artifact should have a single source of truth
    And original_image should be deleted via cleanup() after translation
    And no orphaned data should remain in memory

  # ============================================================================
  # QUALITY GATES
  # ============================================================================

  Scenario: Emotional coherence across journey
    Given Maria completes a successful translation
    Then her emotional arc should be coherent:
      | Transition                    | No Jarring Shift                                |
      | Blocked → Hopeful             | Seeing clear "Take Photo" solution              |
      | Hopeful → Trusting            | Camera guidance frame supports composition      |
      | Trusting → Patient            | Processing feedback reassures progress          |
      | Patient → Reassured           | High confidence score validates extraction      |
      | Reassured → Empowered         | Translation unlocks sacred text meaning         |
      | Empowered → Grateful          | Barrier removed, spiritual study continues      |
    And anxiety should be addressed proactively via:
      | Anxiety                       | Mitigation                                      |
      | OCR errors in sacred text     | Confidence score + visual verification          |
      | Wasting time on poor quality  | Preview + retake option before submission       |
      | System not working            | Processing feedback during wait                 |
      | Low quality result            | Warning + guidance to retake with better light  |

  Scenario: Horizontal integration - no data gaps
    Given the journey processes a photo end-to-end
    Then every shared artifact should be tracked:
      | Artifact               | Tracked From                  | Tracked To                  |
      | original_image         | Capture (step 3)              | Cleanup after translation   |
      | extracted_devanagari   | OCR extraction (step 4)       | Verification (step 5)       |
      | ocr_confidence         | OCR extraction (step 4)       | Trust indicator (step 5)    |
      | iast_text              | Normalization (step 4)        | Verification + translation  |
      | word_breakdown         | Translation (step 4)          | Learning (step 6)           |
    And no artifact should have multiple sources
    And cleanup should be guaranteed even if errors occur (finally block)

  Scenario: Mobile UX compliance
    Given Maria uses the app on her mobile phone
    Then the UX should comply with mobile best practices:
      | Principle                     | Implementation                                  |
      | Progressive disclosure        | Translation hidden until verification complete  |
      | Clear affordances             | Buttons labeled with outcomes ("Use This Photo")|
      | Touch-friendly targets        | All buttons ≥44px tap area                      |
      | Material honesty              | Camera is camera, not trying to be scanner      |
      | Minimal cognitive load        | One decision per screen                         |
      | Immediate feedback            | Processing spinner + status within 1 second     |
