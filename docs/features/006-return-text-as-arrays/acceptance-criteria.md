# Acceptance Criteria: Multi-line Output as Arrays

## Context
Currently, when translating multi-line text (e.g., from OCR images), the `originalText` and `iastText` fields contain a single string with embedded newline characters (`\n`). This makes it harder for clients to display the text line-by-line without additional parsing.

## Current Behavior
- `originalText`: `"असतो मा सद्गमय\nतमसो मा ज्योतिर्गमय"` (single string with `\n`)
- `iastText`: `"asato mā sadgamaya\ntamaso mā jyotirgamaya"` (single string with `\n`)

## Desired Behavior
- `originalText`: `["असतो मा सद्गमय", "तमसो मा ज्योतिर्गमय"]` (array of strings, one per line)
- `iastText`: `["asato mā sadgamaya", "tamaso mā jyotirgamaya"]` (array of strings, one per line)

---

## AC1: Single-line text returns single-element arrays

```gherkin
Given a user submits single-line text (no newlines)
When the translation completes
Then originalText should be an array with one element containing the text
And iastText should be an array with one element containing the text
```

**Example:**
- Input: `"atha yoganusasanam"`
- `originalText`: `["atha yoganusasanam"]`
- `iastText`: `["atha yoganusasanam"]`

---

## AC2: Multi-line text returns multi-element arrays

```gherkin
Given a user submits multi-line text (with newlines)
When the translation completes
Then originalText should be an array with one element per line
And iastText should be an array with one element per line
And each array should have the same number of elements
```

**Example:**
- Input (Devanagari): `"असतो मा सद्गमय\nतमसो मा ज्योतिर्गमय"`
- `originalText`: `["असतो मा सद्गमय", "तमसो मा ज्योतिर्गमय"]`
- `iastText`: `["asato mā sadgamaya", "tamaso mā jyotirgamaya"]`

---

## AC3: Empty lines are preserved in the arrays

```gherkin
Given a user submits text with empty lines
When the translation completes
Then originalText should include empty strings for empty lines
And iastText should include empty strings for empty lines
```

**Example:**
- Input: `"line1\n\nline3"`
- `originalText`: `["line1", "", "line3"]`
- `iastText`: `["line1", "", "line3"]`

---

## AC4: OCR translation preserves multi-line structure

```gherkin
Given a user uploads an image with multi-line Devanagari text
When the OCR translation completes
Then extractedText should remain as a string with \n (no change to this field)
And originalText should be an array with one element per line
And iastText should be an array with one element per line
```

**Example (from AC11 test):**
- OCR `extractedText`: `"असतो मा सद्गमय\nतमसो मा ज्योतिर्गमय"` (unchanged, still a string)
- `originalText`: `["असतो मा सद्गमय", "तमसो मा ज्योतिर्गमय"]` (array)
- `iastText`: `["asato mā sadgamaya", "tamaso mā jyotirgamaya"]` (array)

---

## AC5: GraphQL schema reflects the new array types

```gherkin
Given the GraphQL schema is updated
When a client queries the schema
Then originalText should be typed as [String!]!
And iastText should be typed as [String!]!
And the schema should validate that arrays are non-null and contain non-null strings
```

---

## AC6: All existing tests pass with updated implementation

```gherkin
Given all existing acceptance and unit tests are updated
When the test suite runs
Then all tests should pass
And no regressions should be introduced
```

---

## AC7: Backward compatibility is NOT maintained

**Note:** This is a BREAKING change to the API contract.
- Clients currently expecting `originalText` and `iastText` as strings will need to update.
- This is acceptable for this internal project.
- Documentation should clearly note the change.

---

## Success Criteria Summary
1. ✅ Single-line text returns arrays with one element
2. ✅ Multi-line text returns arrays with one element per line
3. ✅ Empty lines are preserved as empty strings in arrays
4. ✅ OCR `extractedText` remains unchanged (string with `\n`)
5. ✅ GraphQL schema updated to `[String!]!` for both fields
6. ✅ All tests pass (acceptance + unit)
7. ✅ Documentation updated to reflect breaking change
