# Frontend Test Design

## Overview

This document outlines the testing strategy for **all frontend features** in the Sanskrit Student application. Following project standards (AGENTS.md), we write **acceptance tests only** that test the public contract of React Native components with all external dependencies mocked.

**For AI Agents**: See condensed quick-reference guide → [front-end-test-design-for-ai.md](./front-end-test-design-for-ai.md) (~400 lines vs ~1800 lines)

**This Document**: Comprehensive design rationale, architecture, and examples for humans and design review.

**Scope**: This design applies to all Universal React Native frontend features, not just a single feature. The examples use the Basic Translation Frontend feature as a reference implementation.

## Selected Testing Approach: Direct Logic Testing (Option 1)

### Rationale

For this project, we will use **Option 1: Direct Logic Testing** for the following reasons:

1. **Agent-Friendly Development**: Direct logic tests are easier for AI agents to generate, understand, and maintain
2. **Deterministic & Fast**: Tests execute quickly without browser overhead, enabling rapid TDD cycles
3. **Easier Debugging**: Test failures point directly to component logic rather than UI rendering issues
4. **Consistent with Backend**: Matches the testing approach used in backend acceptance tests
5. **Follows AGENTS.md Standards**: Tests at the public contract level (component props/rendering), mocks all external dependencies (Apollo Client)

### What We Won't Do

- **No Playwright/UI automation** (Option 2): Saves complexity and brittle tests
- **No unit tests**: Per AGENTS.md, we only write acceptance tests
- **No end-to-end tests**: Per AGENTS.md, we don't write E2E tests unless explicitly requested

## Test Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Acceptance Tests (Vitest + React Native Testing Lib)  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Test File: tests/app/translate.test.tsx         │  │
│  │  - Render React Native components                │  │
│  │  - Simulate user interactions (text input, press)│  │
│  │  - Assert on rendered output                     │  │
│  └───────────┬───────────────────────────────────────┘  │
│              │                                           │
│              ▼                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Component Under Test: TranslateScreen            │  │
│  │  - Input: props (none for screen)                 │  │
│  │  - Output: Rendered UI elements                   │  │
│  │  - Uses: Apollo Client hook (mocked)              │  │
│  └───────────┬───────────────────────────────────────┘  │
│              │                                           │
│              ▼                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Apollo Client Mock (MockedProvider)              │  │
│  │  - Provides mocked GraphQL responses              │  │
│  │  - Simulates loading states                       │  │
│  │  - Simulates errors                               │  │
│  │  - No real network calls                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

External Dependencies (NOT tested):
- GraphQL Yoga Server (backend)
- Translation Services
- Network layer
```

### Test Isolation Strategy

**Complete Isolation**: Tests run with all external dependencies mocked

1. **Backend API**: Mocked via Apollo Client's `MockedProvider`
   - No real GraphQL server required during tests
   - Responses pre-defined in test data
   - Full control over success/error scenarios

2. **Clipboard API**: Mocked via Vitest's `vi.mock()`
   - `expo-clipboard` module replaced with test double
   - Verify copy operations without real clipboard access

3. **Navigation**: Mocked if needed (Expo Router)
   - For this feature, navigation is minimal (single screen)
   - May mock if testing navigation to/from translate screen

### Component Hierarchy & Test Targets

```
TranslateScreen                    ← PRIMARY TEST TARGET
├── SutraInput                     ← Tested via TranslateScreen
│   ├── TextInput (RN primitive)
│   └── Button
└── TranslationResult              ← Tested via TranslateScreen
    ├── OriginalText
    ├── IastText
    │   └── CopyButton             ← Tested via TranslateScreen
    ├── WordBreakdown
    └── AlternativeTranslations
```

**Testing Philosophy**:
- Test `TranslateScreen` as the public contract
- Child components tested indirectly through parent integration
- Components receive real props, external services are mocked
- Assertion targets: rendered text, button states, error messages

## Mock Strategy for Backend API

### Apollo Client MockedProvider

**Tool**: `@apollo/client/testing`'s `MockedProvider`

**How It Works**:
1. Wrap component in `<MockedProvider mocks={mocksArray}>`
2. Define mock responses matching GraphQL query structure
3. Apollo Client returns mocked data instead of making network calls
4. Supports loading states, errors, and delays

### Mock Data Structure

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { TranslateSutraDocument } from '@/graphql/generated/graphql';

// Success scenario mock
const successMock = {
  request: {
    query: TranslateSutraDocument,
    variables: { sutra: 'atha yoganusasanam' },
  },
  result: {
    data: {
      translateSutra: {
        originalText: ['atha yoganusasanam'],
        iastText: ['atha yogānuśāsanam'],
        words: [
          { word: 'atha', meanings: ['now', 'here begins'] },
          { word: 'yoga', meanings: ['yoga', 'union'] },
          { word: 'anusasanam', meanings: ['instruction', 'teaching'] },
        ],
        alternativeTranslations: [
          'Now begins the instruction of yoga',
          'Here begins the teaching of yoga',
        ],
      },
    },
  },
};

// Error scenario mock
const errorMock = {
  request: {
    query: TranslateSutraDocument,
    variables: { sutra: 'invalid input' },
  },
  error: new Error('Translation service unavailable'),
};

// Loading scenario - use delay
const loadingMock = {
  request: {
    query: TranslateSutraDocument,
    variables: { sutra: 'slow query' },
  },
  result: {
    data: { /* ... */ },
  },
  delay: 1000, // Simulate 1 second delay
};
```

### Rendering Components with Mocks

```typescript
import { render, screen } from '@testing-library/react-native';

function renderWithMocks(mocks: any[]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TranslateScreen />
    </MockedProvider>
  );
}

// In test
test('displays translation results', async () => {
  renderWithMocks([successMock]);
  // ... interact and assert
});
```

### Mock Scenarios to Cover

1. **Successful translation** (IAST input)
2. **Successful translation** (Devanagari input)
3. **Empty input** (skip query, no mock needed)
4. **Loading state** (use `delay` in mock)
5. **Network error** (use `error` in mock)
6. **Multi-line input** (mock with array responses)
7. **Missing alternatives** (mock with empty/null array)

## Test Organization Structure

### Directory Layout

```
tests/
└── app/                                    # Frontend acceptance tests
    ├── helpers/
    │   ├── apollo-mocks.ts                # Shared mock data builders
    │   └── render-utils.ts                # Custom render with providers
    │
    ├── translate/                         # Organized by acceptance criteria
    │   ├── validation.test.tsx            # AC: Empty input validation
    │   ├── loading.test.tsx               # AC: Loading state
    │   ├── iast-translation.test.tsx      # AC: Successful IAST translation
    │   ├── devanagari-translation.test.tsx # AC: Successful Devanagari
    │   ├── error-handling.test.tsx        # AC: Server error handling
    │   ├── multiline.test.tsx             # AC: Multi-line text support
    │   ├── clear-results.test.tsx         # AC: Clear previous results
    │   ├── copy.test.tsx                  # AC: Copy functionality
    │   ├── alternatives.test.tsx          # AC: Alternative translations
    │   └── responsive.test.tsx            # AC: Responsive layout
    │
    └── translate.all.test.tsx             # Optional: all scenarios in one file
```

**Naming Convention**:
- File: `<feature>/<acceptance-criterion>.test.tsx`
- Test suite: `describe('AC: <criterion name>', ...)`
- Test case: `test('<scenario description>', ...)`

**Organization Trade-offs**:

**Option A: One file per acceptance criterion** (Recommended)
- Pros: Easy to locate tests, matches TDD phases, clear scope
- Cons: More files to manage

**Option B: Single file with all scenarios**
- Pros: Fewer files, easier to run all frontend tests
- Cons: Large file (1000+ lines), harder to navigate

**Decision**: Use **Option A** during development for clarity, consider consolidating to Option B after feature is complete if preferred.

## Building a Testing DSL (Domain-Specific Language)

### Philosophy: Reusable Test Helpers

**CRITICAL PRINCIPLE**: As you write tests, continuously extract reusable patterns into helper functions that build a **Domain-Specific Language** for testing the translation UI.

**Benefits**:
1. **Readability**: Tests read like user stories, not implementation details
2. **Maintainability**: Changes to UI structure require updates in one place
3. **Consistency**: All tests use the same interaction patterns
4. **Productivity**: New tests write faster with established helpers
5. **Agent-Friendly**: Clear patterns for AI agents to follow and extend

### DSL Extraction Guidelines

**When to Extract a Helper**:
- ✅ Same action repeated in 2+ tests → Extract to helper
- ✅ Complex setup (mocks, rendering) → Extract to helper
- ✅ Multi-step user action (type + submit) → Extract to higher-level helper
- ✅ Assertion pattern repeated → Extract to custom matcher/helper
- ❌ One-off action unique to single test → Keep inline

**Naming Convention**:
- **Actions**: Verb-based (`enterSanskritText`, `clickTranslateButton`, `copyIastText`)
- **Assertions**: Expectation-based (`expectTranslationDisplayed`, `expectErrorShown`)
- **Setup**: Noun-based (`createTranslationMock`, `renderTranslateScreen`)

### DSL Layers

**Layer 1: Low-Level Helpers** (Direct Testing Library wrappers)
```typescript
// tests/app/helpers/interactions.ts

/** Find the Sanskrit input field */
export function getSanskritInput() {
  return screen.getByPlaceholderText(/enter sanskrit text/i);
}

/** Find the translate button */
export function getTranslateButton() {
  return screen.getByRole('button', { name: /translate/i });
}

/** Find the copy button */
export function getCopyButton() {
  return screen.getByRole('button', { name: /copy/i });
}
```

**Layer 2: Action Helpers** (User interactions)
```typescript
// tests/app/helpers/actions.ts

/** Type text into the Sanskrit input field */
export function enterSanskritText(text: string) {
  const input = getSanskritInput();
  fireEvent.changeText(input, text);
}

/** Click the translate button */
export function clickTranslate() {
  const button = getTranslateButton();
  fireEvent.press(button);
}

/** Perform complete translation: enter text + submit */
export function translateText(text: string) {
  enterSanskritText(text);
  clickTranslate();
}

/** Copy IAST text to clipboard */
export function clickCopyIast() {
  const copyButton = getCopyButton();
  fireEvent.press(copyButton);
}
```

**Layer 3: Assertion Helpers** (Expected outcomes)
```typescript
// tests/app/helpers/assertions.ts

/** Assert that translation results are displayed */
export async function expectTranslationDisplayed(expected: {
  original?: string;
  iast?: string;
  words?: string[];
  alternatives?: string[];
}) {
  if (expected.original) {
    await waitFor(() => {
      expect(screen.getByText(expected.original!)).toBeTruthy();
    });
  }

  if (expected.iast) {
    await waitFor(() => {
      expect(screen.getByText(expected.iast!)).toBeTruthy();
    });
  }

  if (expected.words) {
    for (const word of expected.words) {
      await waitFor(() => {
        expect(screen.getByText(word)).toBeTruthy();
      });
    }
  }

  if (expected.alternatives) {
    for (const alt of expected.alternatives) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(alt, 'i'))).toBeTruthy();
      });
    }
  }
}

/** Assert that error message is shown */
export function expectErrorMessage(message: string | RegExp) {
  expect(screen.getByText(message)).toBeTruthy();
}

/** Assert that loading indicator is visible */
export function expectLoadingIndicator() {
  expect(screen.getByTestId('loading-spinner')).toBeTruthy();
}

/** Assert that button is in loading state */
export function expectButtonLoading() {
  const button = getTranslateButton();
  expect(button.props.disabled).toBe(true);
}
```

**Layer 4: Scenario Helpers** (Complete user flows)
```typescript
// tests/app/helpers/scenarios.ts

/** Complete flow: Translate text and verify results */
export async function performSuccessfulTranslation(
  input: string,
  expected: TranslationResult
) {
  // Setup mock
  const mocks = [createSuccessfulTranslationMock(input, expected)];
  renderTranslateScreen(mocks);

  // Perform action
  translateText(input);

  // Verify results
  await expectTranslationDisplayed({
    original: expected.originalText[0],
    iast: expected.iastText[0],
    words: expected.words.map(w => w.word),
    alternatives: expected.alternativeTranslations,
  });
}

/** Complete flow: Trigger error and verify handling */
export async function performFailedTranslation(
  input: string,
  errorMessage: string
) {
  const mocks = [createErrorMock(input, errorMessage)];
  renderTranslateScreen(mocks);

  translateText(input);

  await waitFor(() => {
    expectErrorMessage(/error|failed/i);
  });
}
```

### Helper Utilities

**IMPORTANT**: Start with minimal helpers, then **extract aggressively** as patterns emerge during TDD cycles.

**File**: `tests/app/helpers/apollo-mocks.ts`
```typescript
import { TranslateSutraDocument } from '@/graphql/generated/graphql';
import { TranslationResult } from '@/domain/types';

/**
 * Create a successful translation mock response.
 * Use this for happy path scenarios.
 */
export function createSuccessfulTranslationMock(
  input: string,
  result: TranslationResult
) {
  return {
    request: {
      query: TranslateSutraDocument,
      variables: { sutra: input },
    },
    result: { data: { translateSutra: result } },
  };
}

/**
 * Create an error mock response.
 * Use this for error handling scenarios.
 */
export function createErrorMock(input: string, errorMessage: string) {
  return {
    request: {
      query: TranslateSutraDocument,
      variables: { sutra: input },
    },
    error: new Error(errorMessage),
  };
}

/**
 * Create a loading mock with delay.
 * Use this for testing loading states.
 */
export function createLoadingMock(input: string, delayMs: number = 1000) {
  return {
    request: {
      query: TranslateSutraDocument,
      variables: { sutra: input },
    },
    result: {
      data: {
        translateSutra: {
          originalText: [input],
          iastText: [input],
          words: [],
          alternativeTranslations: [],
        },
      },
    },
    delay: delayMs,
  };
}

/**
 * Create mock data for standard test sutra.
 * Provides consistent test data across tests.
 */
export function createStandardSutraResult(): TranslationResult {
  return {
    originalText: ['atha yoganusasanam'],
    iastText: ['atha yogānuśāsanam'],
    words: [
      { word: 'atha', meanings: ['now', 'here begins'] },
      { word: 'yoga', meanings: ['yoga', 'union'] },
      { word: 'anusasanam', meanings: ['instruction', 'teaching'] },
    ],
    alternativeTranslations: [
      'Now begins the instruction of yoga',
      'Here begins the teaching of yoga',
    ],
  };
}
```

**File**: `tests/app/helpers/render-utils.ts`
```typescript
import { render, RenderOptions } from '@testing-library/react-native';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import TranslateScreen from '@/app/translate';

/**
 * Render a component wrapped in Apollo MockedProvider.
 * This is the base rendering utility.
 */
export function renderWithApollo(
  component: React.ReactElement,
  mocks: MockedResponse[] = []
) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {component}
    </MockedProvider>
  );
}

/**
 * Render the TranslateScreen with mocks.
 * This is the primary helper for most tests.
 */
export function renderTranslateScreen(mocks: MockedResponse[] = []) {
  return renderWithApollo(<TranslateScreen />, mocks);
}
```

**File**: `tests/app/helpers/interactions.ts`
```typescript
import { screen, fireEvent, waitFor } from '@testing-library/react-native';

/** Query helpers - find elements on screen */
export function getSanskritInput() {
  return screen.getByPlaceholderText(/enter sanskrit text/i);
}

export function getTranslateButton() {
  return screen.getByRole('button', { name: /translate/i });
}

export function getCopyButton() {
  return screen.getByRole('button', { name: /copy/i });
}

/** Action helpers - simulate user interactions */
export function enterSanskritText(text: string) {
  const input = getSanskritInput();
  fireEvent.changeText(input, text);
}

export function clickTranslate() {
  const button = getTranslateButton();
  fireEvent.press(button);
}

export function clickCopyIast() {
  const copyButton = getCopyButton();
  fireEvent.press(copyButton);
}

/** Combined action - most common user flow */
export function translateText(text: string) {
  enterSanskritText(text);
  clickTranslate();
}
```

**File**: `tests/app/helpers/assertions.ts`
```typescript
import { screen, waitFor } from '@testing-library/react-native';
import { expect } from 'vitest';

/** Assert translation results are displayed */
export async function expectTranslationDisplayed(expected: {
  original?: string;
  iast?: string;
  words?: string[];
  alternatives?: string[];
}) {
  if (expected.original) {
    await waitFor(() => {
      expect(screen.getByText(expected.original!)).toBeTruthy();
    });
  }

  if (expected.iast) {
    await waitFor(() => {
      expect(screen.getByText(expected.iast!)).toBeTruthy();
    });
  }

  if (expected.words) {
    for (const word of expected.words) {
      await waitFor(() => {
        expect(screen.getByText(word)).toBeTruthy();
      });
    }
  }

  if (expected.alternatives) {
    for (const alt of expected.alternatives) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(alt, 'i'))).toBeTruthy();
      });
    }
  }
}

/** Assert error message is shown */
export function expectErrorMessage(message: string | RegExp) {
  expect(screen.getByText(message)).toBeTruthy();
}

/** Assert loading state */
export function expectLoadingIndicator() {
  expect(screen.getByTestId('loading-spinner')).toBeTruthy();
}
```

### DSL Evolution During TDD

**Phase 1: Initial Test** (Inline everything)
```typescript
test('displays translation results', async () => {
  const mock = {
    request: { query: TranslateSutraDocument, variables: { sutra: 'om' } },
    result: { data: { translateSutra: { /* ... */ } } },
  };

  render(
    <MockedProvider mocks={[mock]} addTypename={false}>
      <TranslateScreen />
    </MockedProvider>
  );

  const input = screen.getByPlaceholderText(/enter sanskrit text/i);
  fireEvent.changeText(input, 'om');

  const button = screen.getByRole('button', { name: /translate/i });
  fireEvent.press(button);

  await waitFor(() => {
    expect(screen.getByText('om')).toBeTruthy();
  });
});
```

**Phase 2: Extract Helpers** (After 2-3 tests reveal patterns)
```typescript
test('displays translation results', async () => {
  const mock = createSuccessfulTranslationMock('om', standardResult);
  renderTranslateScreen([mock]);

  translateText('om');

  await expectTranslationDisplayed({
    original: 'om',
    iast: 'oṃ',
  });
});
```

**Phase 3: High-Level DSL** (After 5+ tests)
```typescript
test('displays translation results', async () => {
  await performSuccessfulTranslation('om', standardResult);
});
```

**Guideline**: Stop extracting when the test becomes **less readable**. Tests should tell a story, not hide all details.

## Aligning Tests with Given/When/Then Format

### Overview

The acceptance criteria are written in **Gherkin format** (Given/When/Then). Frontend tests should mirror this structure to maintain traceability between requirements and implementation.

### Approaches for Given/When/Then Alignment

**Option 1: Comment-Based Alignment** (Recommended for this project)
- Use comments to mark Given/When/Then sections
- Works with any test framework
- Clear visual structure without additional dependencies
- Easy for AI agents to understand and maintain

**Option 2: Nested Describe Blocks**
- Use `describe()` blocks for Given, `it()` for When/Then
- More verbose, complex for simple scenarios
- Better for complex scenarios with multiple Given states

**Option 3: Custom Gherkin-Style Functions**
- Create `given()`, `when()`, `then()` helper functions
- Most explicit alignment with acceptance criteria
- Slightly more setup, but excellent readability

### Option 1: Comment-Based Alignment (Recommended)

This approach uses inline comments to mark Given/When/Then sections while keeping standard Vitest syntax.

**Acceptance Criterion** (from acceptance-criteria.md):
```gherkin
Scenario: Successful translation of IAST text

Given I am on the translation frontend page
And the GraphQL server is running
When I enter "atha yoganusasanam" in the translation input field
And I click the "Translate" button
Then I should see the original text "atha yoganusasanam"
And I should see the IAST text "atha yogānuśāsanam"
And I should see a word breakdown with "atha" meaning "now, here begins"
And I should see alternative translations
```

**Test Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { renderTranslateScreen } from '../helpers/render-utils';
import { createSuccessfulTranslationMock, createStandardSutraResult } from '../helpers/apollo-mocks';
import { translateText } from '../helpers/interactions';
import { expectTranslationDisplayed } from '../helpers/assertions';

describe('Feature: Web Interface for Sanskrit Translation', () => {
  describe('Scenario: Successful translation of IAST text', () => {
    it('displays translation results when user submits IAST text', async () => {
      const iastInput = 'atha yoganusasanam';
      const expectedResult = createStandardSutraResult();

      // GIVEN: I am on the translation frontend page
      // AND: the GraphQL server is running (mocked)
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I enter "atha yoganusasanam" in the translation input field
      // AND: I click the "Translate" button
      translateText(iastInput);

      // THEN: I should see the original text "atha yoganusasanam"
      // AND: I should see the IAST text "atha yogānuśāsanam"
      // AND: I should see a word breakdown with "atha" meaning "now, here begins"
      // AND: I should see alternative translations
      await expectTranslationDisplayed({
        original: iastInput,
        iast: 'atha yogānuśāsanam',
        words: ['atha', 'yoga', 'anusasanam'],
        alternatives: ['Now begins the instruction of yoga'],
      });
    });
  });
});
```

**Benefits**:
- ✅ Clear mapping to acceptance criteria
- ✅ No additional dependencies
- ✅ Works with existing test framework
- ✅ Easy for agents to parse and generate

### Option 2: Nested Describe Blocks

This approach uses `describe()` blocks to structure Given/When/Then explicitly.

```typescript
describe('Feature: Web Interface for Sanskrit Translation', () => {
  describe('Scenario: Successful translation of IAST text', () => {
    describe('Given I am on the translation frontend page', () => {
      describe('When I enter IAST text and click Translate', () => {
        it('Then displays the original text', async () => {
          const mock = createSuccessfulTranslationMock('atha yoganusasanam', createStandardSutraResult());
          renderTranslateScreen([mock]);
          translateText('atha yoganusasanam');

          await expectTranslationDisplayed({
            original: 'atha yoganusasanam',
          });
        });

        it('Then displays the IAST text', async () => {
          const mock = createSuccessfulTranslationMock('atha yoganusasanam', createStandardSutraResult());
          renderTranslateScreen([mock]);
          translateText('atha yoganusasanam');

          await expectTranslationDisplayed({
            iast: 'atha yogānuśāsanam',
          });
        });

        // ... more "Then" assertions
      });
    });
  });
});
```

**Benefits**:
- ✅ Explicit Given/When/Then structure
- ✅ Test output shows full scenario path
- ❌ More verbose (repeated setup in each `it()`)
- ❌ Less practical for simple scenarios

### Option 3: Custom Gherkin-Style Functions

Create helper functions that mirror Gherkin syntax.

**File**: `tests/app/helpers/gherkin.ts`
```typescript
import { renderTranslateScreen } from './render-utils';
import { translateText as performTranslation } from './interactions';
import { expectTranslationDisplayed } from './assertions';

/** Given context setup */
export function givenUserIsOnTranslationPage(mocks: any[] = []) {
  return renderTranslateScreen(mocks);
}

/** When user actions */
export function whenUserTranslatesText(text: string) {
  performTranslation(text);
}

/** Then assertions */
export function thenUserShouldSeeTranslation(expected: {
  original?: string;
  iast?: string;
  words?: string[];
  alternatives?: string[];
}) {
  return expectTranslationDisplayed(expected);
}
```

**Test Implementation**:
```typescript
import { describe, it } from 'vitest';
import { createSuccessfulTranslationMock, createStandardSutraResult } from '../helpers/apollo-mocks';
import {
  givenUserIsOnTranslationPage,
  whenUserTranslatesText,
  thenUserShouldSeeTranslation
} from '../helpers/gherkin';

describe('Scenario: Successful translation of IAST text', () => {
  it('displays translation results', async () => {
    const iastInput = 'atha yoganusasanam';
    const expectedResult = createStandardSutraResult();
    const mock = createSuccessfulTranslationMock(iastInput, expectedResult);

    givenUserIsOnTranslationPage([mock]);
    whenUserTranslatesText(iastInput);
    await thenUserShouldSeeTranslation({
      original: iastInput,
      iast: 'atha yogānuśāsanam',
      words: ['atha', 'yoga', 'anusasanam'],
    });
  });
});
```

**Benefits**:
- ✅ Most explicit Given/When/Then alignment
- ✅ Reads almost exactly like acceptance criteria
- ✅ Self-documenting code
- ❌ Requires additional helper layer
- ❌ May be overly verbose for simple tests

### Recommended Approach: Comment-Based with DSL

**Best Practice**: Combine **Option 1** (comment-based) with the **Testing DSL** for optimal readability and maintainability.

**Structure**:
```typescript
describe('Scenario: <scenario name from AC>', () => {
  it('<user story summary>', async () => {
    // GIVEN: <preconditions>
    <setup code using DSL helpers>

    // WHEN: <user actions>
    <action code using DSL helpers>

    // THEN: <expected outcomes>
    <assertion code using DSL helpers>
  });
});
```

**Full Example**:
```typescript
describe('Scenario: Empty input validation', () => {
  it('shows error when user clicks translate with empty input', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the translation input field is empty
    renderTranslateScreen(); // No mocks needed - validation is client-side

    // WHEN: I click the "Translate" button
    clickTranslate();

    // THEN: I should see an error message "Please enter Sanskrit text to translate"
    // AND: no translation request should be sent to the server
    expectErrorMessage(/please enter sanskrit text to translate/i);
  });
});
```

### Mapping Acceptance Criteria to Tests

**Directory Structure** mirrors acceptance criteria:

```
docs/features/005-basic-translation-frontend/
└── acceptance-criteria.md        # Source of truth
    ├── Scenario: Successful translation of IAST text
    ├── Scenario: Successful translation of Devanagari text
    ├── Scenario: Empty input validation
    └── ...

tests/app/translate/
├── iast-translation.test.tsx     # Tests "Successful translation of IAST text"
├── devanagari-translation.test.tsx # Tests "Successful translation of Devanagari text"
├── validation.test.tsx           # Tests "Empty input validation"
└── ...
```

**Test File Header** references acceptance criteria:

```typescript
/**
 * Acceptance Criterion: Successful translation of IAST text
 *
 * Source: docs/features/005-basic-translation-frontend/acceptance-criteria.md
 *
 * Scenario: Successful translation of IAST text
 *
 * Given I am on the translation frontend page
 * And the GraphQL server is running
 * When I enter "atha yoganusasanam" in the translation input field
 * And I click the "Translate" button
 * Then I should see the original text "atha yoganusasanam"
 * And I should see the IAST text "atha yogānuśāsanam"
 * And I should see a word breakdown with "atha" meaning "now, here begins"
 * And I should see alternative translations
 */

import { describe, it } from 'vitest';
import { renderTranslateScreen } from '../helpers/render-utils';
// ... rest of test
```

### Benefits of Given/When/Then Alignment

1. **Traceability**: Direct mapping from acceptance criteria to test code
2. **Living Documentation**: Tests serve as executable specifications
3. **Shared Language**: Business stakeholders can read and understand tests
4. **Regression Prevention**: Changes to ACs are immediately visible in tests
5. **AI Agent Friendly**: Clear structure for agents to follow when generating tests

### Integration with TDD Workflow

**During RED phase** (write failing test):
```typescript
describe('Scenario: Copy translation results', () => {
  it('copies IAST text when user clicks copy button', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: I have a successful translation displayed
    const mock = createSuccessfulTranslationMock('om', createStandardSutraResult());
    renderTranslateScreen([mock]);
    translateText('om');
    await expectTranslationDisplayed({ iast: 'oṃ' });

    // WHEN: I click the "Copy" button next to the IAST text
    clickCopyIast();

    // THEN: the IAST text should be copied to my clipboard
    // AND: I should see a confirmation message
    expectClipboardContains('oṃ');
    expectConfirmationMessage(/copied/i);
  });
});
```

**Test fails** ❌ - copy button doesn't exist yet

**During GREEN phase** - implement minimal code to pass

**During REFACTOR phase** - improve test using DSL:
```typescript
describe('Scenario: Copy translation results', () => {
  it('copies IAST text when user clicks copy button', async () => {
    // GIVEN: successful translation displayed
    await givenSuccessfulTranslation('om');

    // WHEN: user clicks copy button
    clickCopyIast();

    // THEN: IAST copied and confirmation shown
    await expectIastCopiedWithConfirmation('oṃ');
  });
});
```

### Comparison: With vs Without Given/When/Then

**Without Given/When/Then**:
```typescript
it('copies text to clipboard', async () => {
  renderTranslateScreen([mock]);
  translateText('om');
  await waitFor(() => expect(screen.getByText('oṃ')).toBeTruthy());
  clickCopyIast();
  expect(clipboard.setStringAsync).toHaveBeenCalledWith('oṃ');
});
```
- ❌ Hard to understand what scenario this tests
- ❌ No clear connection to acceptance criteria
- ❌ Implementation details obscure intent

**With Given/When/Then**:
```typescript
it('copies IAST text when user clicks copy button', async () => {
  // GIVEN: successful translation displayed
  const mock = createSuccessfulTranslationMock('om', standardResult);
  renderTranslateScreen([mock]);
  translateText('om');
  await expectTranslationDisplayed({ iast: 'oṃ' });

  // WHEN: user clicks copy button
  clickCopyIast();

  // THEN: IAST copied to clipboard
  expectClipboardContains('oṃ');
});
```
- ✅ Clear scenario description
- ✅ Direct mapping to acceptance criteria
- ✅ Intent is obvious from structure

## Example Test Outline: IAST Translation

**Acceptance Criterion**: Successful translation of IAST text

**File**: `tests/app/translate/iast-translation.test.tsx`

### Version 1: Without DSL (Initial implementation)

This shows what the test looks like during initial TDD before extracting helpers:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '@/app/translate';
import { TranslateSutraDocument } from '@/graphql/generated/graphql';

describe('AC: Successful translation of IAST text', () => {
  // ARRANGE: Define mock data (repetitive - extract later)
  const iastInput = 'atha yoganusasanam';
  const mockResponse = {
    request: {
      query: TranslateSutraDocument,
      variables: { sutra: iastInput },
    },
    result: {
      data: {
        translateSutra: {
          originalText: [iastInput],
          iastText: ['atha yogānuśāsanam'],
          words: [
            { word: 'atha', meanings: ['now', 'here begins'] },
            { word: 'yoga', meanings: ['yoga', 'union'] },
            { word: 'anusasanam', meanings: ['instruction', 'teaching'] },
          ],
          alternativeTranslations: [
            'Now begins the instruction of yoga',
            'Here begins the teaching of yoga',
          ],
        },
      },
    },
  };

  it('displays original text after successful translation', async () => {
    // ARRANGE (repetitive - extract to helper)
    render(
      <MockedProvider mocks={[mockResponse]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // ACT: User enters text and clicks translate (repetitive - extract to helper)
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, iastInput);

    const button = screen.getByRole('button', { name: /translate/i });
    fireEvent.press(button);

    // ASSERT: Original text appears
    await waitFor(() => {
      expect(screen.getByText(iastInput)).toBeTruthy();
    });
  });

  it('displays IAST text with proper diacritics', async () => {
    // Same repetitive setup...
    render(
      <MockedProvider mocks={[mockResponse]} addTypename={false}>
        <TranslateScreen />
      </MockedProvider>
    );

    // Same repetitive actions...
    const input = screen.getByPlaceholderText(/enter sanskrit text/i);
    fireEvent.changeText(input, iastInput);
    fireEvent.press(screen.getByRole('button', { name: /translate/i }));

    // ASSERT: IAST text with diacritics appears
    await waitFor(() => {
      expect(screen.getByText('atha yogānuśāsanam')).toBeTruthy();
    });
  });

  // ... more repetitive tests
});
```

**Problems with this approach**:
- ❌ 10+ lines of setup code repeated in every test
- ❌ Same query patterns repeated (`screen.getByPlaceholderText`, `fireEvent.changeText`)
- ❌ Implementation details leak into tests (MockedProvider, addTypename)
- ❌ Hard to maintain (UI changes require updates in many places)

---

### Version 2: With DSL + Given/When/Then (Recommended)

This shows the same tests using the Testing DSL helpers with Given/When/Then alignment:

```typescript
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react-native';
// DSL imports - helper functions that read like domain language
import { renderTranslateScreen } from '../helpers/render-utils';
import { createSuccessfulTranslationMock, createStandardSutraResult } from '../helpers/apollo-mocks';
import { translateText, enterSanskritText, clickTranslate } from '../helpers/interactions';
import { expectTranslationDisplayed } from '../helpers/assertions';

describe('Feature: Web Interface for Sanskrit Translation', () => {
  describe('Scenario: Successful translation of IAST text', () => {
    const iastInput = 'atha yoganusasanam';
    const expectedResult = createStandardSutraResult();

    it('displays original text after successful translation', async () => {
      // GIVEN: I am on the translation frontend page
      // AND: the GraphQL server is running
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I enter "atha yoganusasanam" in the translation input field
      // AND: I click the "Translate" button
      translateText(iastInput);

      // THEN: I should see the original text "atha yoganusasanam"
      await expectTranslationDisplayed({
        original: iastInput,
      });
    });

    it('displays IAST text with proper diacritics', async () => {
      // GIVEN: I am on the translation frontend page
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I enter IAST text and click "Translate"
      translateText(iastInput);

      // THEN: I should see the IAST text "atha yogānuśāsanam"
      await expectTranslationDisplayed({
        iast: 'atha yogānuśāsanam',
      });
    });

    it('displays word breakdown with meanings', async () => {
      // GIVEN: I am on the translation frontend page
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I submit a translation
      translateText(iastInput);

      // THEN: I should see a word breakdown with "atha" meaning "now, here begins"
      await expectTranslationDisplayed({
        words: ['atha', 'yoga', 'anusasanam'],
      });
    });

    it('displays alternative translations', async () => {
      // GIVEN: I am on the translation frontend page
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I submit a translation
      translateText(iastInput);

      // THEN: I should see alternative translations
      await expectTranslationDisplayed({
        alternatives: [
          'Now begins the instruction of yoga',
          'Here begins the teaching of yoga',
        ],
      });
    });

    it('completes the full acceptance scenario', async () => {
      // GIVEN: I am on the translation frontend page
      // AND: the GraphQL server is running
      const mock = createSuccessfulTranslationMock(iastInput, expectedResult);
      renderTranslateScreen([mock]);

      // WHEN: I enter "atha yoganusasanam" in the translation input field
      // AND: I click the "Translate" button
      translateText(iastInput);

      // THEN: I should see the original text "atha yoganusasanam"
      // AND: I should see the IAST text "atha yogānuśāsanam"
      // AND: I should see a word breakdown with "atha" meaning "now, here begins"
      // AND: I should see alternative translations
      await expectTranslationDisplayed({
        original: iastInput,
        iast: 'atha yogānuśāsanam',
        words: ['atha', 'yoga'],
        alternatives: ['Now begins the instruction of yoga'],
      });
    });
  });
});
```

**Benefits of DSL + Given/When/Then approach**:
- ✅ Tests are 50% shorter and read like user stories
- ✅ Setup reduced to 2 lines (`createSuccessfulTranslationMock` + `renderTranslateScreen`)
- ✅ Actions express intent (`translateText`) not implementation (`fireEvent.changeText`)
- ✅ Assertions are declarative (`expectTranslationDisplayed`) not imperative
- ✅ UI changes require updates in ONE helper file, not 10+ test files
- ✅ **Direct AC mapping**: Given/When/Then comments match acceptance criteria exactly
- ✅ **Traceability**: Easy to verify test covers all parts of acceptance scenario

---

### Comparison: Lines of Code

**Without DSL** (per test):
- Setup: 7 lines (MockedProvider wrapper + mock definition)
- Actions: 4 lines (find input, type, find button, click)
- Assertions: 3-5 lines (waitFor + expect)
- **Total**: ~15 lines per test

**With DSL** (per test):
- Setup: 2 lines (create mock + render)
- Actions: 1 line (translateText)
- Assertions: 1-3 lines (expectTranslationDisplayed)
- **Total**: ~5 lines per test

**For 10 acceptance criteria with ~30 tests total**:
- Without DSL: ~450 lines
- With DSL: ~150 lines + ~200 lines of reusable helpers = **350 total**
- **Savings**: 100 lines + better maintainability

### Test Pattern Explanation

**Arrange-Act-Assert Structure**:
1. **Arrange**: Set up mock data, render component with `MockedProvider`
2. **Act**: Simulate user interactions using `fireEvent` (changeText, press)
3. **Assert**: Use `waitFor` for async queries, check rendered text with `screen.getByText`

**Key Testing Library APIs**:
- `render()`: Render React Native component
- `screen.getByPlaceholderText()`: Find TextInput by placeholder
- `screen.getByRole('button')`: Find button by accessibility role
- `screen.getByText()`: Find element containing text
- `fireEvent.changeText()`: Simulate typing in TextInput
- `fireEvent.press()`: Simulate button press
- `waitFor()`: Wait for async state updates (Apollo query completion)

**Why `waitFor()`?**
- Apollo Client queries are asynchronous
- After pressing "Translate", component re-renders when data arrives
- `waitFor()` retries assertion until it passes or times out

## Tool Choices

### Testing Framework: Vitest

**Why Vitest?**
- Fast, modern test runner
- Compatible with React Native Testing Library
- Excellent TypeScript support
- Built-in mocking (`vi.mock()`)
- Already used in backend tests (consistency)

**Alternative Considered**: Jest
- Rejected: Vitest is faster and has better ESM support

### Component Testing: React Native Testing Library

**Why React Native Testing Library?**
- Recommended by React Native community
- Encourages testing user behavior, not implementation
- Works with React Native primitives (View, Text, Pressable)
- Accessibility-focused queries (`getByRole`, `getByLabelText`)

**Alternative Considered**: Enzyme
- Rejected: Not compatible with React Native, outdated

### Mocking: Apollo Client MockedProvider

**Why MockedProvider?**
- Official Apollo testing utility
- Designed specifically for testing Apollo Client hooks
- Supports loading states, errors, delays
- No network calls during tests

**Alternative Considered**: Manual mock implementation
- Rejected: MockedProvider handles edge cases (cache, errors) better

### Clipboard Mocking: Vitest vi.mock()

**Why vi.mock()?**
- Simple module replacement
- No real clipboard access needed in tests
- Verify copy operations with spies

**Implementation**:
```typescript
import { vi } from 'vitest';

vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn().mockResolvedValue(undefined),
  getStringAsync: vi.fn().mockResolvedValue(''),
}));
```

## Test Execution Plan

### Running Tests

**All frontend tests**:
```bash
npm test tests/app/
```

**Single acceptance criterion**:
```bash
npm test tests/app/translate/iast-translation.test.tsx
```

**Watch mode** (during TDD):
```bash
npm test -- --watch tests/app/translate/validation.test.tsx
```

### CI/CD Integration

**Pre-commit hook** (optional):
```json
{
  "scripts": {
    "precommit": "npm run codegen && npm test"
  }
}
```

**GitHub Actions** (if used):
```yaml
- name: Generate GraphQL types
  run: npm run codegen

- name: Run frontend tests
  run: npm test tests/app/
```

### Test Prerequisites

**Before running tests**:
1. ✅ GraphQL Code Generator must run first (`npm run codegen`)
   - Generates `TranslateSutraDocument` and types
   - Tests import from `@/graphql/generated/graphql`

2. ✅ Dependencies installed (`npm install`)
   - `@testing-library/react-native`
   - `@apollo/client`
   - `vitest`

3. ❌ Backend server NOT required (mocked)

**Setup in package.json**:
```json
{
  "scripts": {
    "pretest": "npm run codegen",
    "codegen": "graphql-codegen --config codegen.yml",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:frontend": "vitest run tests/app/"
  }
}
```

## Test Coverage Mapping

| Acceptance Criterion | Test File | Mock Strategy | Key Assertions |
|---------------------|-----------|---------------|----------------|
| Empty input validation | `validation.test.tsx` | No mock needed (skip query) | Error message visible, button disabled |
| Loading state | `loading.test.tsx` | Use `delay` in mock | Spinner visible, button disabled |
| IAST translation | `iast-translation.test.tsx` | Success mock | Original, IAST, words, alternatives visible |
| Devanagari translation | `devanagari-translation.test.tsx` | Success mock (Devanagari input) | Devanagari original, IAST output |
| Server error | `error-handling.test.tsx` | Error mock | Error message visible, retry enabled |
| Multi-line support | `multiline.test.tsx` | Success mock (multi-line arrays) | Each line visible, separated |
| Clear previous results | `clear-results.test.tsx` | Two sequential mocks | Old results hidden during new query |
| Copy functionality | `copy.test.tsx` | Success mock + clipboard spy | Clipboard API called, confirmation shown |
| Alternative translations | `alternatives.test.tsx` | Success mock (with alternatives) | Max 3 alternatives, clearly separated |
| Responsive layout | `responsive.test.tsx` | No mock needed (static rendering) | Elements have correct styles/classes |

### Coverage Goals

**Target**: 100% of acceptance criteria covered by tests

**Not Covered** (intentionally):
- GraphQL server implementation (tested in backend acceptance tests)
- Translation service logic (tested in backend)
- React Native platform-specific code (tested by RN framework)
- Expo Router internals (tested by Expo)

**What We Test**:
- User interactions (typing, clicking)
- State changes (loading, error, success)
- Rendered output (text, buttons, errors)
- Component integration (parent-child communication)

## TDD Workflow Integration

### Red-Green-Refactor Cycle

**Phase Example: Empty Input Validation**

#### 1. RED - Write Failing Test

**File**: `tests/app/translate/validation.test.tsx`
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TranslateScreen from '@/app/translate';

describe('AC: Empty input validation', () => {
  it('shows error when translate clicked with empty input', () => {
    // ARRANGE
    render(<TranslateScreen />);

    // ACT
    const button = screen.getByRole('button', { name: /translate/i });
    fireEvent.press(button);

    // ASSERT
    expect(
      screen.getByText(/please enter sanskrit text to translate/i)
    ).toBeTruthy();
  });
});
```

**Run test**:
```bash
npm test tests/app/translate/validation.test.tsx
```

**Expected**: ❌ Test fails - component doesn't exist yet

---

#### 2. GREEN - Minimal Implementation

**File**: `app/app/translate.tsx`
```typescript
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

export default function TranslateScreen() {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const handleTranslate = () => {
    if (!inputText.trim()) {
      setError('Please enter Sanskrit text to translate');
      return;
    }
    setError('');
    // Translation logic will be added in next TDD cycle
  };

  return (
    <View>
      <TextInput
        placeholder="Enter Sanskrit text"
        value={inputText}
        onChangeText={setInputText}
        accessibilityRole="none"
      />
      <Pressable
        onPress={handleTranslate}
        accessibilityRole="button"
        accessibilityLabel="Translate"
      >
        <Text>Translate</Text>
      </Pressable>
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

**Run test**:
```bash
npm test tests/app/translate/validation.test.tsx
```

**Expected**: ✅ Test passes

---

#### 3. REFACTOR - Extract Components

**File**: `app/components/translation/SutraInput.tsx`
```typescript
interface SutraInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  error?: string;
}

export default function SutraInput({
  value,
  onChange,
  onSubmit,
  error,
}: SutraInputProps) {
  return (
    <View>
      <TextInput
        placeholder="Enter Sanskrit text"
        value={value}
        onChangeText={onChange}
        multiline
        accessibilityRole="none"
      />
      <Pressable
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel="Translate"
      >
        <Text>Translate</Text>
      </Pressable>
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

**Updated**: `app/app/translate.tsx`
```typescript
import SutraInput from '@/components/translation/SutraInput';

export default function TranslateScreen() {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const handleTranslate = () => {
    if (!inputText.trim()) {
      setError('Please enter Sanskrit text to translate');
      return;
    }
    setError('');
  };

  return (
    <SutraInput
      value={inputText}
      onChange={setInputText}
      onSubmit={handleTranslate}
      error={error}
    />
  );
}
```

**Run test again**:
```bash
npm test tests/app/translate/validation.test.tsx
```

**Expected**: ✅ Test still passes (refactor preserves behavior)

---

### Repeat for Each Acceptance Criterion

**Phase 2: Loading State**
1. RED: Test expects loading spinner when query in flight
2. GREEN: Add Apollo Client, use `loading` state
3. REFACTOR: Extract LoadingSpinner component

**Phase 3: IAST Translation**
1. RED: Test expects translation results displayed
2. GREEN: Add TranslationResult component
3. REFACTOR: Extract OriginalText, IastText, etc.

... (continue for all 10 acceptance criteria)

## Edge Cases & Error Scenarios

### Edge Cases to Test

1. **Very long input** (1000+ characters)
   - Test: Input accepted, query sent
   - Expected: Loading indicator, eventual response

2. **Unicode edge cases** (combining diacritics, zero-width joiners)
   - Test: Unicode preserved in GraphQL variables
   - Expected: Correct IAST output

3. **Empty alternative translations** (API returns null or [])
   - Test: Section hidden or shows "No alternatives available"
   - Expected: No crash, graceful degradation

4. **Network timeout** (long delay mock)
   - Test: Error displayed after timeout
   - Expected: User-friendly message, retry option

5. **Rapid submit clicks** (user clicks Translate multiple times)
   - Test: Button disabled during loading
   - Expected: Only one query sent

6. **Special characters** (newlines, tabs, non-breaking spaces)
   - Test: Characters preserved in query
   - Expected: Backend handles special chars

### Error Scenarios

1. **GraphQL error** (API returns error response)
   - Mock: `error: new Error('Translation failed')`
   - Expected: Error message visible, retry enabled

2. **Network error** (cannot reach server)
   - Mock: `error: new Error('Network request failed')`
   - Expected: "Cannot connect to server" message

3. **Malformed response** (API returns unexpected shape)
   - Mock: Missing required fields
   - Expected: Apollo Client error handling, fallback UI

4. **Empty response** (API returns null data)
   - Mock: `data: { translateSutra: null }`
   - Expected: "No results found" message

## Non-Functional Testing Considerations

### Accessibility Testing

**Approach**: Test accessibility props in component rendering

```typescript
it('has accessible form elements', () => {
  render(<TranslateScreen />);

  const input = screen.getByPlaceholderText(/enter sanskrit text/i);
  expect(input.props.accessibilityRole).toBe('none'); // TextInput default

  const button = screen.getByRole('button', { name: /translate/i });
  expect(button.props.accessibilityRole).toBe('button');
  expect(button.props.accessibilityLabel).toBe('Translate');
});
```

**Manual Testing** (not automated):
- Screen reader navigation (VoiceOver, NVDA)
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (button disabled when loading)

### Performance Testing

**Not in scope for acceptance tests**, but consider:
- Render performance (React DevTools Profiler)
- Memory leaks (manual testing)
- Large input handling (stress testing)

### Responsive Layout Testing

**Approach**: Test that responsive classes are applied

```typescript
it('applies responsive layout classes', () => {
  const { container } = render(<TranslateScreen />);

  // Check NativeWind classes applied
  expect(container).toMatchSnapshot(); // Snapshot test for styles

  // Or query specific style props
  const input = screen.getByPlaceholderText(/enter sanskrit text/i);
  expect(input.props.className).toContain('w-full'); // Full width
});
```

**Manual Testing** (browser dev tools):
- Mobile viewport (375px)
- Tablet viewport (768px)
- Desktop viewport (1024px+)

## Summary

### Test Design Overview

| Aspect | Decision |
|--------|----------|
| **Approach** | Direct Logic Testing (Option 1) |
| **Framework** | Vitest + React Native Testing Library |
| **Mocking** | Apollo MockedProvider for GraphQL |
| **Organization** | One file per acceptance criterion |
| **Test Level** | Acceptance tests only (public contract) |
| **Isolation** | Complete (all external deps mocked) |
| **TDD Cycle** | Red-Green-Refactor per phase |
| **DSL Strategy** | Build reusable helpers for test readability |
| **AC Alignment** | Given/When/Then comments in test code |

### Key Benefits

1. ✅ **Agent-Friendly**: Easy for AI to generate and maintain tests
2. ✅ **Fast Execution**: No browser overhead, runs in milliseconds
3. ✅ **Deterministic**: Mocked data ensures consistent results
4. ✅ **Follows Standards**: Matches AGENTS.md requirements (acceptance tests, no unit tests)
5. ✅ **Supports TDD**: Quick feedback loop for red-green-refactor
6. ✅ **Maintainable**: Tests mirror acceptance criteria structure
7. ✅ **Domain-Specific Language**: Helper methods make tests read like user stories
8. ✅ **Given/When/Then Alignment**: Tests map directly to acceptance criteria using comment-based structure

### Testing DSL Benefits

**Extract Reusable Code Into Helpers**:
- ✅ **Reduced Duplication**: Common patterns (render, mock, interact, assert) extracted to helpers
- ✅ **Better Readability**: Tests use domain language (`translateText()`) instead of low-level APIs (`fireEvent.changeText()`)
- ✅ **Single Source of Truth**: UI changes update in one helper file, not 30+ test files
- ✅ **Faster Test Writing**: New tests compose existing helpers
- ✅ **Self-Documenting**: Helper names express intent (`expectTranslationDisplayed`)

**DSL Layers**:
1. **Layer 1** - Element finders: `getSanskritInput()`, `getTranslateButton()`
2. **Layer 2** - User actions: `enterSanskritText()`, `clickTranslate()`, `translateText()`
3. **Layer 3** - Assertions: `expectTranslationDisplayed()`, `expectErrorMessage()`
4. **Layer 4** - Scenarios: `performSuccessfulTranslation()` (compose layers 1-3)

**Extraction Rule**: When code appears in 2+ tests → extract to helper

### Given/When/Then Alignment Benefits

**Test Structure Mirrors Acceptance Criteria**:
- ✅ **Direct Traceability**: Every test maps to a specific Gherkin scenario
- ✅ **Living Documentation**: Tests serve as executable specifications
- ✅ **Shared Language**: Business stakeholders can understand test intent
- ✅ **Comment-Based Approach**: Use `// GIVEN:`, `// WHEN:`, `// THEN:` comments to structure tests
- ✅ **Three Options**: Comment-based (recommended), nested describe blocks, or custom Gherkin functions

**Example Test Structure**:
```typescript
describe('Scenario: <scenario name>', () => {
  it('<user story>', async () => {
    // GIVEN: <preconditions from AC>
    <setup using DSL>

    // WHEN: <user actions from AC>
    <actions using DSL>

    // THEN: <expected outcomes from AC>
    <assertions using DSL>
  });
});
```

### Next Steps

After test design approval (ss-mol-coh.2), implementation will proceed via TDD:

1. **Phase 0**: Set up Expo app, Apollo Client, GraphQL codegen
2. **Phase 1-10**: Implement each acceptance criterion via red-green-refactor
3. **Each phase**:
   - Write failing test (RED)
   - Write minimal code to pass (GREEN)
   - Refactor while keeping tests green (REFACTOR)

All tests will be written **before** implementation code, ensuring every feature has test coverage from day one.
