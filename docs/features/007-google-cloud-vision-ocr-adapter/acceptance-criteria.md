# Acceptance Criteria: Google Cloud Vision OCR Adapter

## Scope

The `GoogleVisionOcrEngine` adapter implements the `OcrEngine` port interface using the
Google Cloud Vision API. These criteria cover the adapter's behavior in isolation — it is
responsible for translating between the domain's `OcrEngine` contract and the Google Cloud
Vision API.

---

## Feature: Google Cloud Vision OCR Adapter

```gherkin
Feature: Google Cloud Vision OCR Adapter
  As the OCR translation system
  I want a Google Cloud Vision adapter that implements the OcrEngine interface
  So that I can extract Devanagari text from images using Google's Vision API

  Background:
    Given a GoogleVisionOcrEngine configured with valid Google Cloud credentials

  # ───────────────────────────────────────────────────────────────
  # Happy Path
  # ───────────────────────────────────────────────────────────────

  Scenario: Extract Devanagari text from a clear image
    Given a PNG image buffer containing clear Devanagari text "सत्यमेव जयते"
    And the Google Cloud Vision API returns that text with confidence 0.96
    When I call extractText with the image buffer
    Then the result text should be "सत्यमेव जयते"
    And the result confidence should be 0.96

  Scenario: Language hints are passed to the Vision API
    Given a PNG image buffer containing Devanagari text
    When I call extractText with language hints ["hi", "sa"]
    Then the Google Cloud Vision API request should include language hints ["hi", "sa"]

  Scenario: Detected language is returned in the result
    Given a PNG image buffer containing Devanagari text
    And the Google Cloud Vision API returns detected locale "sa"
    When I call extractText with the image buffer
    Then the result language should be "sa"

  Scenario: Per-word bounding boxes are returned when available
    Given a PNG image buffer with two words
    And the Vision API returns bounding box data for each word
    When I call extractText with the image buffer
    Then the result boundingBoxes should contain one entry per word
    And each entry should include the word text, confidence, and x/y/width/height values

  Scenario: Successful extraction from a JPEG image
    Given a JPEG image buffer containing Devanagari text
    And the Google Cloud Vision API returns the text successfully
    When I call extractText with the image buffer
    Then the result should contain the extracted text with a confidence score

  # ───────────────────────────────────────────────────────────────
  # Edge Cases
  # ───────────────────────────────────────────────────────────────

  Scenario: No text detected in image
    Given an image buffer containing no recognisable text
    And the Google Cloud Vision API returns an empty text annotation
    When I call extractText with the image buffer
    Then the result text should be ""
    And the result confidence should be 0.0

  Scenario: Mixed script image - adapter returns full API output
    Given an image buffer containing both Latin and Devanagari text
    And the Vision API returns the combined extracted text
    When I call extractText with the image buffer
    Then the result should contain the combined text as returned by the API
    And confidence should reflect the API-reported value

  Scenario: Confidence score is normalised to the 0.0-1.0 range
    Given the Vision API returns a confidence value expressed as a percentage (e.g. 95)
    When I call extractText with the image buffer
    Then the result confidence should be in the range 0.0 to 1.0

  # ───────────────────────────────────────────────────────────────
  # Error Conditions
  # ───────────────────────────────────────────────────────────────

  Scenario: Authentication failure - invalid credentials
    Given the Google Cloud credentials are invalid or expired
    And the Vision API returns an authentication error
    When I call extractText with an image buffer
    Then the adapter should throw an OcrAuthenticationError
    And the error message should indicate a credentials problem

  Scenario: API rate limit exceeded
    Given the Vision API returns a rate-limit error (429 / RESOURCE_EXHAUSTED)
    When I call extractText with an image buffer
    Then the adapter should throw an OcrRateLimitError
    And the error message should indicate that the rate limit was exceeded

  Scenario: API service unavailable (transient network failure)
    Given the Vision API returns a service-unavailable error (503 / UNAVAILABLE)
    When I call extractText with an image buffer
    Then the adapter should throw an OcrServiceUnavailableError
    And the error message should indicate that the Vision API is temporarily unavailable

  Scenario: Image rejected by the Vision API (invalid content)
    Given the Vision API returns an invalid-argument error for the image
    When I call extractText with that image buffer
    Then the adapter should throw an OcrInvalidImageError
    And the error message should describe the rejection reason

  Scenario: Unexpected API error is wrapped as OcrError
    Given the Vision API returns an unrecognised error code
    When I call extractText with an image buffer
    Then the adapter should throw an OcrError
    And the original error cause should be preserved
```
