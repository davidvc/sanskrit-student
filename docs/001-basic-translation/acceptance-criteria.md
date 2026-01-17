# Acceptance Criteria: Basic Sanskrit Sutra Translation

## Feature: Sanskrit Sutra Word-by-Word Translation

As a Sanskrit student,
I want to get the meanings of individual words in a Sanskrit sutra provided in IAST transliteration,
So that I can understand the components of the sutra before seeing full translations.

### Scenario: Display word meanings for a simple sutra

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I submit the sutra for translation
Then I should see each word from the sutra listed separately
And each word should have its grammatical form identified
And each word should have one or more meanings provided
```

### Scenario: Handle compound words (sandhi)

```gherkin
Given I have a Sanskrit sutra containing compound words
When I submit the sutra for translation
Then compound words should be broken down into their component parts
And the original compound form should be shown
And meanings for each component should be provided
```

### Scenario: Handle words with multiple possible meanings

```gherkin
Given I have a Sanskrit sutra with ambiguous words
When I submit the sutra for translation
Then words with multiple meanings should show all relevant meanings
And the most contextually appropriate meaning should be indicated when possible
```

---

## Feature: Sanskrit Sutra Full Translation

As a Sanskrit student,
I want to see multiple alternate translations of a complete sutra,
So that I can understand different interpretive approaches to the text.

### Scenario: Provide multiple translation alternatives

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I submit the sutra for translation
Then I should receive at least two alternate translations of the full sutra
And each translation should represent a valid interpretation of the original
And translations should vary in style or interpretive emphasis
```

### Scenario: Preserve sutra context in translations

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I receive alternate translations
Then each translation should maintain the essential meaning of the original
And philosophical or technical terms should be translated consistently
And any significant interpretive choices should be noted
```

---

## Input/Output Specifications

### Input Format
- Sanskrit text in IAST (International Alphabet of Sanskrit Transliteration)
- Examples of valid input: `yogaś citta-vṛtti-nirodhaḥ`, `atha yogānuśāsanam`

### Output Format
1. **Word-by-word breakdown**
   - Original word (IAST)
   - Grammatical information (case, number, gender, tense, etc.)
   - English meaning(s)

2. **Full translations**
   - Minimum of 2 alternate translations
   - Each translation clearly labeled
