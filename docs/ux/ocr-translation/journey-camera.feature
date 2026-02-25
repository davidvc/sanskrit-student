Feature: Camera OCR Translation for Sanskrit Study
  As a spiritual practitioner studying Sanskrit
  Who cannot read or type Devanagari script
  I want to photograph Devanagari text and receive accurate translations
  So that I can deepen my spiritual practice without script barriers

  Background:
    Given I am studying a physical Sanskrit book (Yoga Sutras)
    And I encounter a Devanagari sutra I cannot read
    And I have the mobile app installed

  # Happy Path - High Confidence Extraction
  
  Scenario: Successfully translate clear 4-line Devanagari sutra
    Given I open the Sanskrit Student app
    When I tap "Take Photo"
    Then the camera should open with a landscape frame overlay
    And I should see guidance "Best results: photograph 2-6 lines"
    
    When I position the camera over a 4-line sutra in the book
    And I tap the shutter button
    Then I should see a preview of the captured photo
    And I should see the prompt "Is the text clear and in focus?"
    
    When I verify the text is clear and tap "Use This Photo"
    Then I should see progressive status messages:
      | Uploading image...         |
      | Reading Devanagari text... |
      | Translating...             |
    And the total processing time should be under 5 seconds
    
    Then I should see a "High Confidence (96%)" badge in green
    And I should see a side-by-side comparison:
      | Original Photo (thumbnail) | Extracted Devanagari Text |
    And I should be able to tap the original photo to expand it
    And I should be able to tap the extracted text to copy it
    
    When I scroll down
    Then I should see the IAST transliteration with a Copy button
    And I should see an expandable word-by-word breakdown
    And I should see the primary translation with a Copy button
    And I should see collapsible alternative translations
    
    When I tap Copy next to the IAST text
    Then the IAST should be copied to my clipboard
    And I should see a confirmation message "Copied!"
    
    And I should feel empowered to continue my study
    And I should trust the translation accuracy
    And I can paste the result into my study notes

  # Trust Verification Path
  
  Scenario: OCR extraction with high confidence builds trust
    Given I have photographed a clear Devanagari sutra
    When the OCR completes with 96% confidence
    Then I should see a "High Confidence (96%)" badge in green
    And I should see the extracted Devanagari next to my original photo
    And I should be able to visually verify the extraction matches
    And I should feel confident proceeding to study the translation

  # Low Confidence Warning Path
  
  Scenario: Poor quality image produces low confidence warning with guidance
    Given I open the camera and photograph a blurry sutra
    When I confirm the preview (even though it's blurry)
    And OCR completes with 65% confidence
    Then I should see a "Low Confidence (65%)" badge in orange
    And I should see the warning:
      """
      Image quality may affect accuracy.
      For better results: Retake with better lighting, less blur,
      or crop closer to text.
      """
    And I should see the extracted text flagged as "may contain errors"
    And I should see two options:
      | ↻ Upload Different Image    |
      | ↓ See Translation Anyway    |
    
    When I tap "Upload Different Image"
    Then I should return to the camera view
    And I can retake the photo with better lighting
    And I should not have to start over from the home screen

  # Error Recovery Path - File Too Large
  
  Scenario: Upload fails due to file size limit
    Given I have photographed a high-resolution image (6.2 MB)
    When the upload begins
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
    And I can crop more tightly or adjust camera settings

  # Error Recovery Path - Unsupported Format
  
  Scenario: Upload fails due to unsupported image format
    Given I somehow upload a PDF file (edge case)
    When the upload validation runs
    Then I should see an error message:
      """
      ❌ Format not supported (.pdf)
         Please use PNG, JPG, or WEBP images.
      """
    And I should see a "Try Again" button
    And I should feel informed about what went wrong

  # First-Time User Experience
  
  Scenario: First-time user sees helpful lighting tip
    Given I am using the app for the first time
    When I tap "Take Photo" to launch the camera
    Then I should see a tip message:
      """
      💡 Tip: Use bright, even lighting for best results
      """
    And the tip should display for 3 seconds
    And it should disappear automatically
    And I should only see this tip on my first use

  # Multi-Line Sutra Handling
  
  Scenario: Photograph 6-line sutra (longer than typical)
    Given I encounter a 6-line sutra in my book
    When I position the camera to frame all 6 lines
    And I capture and confirm the photo
    Then the OCR should successfully extract all 6 lines
    And the confidence score should reflect the increased complexity
    And the translation should maintain line structure

  # Copy to Study Notes Workflow
  
  Scenario: Copy translation to study notes
    Given I have received a successful translation
    When I tap the Copy button next to the translation
    Then the translation text should be copied to my clipboard
    And I should see "Copied!" confirmation
    
    When I switch to my Notes app
    And I paste the clipboard content
    Then I should see the full translation text
    And I can annotate it with my own study notes

  # Visual Comparison for Non-Devanagari Readers
  
  Scenario: Verify extraction despite not reading Devanagari
    Given I cannot read Devanagari script
    But I have photographed a clear sutra
    When I see the side-by-side comparison
    Then I can visually pattern-match the characters
    And I can identify if the extracted text "looks like" the photo
    And I can spot obvious OCR errors (gibberish, missing lines)
    Even though I cannot read the actual content

  # Emotional Journey - Blocked to Empowered
  
  Scenario: Complete emotional arc from blocked to empowered
    Given I feel blocked by Devanagari script (cannot read it)
    And I feel hopeful when I see "Take Photo" option
    
    When I focus on photographing the text clearly
    And I verify the preview looks sharp
    And I trust the processing indicators
    
    Then I feel relieved when I see "High Confidence (96%)"
    And I feel analytical while comparing extraction to photo
    And I feel empowered when I understand the translation
    And I feel grateful for accessing sacred wisdom
    And I can continue my spiritual study without barriers

  # Shared Artifacts Lifecycle
  
  Scenario: Artifacts are created and used throughout journey
    Given I photograph a Devanagari sutra
    Then ${originalImage} should be created from camera capture
    And ${originalImage} should be shown in preview confirmation
    And ${originalImage} should be displayed in trust verification
    
    When OCR completes
    Then ${extractedDevanagari} should be created by OCR engine
    And ${ocrConfidence} should be calculated (0.0-1.0)
    And ${iastText} should be created by script normalizer
    And ${wordBreakdown} should be created by LLM translation
    And ${alternativeTranslations} should be created by LLM
    
    And all artifacts should be available in translation display
    And ${originalImage} should be deleted after session ends (ephemeral)
    And translation artifacts should persist during session

  # Success Metrics
  
  Scenario: Feature meets performance and quality targets
    Given I photograph a clear 4-line Devanagari sutra
    Then photo-to-translation time should be under 5 seconds
    And confidence score should be >= 90%
    And I should successfully copy the result to my notes
    And I should return to use the feature for the next sutra
    And I should feel that this is faster than finding translations online
