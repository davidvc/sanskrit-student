# Shared Artifacts Registry: Camera OCR Translation

This document tracks all shared artifacts (data that flows between journey phases) and their single sources of truth.

---

## Artifact: ${originalImage}

**Description:** Photo captured by user's phone camera of Devanagari text in physical book

**Type:** `image_buffer` (JPEG format)

**Source of Truth:** User's camera capture (Phase: camera_capture)

**Created:** When user taps shutter button and captures photo

**Lifecycle:** Ephemeral (deleted after translation completes)

**Maximum Size:** 5 MB

**Used In:**
- `preview_confirm` phase - User verifies photo quality before submitting
- `trust_verification` phase - Displayed side-by-side with extracted text
- `processing` phase - Uploaded to OCR service

**Access Pattern:**
- Stored in memory during session
- Never persisted to disk (privacy)
- Deleted in finally block after translation
- User can tap to expand full-screen for detailed inspection

**Validation:**
- Format: PNG, JPG, JPEG, WEBP, TIFF
- Size: ≤ 5 MB
- Magic bytes verification (not just MIME type)

---

## Artifact: ${extractedDevanagari}

**Description:** Devanagari text extracted by OCR engine from ${originalImage}

**Type:** `text` (UTF-8 encoded string)

**Source of Truth:** Google Cloud Vision OCR API (Phase: processing)

**Created:** When OCR completes extraction

**Lifecycle:** Session (available throughout user session, not persisted)

**Used In:**
- `trust_verification` phase - Displayed next to original photo for comparison
- `translation_display` phase - Shown as intermediate artifact before IAST

**Access Pattern:**
- Copyable (user can tap to copy to clipboard)
- Read-only (user cannot edit)
- Visually comparable to ${originalImage} even for non-Devanagari readers

**Associated Metadata:**
- `${ocrConfidence}` - Confidence score for this extraction (0.0-1.0)
- OCR language hint: Hindi/Sanskrit (`hi`, `sa`)

---

## Artifact: ${ocrConfidence}

**Description:** Confidence score indicating OCR extraction quality

**Type:** `float` (range: 0.0 to 1.0)

**Source of Truth:** Google Cloud Vision OCR API (Phase: processing)

**Created:** When OCR completes extraction (alongside ${extractedDevanagari})

**Lifecycle:** Session

**Used In:**
- `trust_verification` phase - Displayed as color-coded badge
- Determines whether to show warnings or proceed normally

**Display Mapping:**
| Confidence Range | Badge | Color | Action |
|------------------|-------|-------|--------|
| ≥ 0.90 | "High Confidence (X%)" | Green | Proceed normally |
| 0.70 - 0.89 | "Medium Confidence (X%)" | Yellow | Proceed with note |
| < 0.70 | "Low Confidence (X%)" | Orange | Show warning + guidance |
| < 0.10 | N/A | Red | Reject (no readable text) |

**Business Logic:**
```typescript
if (ocrConfidence < 0.10) {
  throw new Error("No readable text detected. Please retake with clearer image.");
}

if (ocrConfidence < 0.70) {
  showWarning("Image quality may affect accuracy. Retake with better lighting?");
}
```

---

## Artifact: ${iastText}

**Description:** IAST (International Alphabet of Sanskrit Transliteration) representation of Devanagari text

**Type:** `text` (ASCII-compatible string)

**Source of Truth:** Script Normalizer service (Phase: processing)

**Created:** After ${extractedDevanagari} is normalized from Devanagari → IAST

**Lifecycle:** Session

**Used In:**
- `translation_display` phase - Primary transliteration output
- User study notes (copyable)

**Access Pattern:**
- Copyable with dedicated Copy button
- Read-only
- Displayed prominently (users CAN read this, unlike Devanagari)

**Example:**
```
Devanagari: सत्यमेव जयते
IAST:       satyameva jayate
```

---

## Artifact: ${wordBreakdown}

**Description:** Structured word-by-word meanings for each word in the sutra

**Type:** `structured_data` (array of objects)

**Source of Truth:** LLM Translation Service (Claude API) (Phase: processing)

**Created:** When LLM completes translation

**Lifecycle:** Session

**Schema:**
```typescript
type WordBreakdown = Array<{
  word: string;           // IAST format
  devanagari?: string;    // Optional Devanagari
  meanings: string[];     // Array of possible meanings
  grammar?: string;       // Optional grammatical notes
}>;
```

**Example:**
```json
[
  {
    "word": "satyam",
    "devanagari": "सत्यम्",
    "meanings": ["truth", "reality", "truthfulness"],
    "grammar": "nominative neuter"
  },
  {
    "word": "eva",
    "devanagari": "एव",
    "meanings": ["alone", "only", "indeed"],
    "grammar": "indeclinable particle"
  },
  {
    "word": "jayate",
    "devanagari": "जयते",
    "meanings": ["triumphs", "conquers", "prevails"],
    "grammar": "3rd person singular present"
  }
]
```

**Used In:**
- `translation_display` phase - Expandable list, each word tappable
- User learning workflow (study individual word meanings)

**Access Pattern:**
- Default: collapsed (just word list)
- User taps word → expands to show meanings
- "Expand All" option for advanced users

---

## Artifact: ${translation}

**Description:** Primary English translation of the sutra

**Type:** `text` (plain string)

**Source of Truth:** LLM Translation Service (Claude API) (Phase: processing)

**Created:** When LLM completes translation

**Lifecycle:** Session

**Used In:**
- `translation_display` phase - Main translation output
- User study notes (copyable)

**Access Pattern:**
- Copyable with dedicated Copy button
- Read-only
- Displayed prominently

**Example:**
```
"Truth alone triumphs"
```

---

## Artifact: ${alternativeTranslations}

**Description:** Alternative English translations offering different interpretative nuances

**Type:** `array<string>`

**Source of Truth:** LLM Translation Service (Claude API) (Phase: processing)

**Created:** When LLM completes translation (alongside ${translation})

**Lifecycle:** Session

**Schema:**
```typescript
type AlternativeTranslations = string[];
```

**Example:**
```json
[
  "Truth conquers all",
  "Truth ultimately prevails",
  "Reality alone is victorious"
]
```

**Used In:**
- `translation_display` phase - Collapsible section for deeper exploration

**Access Pattern:**
- Default: collapsed (to avoid overwhelming user)
- User taps "Alternative Translations" to expand
- Helps user understand interpretative nuances

---

## Artifact Dependency Graph

```
User Camera Capture
        ↓
   ${originalImage}
        ↓
   OCR Extraction (Google Vision)
        ↓
   ┌────────────────────────┐
   │ ${extractedDevanagari} │
   │ ${ocrConfidence}       │
   └────────────────────────┘
        ↓
   Script Normalization
        ↓
   ${iastText}
        ↓
   LLM Translation (Claude)
        ↓
   ┌────────────────────────────┐
   │ ${translation}             │
   │ ${wordBreakdown}           │
   │ ${alternativeTranslations} │
   └────────────────────────────┘
```

---

## Data Retention Policy

| Artifact | Retention | Rationale |
|----------|-----------|-----------|
| ${originalImage} | **Ephemeral** (deleted after translation) | Privacy: No persistent storage of user photos |
| ${extractedDevanagari} | **Session** (cleared on app close) | Temporary lookup, no long-term value |
| ${ocrConfidence} | **Session** | Transient quality metric |
| ${iastText} | **Session** | User copies to notes if needed |
| ${wordBreakdown} | **Session** | User studies in-session |
| ${translation} | **Session** | User copies to notes if needed |
| ${alternativeTranslations} | **Session** | Transient interpretative aid |

**Future Enhancement:** "Save to History" feature would opt-in to persist translation artifacts for review.

---

## Single Source of Truth Principle

**Why this matters:**

Each artifact has exactly ONE authoritative source. This prevents:
- Data inconsistency (two versions of "extracted text")
- Confusion about which value to trust
- Synchronization bugs

**Example violation (anti-pattern):**
```typescript
// ❌ BAD: Multiple sources for confidence score
const ocrConfidence = ocrEngine.getConfidence();  // Source 1
const uiConfidence = calculateFromResponse();     // Source 2 (WRONG!)
```

**Correct pattern:**
```typescript
// ✅ GOOD: Single source from OCR engine
const ocrResult = await ocrEngine.extractText(imageBuffer);
const ocrConfidence = ocrResult.confidence;  // ONE source
```

---

**Next:** Phase 3 - Requirements and User Stories
