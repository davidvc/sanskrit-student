Feature: Devanagari OCR Image to Translation
  As a Sanskrit student
  I want to upload images containing Devanagari text
  So that I can get accurate OCR extraction and word-by-word translations

  Background:
    Given the system has access to a Devanagari-optimized OCR service
    And the translation service is available

  Scenario: Successfully extract and translate clear Devanagari text from image
    Given I have an image containing clear Devanagari text "सत्यमेव जयते"
    When I upload the image to the OCR translation endpoint
    Then the system should extract the Devanagari text "सत्यमेव जयते"
    And the system should provide IAST transliteration "satyameva jayate"
    And the system should provide word-by-word breakdown:
      | Devanagari | IAST      | Translation        |
      | सत्यम्    | satyam    | truth              |
      | एव        | eva       | indeed/only        |
      | जयते      | jayate    | conquers/prevails  |
    And the system should provide full translation "Truth alone triumphs"

  Scenario: Extract and translate from image with Devanagari manuscript style
    Given I have an image containing manuscript-style Devanagari text
    When I upload the image to the OCR translation endpoint
    Then the system should successfully extract the Devanagari text
    And the system should handle ligatures and conjunct characters correctly
    And the system should provide accurate IAST transliteration
    And the system should provide word-by-word translation

  Scenario: Handle image with both Devanagari and Latin script
    Given I have an image containing mixed Devanagari and Latin text
    When I upload the image to the OCR translation endpoint
    Then the system should extract only the Devanagari portions
    And the system should ignore or separate Latin text
    And the system should translate the Devanagari text accurately

  Scenario: Return IAST output when requested
    Given I have an image containing Devanagari text
    When I upload the image with output format "IAST"
    Then the system should extract the text
    And the system should return the transliteration in IAST format
    And the system should provide word-by-word translation with IAST headwords

  Scenario: Return Devanagari output when requested
    Given I have an image containing Devanagari text
    When I upload the image with output format "Devanagari"
    Then the system should extract the text
    And the system should return the text in Devanagari script
    And the system should provide word-by-word translation with Devanagari headwords

  Scenario: Handle poor quality image with noise
    Given I have a low-quality image with visual noise
    When I upload the image to the OCR translation endpoint
    Then the system should attempt OCR extraction
    And if confidence is below threshold, the system should return a warning
    And the system should provide the best-effort extraction with confidence scores
    And the system should still attempt translation with low-confidence markers

  Scenario: Handle image with no Devanagari text
    Given I have an image with no Devanagari script
    When I upload the image to the OCR translation endpoint
    Then the system should return an error message "No Devanagari text detected"
    And the system should provide HTTP status 422 (Unprocessable Entity)
    And the system should not attempt translation

  Scenario: Handle unsupported image format
    Given I have a file in an unsupported format (e.g., .txt, .doc)
    When I upload the file to the OCR translation endpoint
    Then the system should return an error message "Unsupported image format"
    And the system should list supported formats (PNG, JPG, JPEG, WEBP, TIFF)
    And the system should provide HTTP status 400 (Bad Request)

  Scenario: Handle oversized image file
    Given I have an image file larger than the maximum allowed size (10MB)
    When I upload the image to the OCR translation endpoint
    Then the system should return an error message "Image file too large"
    And the system should specify the maximum allowed size
    And the system should provide HTTP status 413 (Payload Too Large)

  Scenario: Handle corrupted or invalid image file
    Given I have a corrupted image file
    When I upload the file to the OCR translation endpoint
    Then the system should return an error message "Invalid or corrupted image file"
    And the system should provide HTTP status 400 (Bad Request)

  Scenario: Extract text from image with multiple lines
    Given I have an image containing multiple lines of Devanagari text
    When I upload the image to the OCR translation endpoint
    Then the system should extract text preserving line breaks
    And the system should translate each line separately
    And the system should maintain the original text structure in the output

  Scenario: Handle image with sandhi (word joining)
    Given I have an image containing text with sandhi combinations
    When I upload the image to the OCR translation endpoint
    Then the system should extract the combined text correctly
    And the system should attempt sandhi splitting for translation
    And the system should provide word-by-word breakdown of split components

  Scenario: Performance requirement - process standard image in reasonable time
    Given I have a standard quality image (1-2 MB, ~500 characters)
    When I upload the image to the OCR translation endpoint
    Then the system should complete OCR extraction within 5 seconds
    And the system should complete translation within 10 seconds total
    And the system should return results within 15 seconds end-to-end

  Scenario: API returns OCR confidence scores
    Given I have an image with varying text clarity
    When I upload the image to the OCR translation endpoint
    Then the system should include OCR confidence scores in the response
    And confidence scores should be per-word or per-character
    And low-confidence extractions should be flagged in the output
