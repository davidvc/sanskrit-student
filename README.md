# Sanskrit Student

A Sanskrit sutra translation service that provides word-by-word breakdowns and multiple translation options. Supports both text input and Devanagari OCR from images.

## Features

- **Text Translation**: Translate Sanskrit sutras from either Devanagari or IAST (International Alphabet of Sanskrit Transliteration)
- **OCR Translation**: Upload images containing Devanagari text for automatic OCR and translation
- **Word-by-Word Breakdown**: Get detailed meanings for each word in the sutra
- **Alternative Translations**: Receive up to 3 alternative translations for context
- **Script Conversion**: Automatic conversion between Devanagari and IAST formats
- **GraphQL API**: Query-based API with both queries and mutations
- **CLI Tool**: Command-line interface for quick translations

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [CLI Usage](#cli-usage)
  - [GraphQL Server](#graphql-server)
  - [API Examples](#api-examples)
- [Development](#development)
- [Testing](#testing)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [License](#license)

## Prerequisites

- **Node.js**: Version 20.19.0 or higher
- **Anthropic API Key**: Required for production translation using Claude (optional for testing with mock data)

## Installation

1. Clone the repository:

```bash
git clone git@github.com:davidvc/sanksrit-student.git
cd sanksrit-student
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Configuration

### Environment Variables

For production use with Claude AI, create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from [Anthropic Console](https://console.anthropic.com/).

**Note**: The mock client doesn't require an API key and can be used for testing.

## Usage

### CLI Usage

The CLI provides a simple way to translate sutras from the command line.

#### Basic Translation

```bash
npm run translate "atha yoganusasanam"
```

#### Using Mock Data (No API Key Required)

```bash
npm run translate -- --mock "atha yoganusasanam"
```

#### Devanagari Input

```bash
npm run translate "अथ योगानुशासनम्"
```

#### Output Format

The CLI returns JSON with the translation result:

```json
{
  "originalText": "atha yoganusasanam",
  "iastText": "atha yogānuśāsanam",
  "words": [
    {
      "word": "atha",
      "meanings": ["now", "here begins", "auspicious beginning"]
    },
    {
      "word": "yogānuśāsanam",
      "meanings": ["instruction on yoga", "teaching of yoga", "discipline of yoga"]
    }
  ],
  "alternativeTranslations": [
    "Now, the teaching of yoga",
    "Here begins the instruction on yoga",
    "Now begins the discipline of union"
  ]
}
```

### GraphQL Server

Start the GraphQL server for interactive queries and image uploads.

#### Starting the Server

```bash
# Production mode (requires ANTHROPIC_API_KEY)
node dist/server.js

# Development mode with mock data
node dist/server.js --mock
```

The server will start on `http://localhost:4000` with GraphQL Playground available at `http://localhost:4000/graphql`.

### API Examples

#### Query: Translate Text

**GraphQL Query:**

```graphql
query TranslateSutra {
  translateSutra(sutra: "satyameva jayate") {
    originalText
    iastText
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

**Response:**

```json
{
  "data": {
    "translateSutra": {
      "originalText": "satyameva jayate",
      "iastText": "satyam eva jayate",
      "words": [
        {
          "word": "satyam",
          "meanings": ["truth"]
        },
        {
          "word": "eva",
          "meanings": ["indeed", "only", "alone"]
        },
        {
          "word": "jayate",
          "meanings": ["conquers", "prevails", "triumphs"]
        }
      ],
      "alternativeTranslations": [
        "Truth alone triumphs",
        "Truth alone prevails",
        "Only truth conquers"
      ]
    }
  }
}
```

#### Mutation: Translate from Image

**GraphQL Mutation:**

```graphql
mutation TranslateImage($image: Upload!) {
  translateSutraFromImage(image: $image) {
    originalText
    iastText
    extractedText
    ocrConfidence
    ocrWarnings
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

**Variables:**

```json
{
  "image": null
}
```

**Note**: When using GraphQL Playground or a GraphQL client, upload the image file through the file upload interface.

**cURL Example:**

```bash
curl http://localhost:4000/graphql \
  -F operations='{"query": "mutation($image: Upload!) { translateSutraFromImage(image: $image) { originalText iastText extractedText ocrConfidence } }", "variables": { "image": null }}' \
  -F map='{"0": ["variables.image"]}' \
  -F 0=@/path/to/sanskrit-image.png
```

**Response:**

```json
{
  "data": {
    "translateSutraFromImage": {
      "originalText": "सत्यमेव जयते",
      "iastText": "satyam eva jayate",
      "extractedText": "सत्यमेव जयते",
      "ocrConfidence": 0.96,
      "ocrWarnings": null,
      "words": [
        {
          "word": "satyam",
          "meanings": ["truth"]
        },
        {
          "word": "eva",
          "meanings": ["indeed", "only", "alone"]
        },
        {
          "word": "jayate",
          "meanings": ["conquers", "prevails", "triumphs"]
        }
      ],
      "alternativeTranslations": [
        "Truth alone triumphs",
        "Truth alone prevails",
        "Only truth conquers"
      ]
    }
  }
}
```

#### OCR Image Requirements

- **Supported Formats**: PNG, JPG, JPEG, WEBP, TIFF
- **Maximum File Size**: 10 MB
- **Minimum OCR Confidence**: 0.1 (10%)
- **Low Confidence Warning**: Below 0.7 (70%) triggers a warning

**OCR Warnings:**

If OCR confidence is below 70%, you'll receive a warning in the response:

```json
{
  "ocrWarnings": ["Low OCR confidence - please verify extracted text"]
}
```

**Common Errors:**

- **Unsupported format**: `"Unsupported image format: image/bmp. Supported formats: PNG, JPG, JPEG, WEBP, TIFF"`
- **File too large**: `"Image file too large: 15000000 bytes. Maximum allowed: 10MB"`
- **Corrupted file**: `"Invalid or corrupted image file"`
- **No text detected**: `"No readable text detected in image"`

## Development

### Project Structure

```
sanskrit-student/
├── src/
│   ├── domain/              # Core business logic and interfaces
│   │   ├── llm-client.ts              # LLM client interface
│   │   ├── ocr-engine.ts              # OCR engine interface
│   │   ├── ocr-translation-service.ts # OCR orchestration service
│   │   ├── script-converter.ts        # Script conversion interface
│   │   ├── script-detector.ts         # Script detection
│   │   ├── script-normalizer.ts       # Script normalization
│   │   ├── translation-service.ts     # Translation service interface
│   │   ├── image-storage-strategy.ts  # Image storage interface
│   │   └── types.ts                   # Shared types
│   ├── adapters/            # External service implementations
│   │   ├── claude-llm-client.ts       # Claude API client
│   │   ├── mock-llm-client.ts         # Mock LLM for testing
│   │   ├── mock-ocr-engine.ts         # Mock OCR for testing
│   │   ├── in-memory-image-storage.ts # Memory-based image storage
│   │   ├── llm-translation-service.ts # LLM-based translation
│   │   ├── normalizing-translation-service.ts  # Script normalization wrapper
│   │   ├── sanscript-converter.ts     # Sanscript library adapter
│   │   └── prompt-loader.ts           # Prompt template loader
│   ├── cli.ts               # Command-line interface
│   └── server.ts            # GraphQL server setup
├── tests/
│   ├── unit/                # Unit tests
│   └── acceptance/          # Acceptance tests
├── prompts/                 # LLM prompt templates
├── package.json
├── tsconfig.json
└── README.md
```

### Architecture

This project follows **Hexagonal Architecture** (Ports and Adapters):

- **Domain Layer** (`src/domain/`): Core business logic, interfaces (ports)
- **Adapter Layer** (`src/adapters/`): External service implementations
- **Dependency Injection**: Services are composed through constructor injection

**Key Design Patterns:**

- **Port/Adapter Pattern**: Clear separation between domain logic and external dependencies
- **Strategy Pattern**: Swappable implementations (MockLlmClient vs ClaudeLlmClient)
- **Decorator Pattern**: NormalizingTranslationService wraps base translation
- **Template Method**: OcrTranslationService orchestrates multi-step OCR → translation flow

### Running in Development Mode

```bash
# Watch mode for tests
npm run test:watch

# Type checking
npm run lint

# Build TypeScript
npm run build
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The project uses **Vitest** for testing with comprehensive coverage:

- **Unit Tests**: Test individual components in isolation
- **Acceptance Tests**: End-to-end scenarios including OCR workflows

**Mock Clients:**

The project includes mock implementations for testing without external dependencies:

- `MockLlmClient`: Returns stubbed translations for known sutras
- `MockOcrEngine`: Returns predefined OCR results based on filename patterns

### Example Test Scenarios

**Text Translation:**

```typescript
import { createTestConfig, createServer } from '../src/server';

const config = createTestConfig();
const server = createServer(config);

const response = await server.executeQuery({
  query: `query { translateSutra(sutra: "om") { iastText } }`
});
```

**OCR Translation:**

```typescript
const imageFile = {
  filename: 'sanskrit-text.png',
  mimetype: 'image/png',
  encoding: '7bit',
  _buffer: Buffer.from('...') // PNG image bytes
};

const response = await server.executeQuery({
  query: `mutation($image: Upload!) {
    translateSutraFromImage(image: $image) {
      extractedText
      ocrConfidence
    }
  }`,
  variables: { image: imageFile }
});
```

## API Reference

### GraphQL Schema

#### Types

```graphql
scalar Upload

type Query {
  translateSutra(sutra: String!): TranslationResult
}

type Mutation {
  translateSutraFromImage(image: Upload!): OcrTranslationResult!
}

type TranslationResult {
  originalText: String!
  iastText: String!
  words: [WordEntry!]!
  alternativeTranslations: [String!]
}

type OcrTranslationResult {
  originalText: String!
  iastText: String!
  words: [WordEntry!]!
  alternativeTranslations: [String!]
  ocrConfidence: Float!
  extractedText: String!
  ocrWarnings: [String!]
}

type WordEntry {
  word: String!
  meanings: [String!]!
}
```

#### Query: translateSutra

Translate a Sanskrit sutra from text input.

**Arguments:**

- `sutra` (String!): Sanskrit text in either Devanagari or IAST format

**Returns:** `TranslationResult`

**Example:**

```graphql
query {
  translateSutra(sutra: "योगश्चित्तवृत्तिनिरोधः") {
    originalText
    iastText
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

#### Mutation: translateSutraFromImage

Extract and translate Sanskrit text from an uploaded image.

**Arguments:**

- `image` (Upload!): Image file containing Devanagari text

**Returns:** `OcrTranslationResult`

**Validation:**

- Supported formats: PNG, JPG, JPEG, WEBP, TIFF
- Maximum size: 10 MB
- Minimum OCR confidence: 0.1 (10%)

**Example:**

```graphql
mutation($image: Upload!) {
  translateSutraFromImage(image: $image) {
    originalText
    iastText
    extractedText
    ocrConfidence
    ocrWarnings
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

### TypeScript API

#### TranslationService Interface

```typescript
interface TranslationService {
  translate(sutra: string): Promise<TranslationResult>;
}
```

#### OcrTranslationService

```typescript
class OcrTranslationService {
  async translateFromImage(
    upload: FileUpload,
    outputFormat?: 'devanagari' | 'iast'
  ): Promise<OcrTranslationResult>;
}
```

#### Types

```typescript
interface WordEntry {
  word: string;
  meanings: string[];
}

interface TranslationResult {
  originalText: string;
  iastText: string;
  words: WordEntry[];
  alternativeTranslations?: string[];
}

interface OcrTranslationResult extends TranslationResult {
  ocrConfidence: number;
  extractedText: string;
  ocrWarnings?: string[];
}
```

## Technology Stack

- **Runtime**: Node.js 20.19.0+
- **Language**: TypeScript 5.3+
- **GraphQL Server**: GraphQL Yoga 5.1+
- **LLM**: Anthropic Claude (via @anthropic-ai/sdk)
- **Script Conversion**: @indic-transliteration/sanscript
- **Testing**: Vitest 1.0+
- **Architecture**: Hexagonal (Ports and Adapters)

## Contributing

This project follows the **ai-pack framework** for structured development:

1. Create task packet: `/ai-pack task-init <task-name>`
2. Follow TDD workflow: RED → GREEN → REFACTOR
3. Run tests: `npm test`
4. Submit for review: `/ai-pack review`

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## License

[Add license information here]

## Acknowledgments

- Sanskrit transliteration powered by [@indic-transliteration/sanscript](https://github.com/sanskrit-coders/indic_transliteration_py)
- Translation powered by [Anthropic Claude](https://www.anthropic.com/)
