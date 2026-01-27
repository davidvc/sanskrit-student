# High-Level Design: Devanagari OCR Image to Translation

## Overview

Extend the existing translation service to accept image files containing Devanagari text. The system will use OCR to extract text from images, then leverage the existing script normalization and translation pipeline.

**Feature Goal:** Enable users to photograph or scan Sanskrit texts and receive translations without manual transcription.

## Architecture Decisions

### Approach: OCR as Pre-Processing Step

**Rationale:**
- OCR sits at the input layer, before existing text processing
- Extracted text flows through existing normalization → translation pipeline
- Clean separation: OCR handles image → text, existing system handles text → translation
- Follows Single Responsibility Principle
- Enables reuse of all existing translation logic

**Data Flow:**
```
Image → OCR Extraction → Devanagari Text → Script Normalizer → IAST → Translation
                                              (existing)        (existing)
```

**Alternative considered:** Combined OCR+Translation in single step
- Rejected because: couples OCR to translation logic, harder to test, less reusable

### OCR Engine Selection

**Requirement:** Must excel at Devanagari script recognition

**Candidates Evaluated:**

1. **Google Cloud Vision API** ⭐ **RECOMMENDED**
   - Pros: Excellent Indic script support, high accuracy, managed service
   - Cons: External dependency, cost per API call
   - Best for: Production deployments

2. **Tesseract with Devanagari training**
   - Pros: Open source, can run locally/self-hosted
   - Cons: Accuracy varies with image quality, requires tuning
   - Best for: Self-hosted/privacy-sensitive deployments

3. **Azure Computer Vision**
   - Pros: Good Indic script support, competitive pricing
   - Cons: Similar trade-offs to Google
   - Best for: Azure-native deployments

4. **PaddleOCR**
   - Pros: Open source, multi-language, can self-host
   - Cons: Requires more setup, less battle-tested for Devanagari
   - Best for: Research/experimentation

**Decision:** Start with **Google Cloud Vision API**
- Best accuracy for Devanagari out-of-box
- Minimal setup and maintenance
- Can swap via adapter pattern if needed later

### OCR as a Port (Hexagonal Architecture)

**Rationale:**
- OCR engine is an external dependency that may change
- Define domain port interface for OCR capabilities
- Specific implementation (Google Vision, Tesseract) is an adapter
- Enables testing with mock OCR
- Supports engine swapping without business logic changes

### Image Upload Handling

**Approach:** GraphQL Mutation with File Upload

**Rationale:**
- Consistent with existing GraphQL API
- `graphql-upload` package provides multipart/form-data support
- Enables progressive enhancement (CLI, Web UI, Mobile)

**File Processing:**
- Accept common formats: PNG, JPG, JPEG, WEBP, TIFF
- Maximum file size: 10MB (configurable)
- Validate format before OCR processing
- Stream processing to minimize memory usage

### File Lifecycle Management

**Approach:** Pluggable Storage Strategy via Port/Adapter Pattern

**Rationale:**
- **Flexibility:** Start simple (in-memory), upgrade later (temp files, cloud storage)
- **Memory Safety:** Can swap strategies based on file size or deployment environment
- **Testability:** Easy to mock different storage behaviors
- **No Lock-in:** Storage strategy is an implementation detail

**ImageStorageStrategy (Port Interface)**

Defines three operations: `store()`, `retrieve()`, and `cleanup()`.

The strategy abstraction allows different implementations without changing business logic.

**Storage Strategy Options:**

| Strategy | Max File Size | How It Works | Status |
|----------|---------------|--------------|--------|
| **InMemoryImageStorage** | **5MB** | Stream upload directly into memory buffer, store in Map by ID | ✅ **Implemented** |
| **TempFileImageStorage** | 10MB | Stream to `/tmp` directory, read when needed, delete on cleanup | 🔮 **Future** (not implemented) |
| **CloudStorageStrategy** | 50MB+ | Upload to S3/GCS with TTL, retrieve via signed URL | 🔮 **Future** (not implemented) |

**Current Implementation: InMemoryImageStorage Only**

**What we're building:**
- Stream upload to in-memory buffer
- Store buffer in Map by ID
- Retrieve buffer when OCR needs it
- Delete from Map on cleanup
- **5MB maximum file size**

**Why 5MB limit?**
- Serverless memory typically 512MB-1GB
- Need headroom for concurrent requests (~10-20)
- Per-request safe budget: ~50MB
- 5MB image + OCR processing + translation = well within budget

**Future Upgrade Paths (Not Part of This Implementation):**

If 5MB proves insufficient, the pluggable design allows easy upgrades:
- **TempFileImageStorage:** Stream to `/tmp`, no memory pressure, supports 10MB
- **CloudStorageStrategy:** S3/GCS for enterprise scale, supports 50MB+

**Processing Flow:**

1. **Store:** Strategy handles upload (in-memory, temp file, or cloud)
2. **Retrieve:** Strategy provides buffer for OCR processing
3. **Process:** OCR and translation happen
4. **Cleanup:** Strategy removes stored image (always called via finally block)

**Data Retention Policy:**
- Images cleaned up immediately after translation completes
- No persistent storage by default
- Cleanup guaranteed via finally block (even on errors)
- Strategy pattern allows opt-in persistence for future features (audit trails, history)

### Confidence Score Handling

**Approach:** Include OCR confidence in response, flag low-confidence results

**Rationale:**
- OCR is probabilistic, especially with poor image quality
- Users need to know when to verify extracted text
- Enable future features (manual correction, re-OCR with adjustments)

**Thresholds:**
- High confidence: ≥ 90% → proceed normally
- Medium confidence: 70-89% → include warning
- Low confidence: < 70% → require user confirmation or flag heavily

## System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│            (CLI, GraphQL Client, Future Web UI)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      GraphQL API Layer                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  NEW MUTATION:                                             │  │
│  │  translateSutraFromImage(image: Upload!): TranslationResult│  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Image Upload Handler  [NEW]                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  1. Validate file format (PNG, JPG, JPEG, WEBP, TIFF)     │  │
│  │  2. Validate file size (≤ 10MB)                           │  │
│  │  3. Stream to OCR service                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     OCR Service  [NEW]                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  1. Send image to OCR engine                              │  │
│  │  2. Extract Devanagari text                               │  │
│  │  3. Get confidence scores                                 │  │
│  │  4. Return OcrResult with text + metadata                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ (Devanagari text)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Script Normalizer  [EXISTING]                    │
│  (Converts Devanagari → IAST if needed)                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │ (IAST text)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│               Translation Service  [EXISTING]                    │
│  (LLM-powered translation with word breakdown)                   │
└──────────────────────────────────────────────────────────────────┘
```

## New Components

### ImageStorageStrategy (Port Interface)

Abstracts how uploaded images are stored and retrieved during processing. Enables swapping between in-memory, temp file, or cloud storage strategies.

**Contract:** Store, retrieve, and cleanup uploaded images.

**Current Implementation:**
- ✅ `InMemoryImageStorage` - Simple, safe for files ≤5MB

**Future Implementations (Design Only, Not Built):**
- 🔮 `TempFileImageStorage` - For larger files, uses /tmp directory
- 🔮 `CloudStorageStrategy` - S3/GCS with TTL-based cleanup

**See "File Lifecycle Management" section for strategy details.**

### OcrEngine (Port Interface)

Defines the contract for OCR capabilities. Domain depends on this interface, not specific implementations.

**Contract:** Extract text from image buffer, return text with confidence score.

**Result includes:**
- Extracted text
- Overall confidence score (0.0 to 1.0)
- Optional: detected language/script
- Optional: per-word bounding boxes and confidence

**Options:**
- Language hints (e.g., Hindi/Sanskrit for Devanagari)
- Orientation detection

### GoogleVisionOcrEngine (Adapter)

Implements `OcrEngine` using Google Cloud Vision API.

**Responsibilities:**
- Send image buffer to Google Vision API
- Map API response to OcrResult format
- Handle errors (rate limits, invalid images, API failures)
- Extract confidence scores

**Configuration:**
- Credentials: Google Cloud service account JSON
- Language hints: Hindi/Sanskrit (`hi`, `sa`) for better Devanagari accuracy
- API Feature: `TEXT_DETECTION` for general OCR

### OcrTranslationService

Orchestrates OCR → Normalization → Translation flow.

**Responsibilities:**
1. Store uploaded image via ImageStorageStrategy
2. Retrieve image buffer and pass to OCR engine
3. Validate OCR confidence (reject if < 10%)
4. Pass extracted text to existing translation service
5. Augment translation result with OCR metadata (confidence, warnings)
6. Always cleanup stored image (even on error)

**Result includes:**
- All standard translation fields (words, meanings, IAST, etc.)
- OCR confidence score
- Extracted text (raw OCR output)
- Warnings if confidence is low (< 70%)

**Confidence Thresholds:**
- < 10%: Reject (no readable text)
- 10-70%: Proceed with warning
- > 70%: Normal processing

### GraphQL Schema Extension

**New Mutation:** `translateSutraFromImage`

**Input:**
- `image: Upload!` - Image file (PNG, JPG, JPEG, WEBP, TIFF)
- `outputFormat: OutputFormat` - Devanagari or IAST (default: IAST)

**Returns:** `OcrTranslationResult`

**OcrTranslationResult fields:**
- All standard translation fields (originalText, iastText, words, meanings)
- `ocrConfidence: Float!` - OCR confidence score (0.0 to 1.0)
- `extractedText: String!` - Raw OCR output before normalization
- `ocrWarnings: [String!]` - Warnings if confidence is low

### Image Validation

**Validates uploaded files before OCR processing.**

**Checks:**
- File size (≤5MB for MVP, ≤10MB with temp file storage)
- MIME type (must be image/png, image/jpeg, image/webp, or image/tiff)
- Magic bytes (verify actual file format matches MIME type - security)

**Errors:**
- File too large → HTTP 413 (Payload Too Large)
- Unsupported format → HTTP 400 (Bad Request) with list of supported formats
- Corrupted file → HTTP 400 (Bad Request)

## Key Dependencies

**New:**
- `@google-cloud/vision` - Google Cloud Vision API client
- `graphql-upload` - File upload support for GraphQL
- `file-type` - Detect file type from buffer (magic bytes)

**Existing (unchanged):**
- `graphql-yoga` - GraphQL server
- `@anthropic-ai/sdk` - Claude API client
- `@indic-transliteration/sanscript` - Script conversion
- `vitest` - Testing framework

## Data Flow Example

### Happy Path: Clear Devanagari Image

1. **Client uploads image**
   ```graphql
   mutation {
     translateSutraFromImage(image: $file) {
       extractedText
       iastText
       words {
         word
         meanings
       }
       ocrConfidence
     }
   }
   ```

2. **Server validates image**
   - Format: ✓ image/jpeg
   - Size: ✓ 2.3 MB
   - Passes to OCR service

3. **OCR extraction**
   - Google Vision API processes image
   - Extracts: "सत्यमेव जयते"
   - Confidence: 0.96

4. **Script normalization** (existing)
   - Detects: Devanagari
   - Converts to IAST: "satyameva jayate"

5. **Translation** (existing)
   - LLM translates with word breakdown
   - Returns structured result

6. **Response augmentation**
   - Adds OCR confidence: 0.96
   - No warnings (high confidence)
   - Returns complete result

### Error Path: Unsupported Format

1. Client uploads `.pdf` file
2. Validator rejects: "Unsupported format"
3. GraphQL error: 400 Bad Request

### Edge Case: Low Confidence OCR

1. Client uploads poor quality image
2. OCR extracts text with confidence: 0.65
3. Translation proceeds
4. Response includes warning: "Low OCR confidence - please verify extracted text"

## File Structure

```
src/
├── domain/
│   ├── ocr-engine.ts                [NEW] - Port interface
│   ├── image-storage-strategy.ts    [NEW] - Port interface
│   ├── ocr-translation-service.ts   [NEW] - Orchestrator
│   └── types.ts                     [EXTEND] - Add OcrResult, ImageHandle types
├── adapters/
│   ├── google-vision-ocr-engine.ts  [NEW] - OCR adapter (production)
│   ├── in-memory-image-storage.ts   [NEW] - Storage adapter ✅ ONLY IMPLEMENTATION
│   ├── image-validator.ts           [NEW] - File validation
│   └── mock-ocr-engine.ts           [NEW] - For testing
├── server.ts                         [EXTEND] - Wire up OCR mutation
└── cli.ts                           [EXTEND] - Add image upload command

Note: temp-file-image-storage.ts is NOT implemented - future upgrade only
```

## Configuration

**Environment Variables:**
```bash
# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# OCR Settings
OCR_MAX_IMAGE_SIZE_MB=10
OCR_CONFIDENCE_THRESHOLD=0.7
```

## Testing Strategy

**Philosophy:** Acceptance tests with mocks provide full coverage. No unit tests or end-to-end tests needed.

**Acceptance Tests (Primary Coverage):**
- All scenarios from `docs/features/devanagari-ocr-translation.feature`
- Use `MockOcrEngine` - returns predefined text and confidence scores
- Fast, deterministic, no external API dependencies
- Cover all happy paths, edge cases, and error conditions

**MockOcrEngine Behavior:**
- Configured with predefined responses (text + confidence)
- Simulates various scenarios:
  - High confidence extraction (≥90%)
  - Medium confidence (70-89%)
  - Low confidence (10-69%)
  - No text detected (< 10%)
  - Different image quality conditions

**Test Coverage via Acceptance Tests:**
- ✅ Clear Devanagari images → successful translation
- ✅ Poor quality images → low confidence warnings
- ✅ No Devanagari text → error response
- ✅ Unsupported formats → validation error
- ✅ Oversized files → HTTP 413 error
- ✅ Corrupted files → validation error
- ✅ Mixed scripts → Devanagari extraction only
- ✅ Multi-line text → structure preservation
- ✅ Sandhi handling → correct extraction

**What We're NOT Testing:**
- ❌ Real OCR engine accuracy (Google Vision's responsibility)
- ❌ End-to-end with actual API calls (slow, flaky, costly)
- ❌ Unit tests of internal components (acceptance tests cover behavior)

**Integration Testing:**
- Manual testing with real Google Vision API during development
- Can be done ad-hoc, not part of automated test suite

**Rationale:**
- Acceptance tests verify contracts between components
- Mocking OCR engine keeps tests fast and deterministic
- No need for unit tests - acceptance coverage is comprehensive
- Real OCR testing is manual/exploratory, not automated

## Risks and Mitigations

### Risk: OCR Accuracy with Manuscript Texts

**Mitigation:**
- Start with printed/clear text support
- Document limitations with manuscript-style Devanagari
- Future: Support image preprocessing (contrast enhancement, denoising)
- Future: Allow manual correction of OCR output

### Risk: API Cost with Google Vision

**Mitigation:**
- Implement rate limiting per user/IP
- Add caching for identical images (hash-based)
- Monitor usage and set budget alerts
- Provide fallback to Tesseract for cost control

### Risk: Large Images Impact Performance & Memory

**Mitigation:**
- **Initial (MVP):** 5MB limit with InMemoryImageStorage (safe for serverless)
- **Future:** Swap to TempFileImageStorage for 10MB limit (no memory pressure)
- Consider automatic image resizing/compression
- Use streaming upload to minimize memory usage
- Monitor cold start times and memory utilization on serverless platform
- **Pluggable Strategy:** Easy to upgrade storage approach without code changes

### Risk: Security - Malicious Image Files

**Mitigation:**
- Validate MIME type AND magic bytes
- Scan with virus scanner before processing (if needed)
- Isolate OCR processing (containerized)
- Rate limit uploads per IP/user

### Risk: Privacy - User Image Storage

**Mitigation:**
- Never persist uploaded images to disk/database
- Process in-memory or ephemeral temp storage
- Automatic cleanup on serverless function exit
- Clear data retention policy (images not retained)
- Explicit user consent if future features need storage

## Implementation Plan (TDD: RED-GREEN-REFACTOR)

### Overview

**For each acceptance criterion:**
1. **RED:** Write failing acceptance test first
2. **GREEN:** Implement minimal code to make test pass
3. **REFACTOR:** Clean up code, remove duplication, improve design

**Key Principle:** Tests drive implementation. Never write production code without a failing test.

### Phase 1: Setup & Interfaces

**Not TDD - foundational definitions:**
1. Define `OcrEngine` port interface (domain)
2. Define `ImageStorageStrategy` port interface (domain)
3. Define `OcrResult`, `ImageHandle` types (domain)
4. Implement `MockOcrEngine` (adapter - for testing)
5. Implement `InMemoryImageStorage` (adapter - only storage implementation)

### Phase 2: TDD Cycle for Each Acceptance Criterion

**Process for EACH acceptance criterion:**

#### Step 1: RED (Write Failing Test)
- Pick one acceptance criterion from feature file
- Write acceptance test that exercises the full flow:
  - Upload → Store → OCR → Translate → Cleanup
- Configure `MockOcrEngine` with appropriate response (text, confidence)
- **Run test → Verify it FAILS** (red)
- Commit: "RED: AC1 - Clear Devanagari image upload"

#### Step 2: GREEN (Make It Pass)
- Implement minimal code to make test pass
- May need to create new components or extend existing ones
- **Run test → Verify it PASSES** (green)
- Don't worry about code quality yet
- Commit: "GREEN: AC1 - Clear Devanagari image upload"

#### Step 3: REFACTOR (Clean Up)
- Review code for duplication, clarity, design improvements
- Extract methods, consolidate logic, improve naming
- **Run test → Verify it STILL PASSES** (green)
- Commit: "REFACTOR: AC1 - Extract OCR result mapping"

#### Repeat for All 13 Acceptance Criteria

**Acceptance Criteria from feature file:**
1. AC1: Successfully extract and translate clear Devanagari text
2. AC2: Extract from manuscript-style Devanagari
3. AC3: Handle mixed Devanagari and Latin script
4. AC4: Return IAST output when requested
5. AC5: Return Devanagari output when requested
6. AC6: Handle poor quality image with noise
7. AC7: Handle image with no Devanagari text
8. AC8: Handle unsupported image format
9. AC9: Handle oversized file
10. AC10: Handle corrupted image
11. AC11: Extract multi-line text with structure
12. AC12: Handle sandhi (word joining)
13. AC13: Performance - process within time limits
14. AC14: Return OCR confidence scores

**Each criterion gets its own RED-GREEN-REFACTOR cycle.**

### Phase 3: GraphQL Integration (TDD)

**RED:**
- Write acceptance test for GraphQL mutation
- Test file upload via mutation
- Verify response structure matches schema

**GREEN:**
- Extend GraphQL schema with `translateSutraFromImage` mutation
- Add file upload handling (graphql-upload)
- Wire up resolver to `OcrTranslationService`

**REFACTOR:**
- Extract file validation to middleware
- Consolidate error handling

### Phase 4: Production Implementation

**RED:**
- Write test for `GoogleVisionOcrEngine` with mock Vision API client

**GREEN:**
- Implement `GoogleVisionOcrEngine` adapter
- Configure Google Cloud credentials
- Map Vision API response to `OcrResult`

**REFACTOR:**
- Extract response mapping logic
- Add error handling for API failures

### Phase 5: Production Readiness

**Not TDD - operational concerns:**
1. Add logging and monitoring
2. Configure environment variables
3. Add rate limiting
4. Security review
5. Manual testing with real images

### Detailed TDD Example: AC1

**AC1: Successfully extract and translate clear Devanagari text from image**

#### RED Phase
```
File: tests/acceptance/ocr-translation.test.ts

test('AC1: Clear Devanagari image → OCR → translation', async () => {
  // Arrange
  const mockOcr = new MockOcrEngine();
  mockOcr.setResponse({
    text: 'सत्यमेव जयते',
    confidence: 0.96
  });

  const service = createOcrTranslationService(mockOcr);
  const imageUpload = createTestImageUpload('devanagari-clear.png');

  // Act
  const result = await service.translateFromImage(imageUpload);

  // Assert
  expect(result.extractedText).toBe('सत्यमेव जयते');
  expect(result.iastText).toBe('satyameva jayate');
  expect(result.ocrConfidence).toBe(0.96);
  expect(result.words).toHaveLength(3);
  expect(result.words[0]).toMatchObject({
    word: 'satyam',
    meanings: expect.arrayContaining(['truth'])
  });
});
```

**Run test → FAILS (service doesn't exist)**

#### GREEN Phase
- Create `OcrTranslationService` class
- Implement `translateFromImage` method
- Wire up: store → retrieve → OCR → translate → cleanup

**Run test → PASSES**

#### REFACTOR Phase
- Extract confidence validation to separate method
- Consolidate error handling in try/finally
- Improve variable naming

**Run test → STILL PASSES**

### Success Criteria

**Complete when:**
- ✅ All 14 acceptance criteria have passing tests
- ✅ Each test maps 1-1 to an acceptance criterion
- ✅ All tests use `MockOcrEngine` (no real API calls)
- ✅ Code is clean and well-factored
- ✅ GraphQL mutation works with file uploads
- ✅ Production `GoogleVisionOcrEngine` implemented

## Future Enhancements

- **Image preprocessing**: Contrast enhancement, rotation correction, denoising
- **Multi-language support**: Extend beyond Devanagari (IAST, Tibetan, etc.)
- **Manual correction UI**: Allow users to fix OCR errors before translation
- **Batch processing**: Upload multiple images at once
- **OCR alternatives comparison**: Run multiple engines, pick best result
- **Historical text support**: Fine-tune for manuscript/paleographic texts

## Dependencies on Existing Features

**Requires:**
- ✓ Script detection (existing)
- ✓ Devanagari → IAST conversion (existing)
- ✓ Translation service (existing)
- ✓ GraphQL API (existing)

**Enables (Future Features):**
- IAST OCR support (same pipeline, different script detection)
- Multi-line sutra structure detection (builds on OCR foundation)
- Manuscript text handling (preprocessing + OCR)

---

**Design Status:** READY FOR REVIEW
