# Acceptance Criteria: Camera OCR Translation

**Format:** Given-When-Then (Gherkin-style)  
**Purpose:** Testable criteria for each user story  
**Traces to:** User Stories → Job Stories → Journey Phases

---

## AC-1: Launch Camera from Home Screen
**User Story:** Story 1 (Photograph Devanagari Text)

```gherkin
Given I am a spiritual practitioner studying a Sanskrit book
And I encounter Devanagari text I cannot read
When I open the Sanskrit Student app
Then I should see a "Take Photo" button prominently displayed

When I tap the "Take Photo" button
Then the device camera should open within 1 second
And I should see a landscape frame overlay (70% screen width)
And I should see guidance text: "Best results: photograph 2-6 lines"
```

**Test Data:** N/A  
**Expected Outcome:** Camera opens quickly with clear guidance

---

## AC-2: Capture Photo with Manual Shutter
**User Story:** Story 1 (Photograph Devanagari Text)

```gherkin
Given the camera is open
And I have positioned my phone over a 4-line Devanagari sutra
When I tap the shutter button
Then a photo should be captured
And I should immediately see a preview of the captured photo
```

**Test Data:** Physical Sanskrit book with 4-line sutra  
**Expected Outcome:** Photo captured and preview shown

---

## AC-3: Preview Photo and Verify Quality
**User Story:** Story 2 (Verify Photo Quality)

```gherkin
Given I have captured a photo
When the preview displays
Then I should see the captured photo
And I should see the prompt: "Is the text clear and in focus?"
And I should see two buttons: "Use This Photo" and "Retake"

When I pinch-to-zoom on the preview
Then the preview should zoom in for detailed inspection
And I can verify the Devanagari text is sharp and readable
```

**Test Data:** Test photo with varying focus levels  
**Expected Outcome:** User can zoom and verify quality

---

## AC-4: Retake Photo if Quality is Poor
**User Story:** Story 2 (Verify Photo Quality)

```gherkin
Given I am viewing the photo preview
And I notice the photo is blurry
When I tap the "Retake" button
Then I should return to the camera view
And I should still see the frame overlay and guidance
And my previous session should not be lost
```

**Test Data:** Intentionally blurry photo  
**Expected Outcome:** Seamless return to camera for retake

---

## AC-5: Submit Clear Photo for Processing
**User Story:** Story 2, Story 3

```gherkin
Given I am viewing the photo preview
And the photo appears clear and focused
When I tap "Use This Photo"
Then the photo should be submitted for OCR processing
And I should immediately see "Uploading image..." progress message
```

**Test Data:** Clear photo of 4-line Devanagari sutra  
**Expected Outcome:** Processing begins with progress feedback

---

## AC-6: Extract Devanagari Text with High Confidence
**User Story:** Story 3 (Extract with OCR)

```gherkin
Given I have submitted a clear photo of Devanagari text
When OCR processing completes
Then the extracted Devanagari text should match the original
And the confidence score should be ≥ 90%
And the extracted text should be UTF-8 encoded

Example:
  | Original Text | Extracted Text | Confidence |
  | सत्यमेव जयते | सत्यमेव जयते | 0.96       |
```

**Test Data:** High-quality photo of printed Devanagari text  
**Expected Outcome:** Accurate extraction with high confidence

---

## AC-7: Display High Confidence Badge
**User Story:** Story 4 (Confidence Score Display)

```gherkin
Given OCR extraction completed with 96% confidence
When the results page displays
Then I should see a green badge labeled "High Confidence (96%)"
And the badge should be prominently placed at the top
```

**Test Data:** Mock OCR result with 0.96 confidence  
**Expected Outcome:** Green badge displayed correctly

---

## AC-8: Display Side-by-Side Comparison
**User Story:** Story 4 (Visual Verification)

```gherkin
Given OCR extraction has completed
When the results page displays
Then I should see a side-by-side comparison:
  | Left Column         | Right Column            |
  | Original Photo      | Extracted Devanagari    |
  | (thumbnail, tappable) | (text, copyable)      |

When I tap the original photo thumbnail
Then the photo should expand to full-screen
And I can pinch-to-zoom for detailed inspection

When I tap the extracted Devanagari text
Then it should be copied to my clipboard
And I should see "Copied!" confirmation
```

**Test Data:** OCR result with extracted text  
**Expected Outcome:** Comparison enables visual verification

---

## AC-9: Warn on Low Confidence with Actionable Guidance
**User Story:** Story 5 (Low Confidence Guidance)

```gherkin
Given I submitted a blurry photo
And OCR extraction completed with 65% confidence
When the results page displays
Then I should see an orange badge labeled "Low Confidence (65%)"
And I should see warning message:
  """
  ⚠️ Image quality may affect accuracy.
  For better results: Retake with better lighting, less blur,
  or crop closer to text.
  """
And I should see two options:
  | ↻ Upload Different Image  |
  | ↓ See Translation Anyway  |

When I tap "Upload Different Image"
Then I should return to the camera view
And I can immediately retake the photo
```

**Test Data:** Poor quality photo (blurry, low lighting)  
**Expected Outcome:** Clear warning with actionable guidance and easy retry

---

## AC-10: Convert Devanagari to IAST
**User Story:** Story 6 (IAST Transliteration)

```gherkin
Given OCR extracted "सत्यमेव जयते"
When script normalization completes
Then I should see IAST transliteration: "satyameva jayate"
And the IAST should be displayed in a section labeled "IAST Transliteration:"
And there should be a Copy button next to it

When I tap the Copy button
Then "satyameva jayate" should be copied to my clipboard
And I should see "Copied!" confirmation message
```

**Test Data:** Devanagari text "सत्यमेव जयते"  
**Expected Outcome:** IAST "satyameva jayate" with copy functionality

---

## AC-11: Display Word-by-Word Breakdown
**User Story:** Story 7 (Word Breakdown)

```gherkin
Given translation has completed for "satyameva jayate"
When I scroll to the word breakdown section
Then I should see a list of words:
  | satyam  | [▷] |
  | eva     | [▷] |
  | jayate  | [▷] |

When I tap on "satyam [▷]"
Then it should expand to show meanings:
  | satyam (सत्यम्)                    |
  | Meanings: truth, reality, truthfulness |

When I tap "Expand All"
Then all words should expand to show their meanings
```

**Test Data:** Translation result with word breakdown  
**Expected Outcome:** Expandable word list with meanings

---

## AC-12: Display Primary Translation
**User Story:** Story 8 (Primary Translation)

```gherkin
Given translation has completed
When I view the translation section
Then I should see "Translation:" label
And I should see the primary translation: "Truth alone triumphs"
And there should be a Copy button next to it

When I tap the Copy button
Then "Truth alone triumphs" should be copied to my clipboard
```

**Test Data:** Translation result  
**Expected Outcome:** Primary translation with copy button

---

## AC-13: Display Alternative Translations
**User Story:** Story 8 (Alternative Translations)

```gherkin
Given translation has completed
When I view the results page
Then I should see a collapsible section "Alternative Translations [▽]"
And the section should be collapsed by default

When I tap "Alternative Translations [▽]"
Then it should expand to show alternatives:
  | • Truth conquers all           |
  | • Truth ultimately prevails    |
  | • Reality alone is victorious  |
```

**Test Data:** Translation result with alternatives  
**Expected Outcome:** Collapsible alternatives provide interpretative variety

---

## AC-14: Show Processing Progress Messages
**User Story:** Story 9 (Processing Progress)

```gherkin
Given I have submitted a photo for processing
When upload begins
Then I should see "Uploading image..." with a progress indicator

When OCR begins
Then I should see "Reading Devanagari text..."

When translation begins
Then I should see "Translating..."

When all processing completes
Then total time should be under 5 seconds
```

**Test Data:** Typical photo (2 MB, 4 lines of text)  
**Expected Outcome:** Clear progress feedback, fast completion

---

## AC-15: Reject File Too Large
**User Story:** Story 10 (File Size Error Recovery)

```gherkin
Given I have captured a very high-resolution photo (6.2 MB)
When upload validation runs
Then I should see an error message:
  """
  ❌ Image too large (6.2 MB)
     Maximum file size is 5 MB.
  
  Suggested fix:
  • Crop image to just the text area
  • Reduce photo quality in camera settings
  """
And I should see a "Try Again" button

When I tap "Try Again"
Then I should return to the camera view
And I can crop more tightly to reduce file size
```

**Test Data:** 6.2 MB image file  
**Expected Outcome:** Clear error with actionable guidance

---

## AC-16: Reject Unsupported Format
**User Story:** Story 11 (Format Error Recovery)

```gherkin
Given I somehow upload a PDF file (edge case)
When format validation runs
Then I should see an error message:
  """
  ❌ Format not supported (.pdf)
     Please use PNG, JPG, or WEBP images.
  """
And I should see a "Try Again" button
```

**Test Data:** PDF file  
**Expected Outcome:** Clear format error message

---

## AC-17: Show Lighting Tip on First Use
**User Story:** Story 12 (First-Use Tip)

```gherkin
Given I am using the app for the first time
And I have never seen the lighting tip before
When I tap "Take Photo" to launch the camera
Then I should see a tip message:
  """
  💡 Tip: Use bright, even lighting for best results
  """
And the tip should display for 3 seconds
And then disappear automatically

Given I use the app a second time
When I tap "Take Photo"
Then I should NOT see the lighting tip again
```

**Test Data:** First-use flag (not set)  
**Expected Outcome:** Tip shows once, never again

---

## AC-18: Reject Extremely Low Confidence
**User Story:** Story 3 (OCR Extraction)

```gherkin
Given I submitted a photo with no readable Devanagari text
When OCR processing completes with confidence < 10%
Then I should see an error message:
  """
  ❌ No readable text detected.
     Please retake with a clearer image of Devanagari text.
  """
And processing should not proceed to translation
```

**Test Data:** Blank page or non-Devanagari image  
**Expected Outcome:** Early rejection prevents wasted translation calls

---

## AC-19: Handle Multi-Line Sutras
**User Story:** Story 3 (OCR Extraction)

```gherkin
Given I photograph a 6-line sutra (longer than typical)
When OCR processing completes
Then all 6 lines should be extracted
And line structure should be preserved
And confidence score should reflect the complexity

Example:
  | Lines | Confidence |
  | 2     | 96%        |
  | 4     | 94%        |
  | 6     | 91%        |
```

**Test Data:** 6-line Devanagari sutra  
**Expected Outcome:** All lines extracted, structure preserved

---

## AC-20: Ephemeral Image Lifecycle
**Non-Functional Requirement: Privacy**

```gherkin
Given I have submitted a photo for translation
When processing completes (success or failure)
Then the ${originalImage} should be deleted from memory
And no trace of the image should remain in storage
And deletion should occur even if errors happen (finally block)

Given the user's session ends
When they close the app
Then all translation artifacts should be cleared
And no persistent data should remain
```

**Test Data:** Memory inspection after translation  
**Expected Outcome:** No image data persists

---

## Acceptance Criteria Summary

| AC # | Story | Priority | Status |
|------|-------|----------|--------|
| AC-1 | Story 1 | Must Have | Ready |
| AC-2 | Story 1 | Must Have | Ready |
| AC-3 | Story 2 | Must Have | Ready |
| AC-4 | Story 2 | Must Have | Ready |
| AC-5 | Story 2, 3 | Must Have | Ready |
| AC-6 | Story 3 | Must Have | Ready |
| AC-7 | Story 4 | Must Have | Ready |
| AC-8 | Story 4 | Must Have | Ready |
| AC-9 | Story 5 | Must Have | Ready |
| AC-10 | Story 6 | Must Have | Ready |
| AC-11 | Story 7 | Must Have | Ready |
| AC-12 | Story 8 | Must Have | Ready |
| AC-13 | Story 8 | Must Have | Ready |
| AC-14 | Story 9 | Must Have | Ready |
| AC-15 | Story 10 | Should Have | Ready |
| AC-16 | Story 11 | Should Have | Ready |
| AC-17 | Story 12 | Should Have | Ready |
| AC-18 | Story 3 | Must Have | Ready |
| AC-19 | Story 3 | Must Have | Ready |
| AC-20 | NFR-Privacy | Must Have | Ready |

**Total Acceptance Criteria:** 20  
**All criteria are testable and traceable to user stories and job stories.**

---

**Next:** Definition of Ready (DoR) Checklist
