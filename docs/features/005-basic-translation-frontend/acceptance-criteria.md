# Acceptance Criteria: Basic Translation Frontend

## Feature: Web Interface for Sanskrit Translation

As a Sanskrit student,
I want to translate Sanskrit text through a simple web interface,
So that I can easily access translation services without using the CLI or GraphQL API.

### Scenario: Successful translation of IAST text

```gherkin
Given I am on the translation frontend page
And the GraphQL server is running
When I enter "atha yoganusasanam" in the translation input field
And I click the "Translate" button
Then I should see the original text "atha yoganusasanam"
And I should see the IAST text "atha yogānuśāsanam"
And I should see a word breakdown with "atha" meaning "now, here begins"
And I should see alternative translations
```

### Scenario: Successful translation of Devanagari text

```gherkin
Given I am on the translation frontend page
And the GraphQL server is running
When I enter "अथ योगानुशासनम्" in the translation input field
And I click the "Translate" button
Then I should see the original text "अथ योगानुशासनम्"
And I should see the IAST text "atha yogānuśāsanam"
And I should see a word breakdown
And I should see alternative translations
```

### Scenario: Empty input validation

```gherkin
Given I am on the translation frontend page
And the translation input field is empty
When I click the "Translate" button
Then I should see an error message "Please enter Sanskrit text to translate"
And no translation request should be sent to the server
```

### Scenario: Loading state during translation

```gherkin
Given I am on the translation frontend page
When I enter "om" in the translation input field
And I click the "Translate" button
Then I should see a loading indicator
And the "Translate" button should be disabled
When the translation completes
Then the loading indicator should disappear
And the "Translate" button should be enabled
```

### Scenario: Server error handling

```gherkin
Given I am on the translation frontend page
And the GraphQL server returns an error
When I submit a translation request
Then I should see an error message explaining the problem
And I should be able to retry the translation
```

### Scenario: Multi-line text support

```gherkin
Given I am on the translation frontend page
When I enter multiple lines of Sanskrit text in the input field
And I click the "Translate" button
Then I should see each line translated separately
And each line should have its own word breakdown
```

### Scenario: Clear previous results

```gherkin
Given I am on the translation frontend page
And I have previously translated text showing on the page
When I enter new text in the input field
And I click the "Translate" button
Then the previous translation results should be cleared
And only the new translation should be displayed
```

### Scenario: Responsive layout

```gherkin
Given I access the translation page on a mobile device
Then the layout should be optimized for mobile viewing
And all controls should be accessible
And text should be readable without horizontal scrolling
```

### Scenario: Copy translation results

```gherkin
Given I am on the translation frontend page
And I have a successful translation displayed
When I click the "Copy" button next to the IAST text
Then the IAST text should be copied to my clipboard
And I should see a confirmation message
```

### Scenario: Alternative translation display

```gherkin
Given I am on the translation frontend page
And I have a successful translation with multiple alternatives
When I view the alternative translations section
Then I should see up to 3 alternative translations
And each alternative should be clearly separated and readable
```

---

## Input/Output Specifications

### Input Format
- Sanskrit text in either:
  - IAST (International Alphabet of Sanskrit Transliteration)
  - Devanagari script
- Support for single-line and multi-line input
- Examples of valid input:
  - `yogaś citta-vṛtti-nirodhaḥ`
  - `अथ योगानुशासनम्`

### Output Format
1. **Original Text Display**
   - Shows the text exactly as entered by the user
   - Displayed as an array (one entry per line)

2. **IAST Text Display**
   - Normalized IAST transliteration
   - Displayed as an array (one entry per line)

3. **Word-by-word Breakdown**
   - Each word shown separately
   - Multiple meanings per word when applicable
   - Clear separation between words

4. **Alternative Translations**
   - List of alternative complete translations
   - Clear labeling of each alternative
   - Up to 3 alternatives displayed

### UI Requirements
- Single-page application
- Text input area (textarea for multi-line support)
- "Translate" button
- Results display area
- Loading indicator during translation
- Error message display area
- Copy button for IAST text
- Responsive design (mobile-friendly)

### Non-Functional Requirements
- Client-side input validation before API calls
- Graceful error handling with user-friendly messages
- Loading states for better UX
- Accessible design (keyboard navigation, screen reader support)
