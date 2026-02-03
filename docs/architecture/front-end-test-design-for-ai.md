# Frontend Test Design for AI Agents

**Quick Reference for AI agents implementing frontend tests via TDD**

Full design: [front-end-test-design.md](./front-end-test-design.md)

**Scope**: Use this guide for testing **any frontend feature** in the Sanskrit Student application. Examples reference the Basic Translation Frontend as a template.

## Core Principles

1. **Acceptance tests only** - Test at the public contract level (component rendering/interaction)
2. **Complete isolation** - Mock all external dependencies (Apollo Client, clipboard, etc.)
3. **Given/When/Then format** - Use comments to align with acceptance criteria
4. **Extract to DSL** - When code appears in 2+ tests → extract to helper
5. **TDD workflow** - RED (write failing test) → GREEN (minimal code) → REFACTOR (extract helpers)

## Test Structure Template

```typescript
describe('Scenario: <scenario name from acceptance-criteria.md>', () => {
  it('<user story summary>', async () => {
    // GIVEN: <preconditions from acceptance criteria>
    <setup using helpers>

    // WHEN: <user actions from acceptance criteria>
    <actions using helpers>

    // THEN: <expected outcomes from acceptance criteria>
    <assertions using helpers>
  });
});
```

## Quick Start: Write Your First Test

**Step 1: Create test file** matching acceptance criterion
- File: `tests/app/translate/<criterion-name>.test.tsx`
- Example: `tests/app/translate/validation.test.tsx`

**Step 2: Copy this starter template**

```typescript
import { describe, it } from 'vitest';
import { renderTranslateScreen } from '../helpers/render-utils';
import { createSuccessfulTranslationMock } from '../helpers/apollo-mocks';
import { translateText } from '../helpers/interactions';
import { expectTranslationDisplayed } from '../helpers/assertions';

describe('Scenario: <copy scenario name from acceptance-criteria.md>', () => {
  it('<describe what user does and expects>', async () => {
    // GIVEN: <copy from acceptance criteria>
    const mock = createSuccessfulTranslationMock('input', expectedResult);
    renderTranslateScreen([mock]);

    // WHEN: <copy from acceptance criteria>
    translateText('input');

    // THEN: <copy from acceptance criteria>
    await expectTranslationDisplayed({
      original: 'expected',
      iast: 'expected',
    });
  });
});
```

**Step 3: Run test** - it should fail (RED)
```bash
npm test tests/app/translate/your-test.test.tsx
```

**Step 4: Implement minimal code** to make it pass (GREEN)

**Step 5: Extract repeated code** to helpers (REFACTOR)

## Available Helper Functions

### Setup Helpers (tests/app/helpers/)

**render-utils.ts**
```typescript
// Render TranslateScreen with Apollo mocks
renderTranslateScreen(mocks?: MockedResponse[])
```

**apollo-mocks.ts**
```typescript
// Create success mock
createSuccessfulTranslationMock(input: string, result: TranslationResult)

// Create error mock
createErrorMock(input: string, errorMessage: string)

// Create loading mock (with delay)
createLoadingMock(input: string, delayMs?: number)

// Standard test data
createStandardSutraResult(): TranslationResult
```

### Action Helpers (tests/app/helpers/interactions.ts)

```typescript
// Find elements
getSanskritInput()
getTranslateButton()
getCopyButton()

// User actions
enterSanskritText(text: string)
clickTranslate()
clickCopyIast()

// Combined action (most common)
translateText(text: string)  // enters text + clicks translate
```

### Assertion Helpers (tests/app/helpers/assertions.ts)

```typescript
// Assert translation results displayed
await expectTranslationDisplayed({
  original?: string,
  iast?: string,
  words?: string[],
  alternatives?: string[]
})

// Assert error shown
expectErrorMessage(message: string | RegExp)

// Assert loading state
expectLoadingIndicator()
```

## Common Test Patterns

### Pattern 1: Happy Path Translation

```typescript
it('displays translation results', async () => {
  // GIVEN: user is on translation page
  const mock = createSuccessfulTranslationMock('om', createStandardSutraResult());
  renderTranslateScreen([mock]);

  // WHEN: user translates text
  translateText('om');

  // THEN: results are displayed
  await expectTranslationDisplayed({
    original: 'om',
    iast: 'oṃ',
  });
});
```

### Pattern 2: Client-Side Validation

```typescript
it('shows error when input is empty', () => {
  // GIVEN: user is on translation page with empty input
  renderTranslateScreen(); // No mock needed

  // WHEN: user clicks translate
  clickTranslate();

  // THEN: error message is shown
  expectErrorMessage(/please enter sanskrit text/i);
});
```

### Pattern 3: Server Error Handling

```typescript
it('shows error when server fails', async () => {
  // GIVEN: server will return error
  const mock = createErrorMock('invalid', 'Translation failed');
  renderTranslateScreen([mock]);

  // WHEN: user attempts translation
  translateText('invalid');

  // THEN: error message is shown
  await waitFor(() => {
    expectErrorMessage(/error|failed/i);
  });
});
```

### Pattern 4: Loading State

```typescript
it('shows loading indicator during translation', async () => {
  // GIVEN: server will delay response
  const mock = createLoadingMock('om', 1000);
  renderTranslateScreen([mock]);

  // WHEN: user submits translation
  translateText('om');

  // THEN: loading indicator is shown immediately
  expectLoadingIndicator();
});
```

## When to Extract Helpers

**Extract immediately when:**
- ✅ Same code appears in 2+ tests
- ✅ Complex setup (creating mocks with lots of data)
- ✅ Multi-step action (type text + click button)
- ✅ Repeated assertion pattern

**Keep inline when:**
- ❌ One-off action unique to single test
- ❌ Helper would make test less readable

### Example: Before and After Extraction

**Before** (repeated in 5 tests):
```typescript
const input = screen.getByPlaceholderText(/enter sanskrit text/i);
fireEvent.changeText(input, 'om');
const button = screen.getByRole('button', { name: /translate/i });
fireEvent.press(button);
```

**After** (extracted to helper):
```typescript
// In tests/app/helpers/interactions.ts
export function translateText(text: string) {
  const input = getSanskritInput();
  fireEvent.changeText(input, text);
  const button = getTranslateButton();
  fireEvent.press(button);
}

// In tests (5+ tests now use this)
translateText('om');
```

## Naming Conventions

**Actions** (verb-based):
- `enterSanskritText()`, `clickTranslate()`, `clickCopyIast()`

**Assertions** (expectation-based):
- `expectTranslationDisplayed()`, `expectErrorMessage()`, `expectLoadingIndicator()`

**Setup** (noun-based):
- `createSuccessfulTranslationMock()`, `renderTranslateScreen()`

**Queries** (get-based):
- `getSanskritInput()`, `getTranslateButton()`

## File Organization

```
tests/app/
├── helpers/
│   ├── apollo-mocks.ts        # Mock factories
│   ├── render-utils.ts        # Rendering helpers
│   ├── interactions.ts        # Action helpers
│   └── assertions.ts          # Assertion helpers
│
└── translate/
    ├── validation.test.tsx           # AC: Empty input validation
    ├── loading.test.tsx              # AC: Loading state
    ├── iast-translation.test.tsx     # AC: IAST translation
    └── ...                           # One file per AC
```

## Mapping Acceptance Criteria to Tests

**1. Open** `acceptance-criteria.md` and find your scenario:
```gherkin
Scenario: Successful translation of IAST text

Given I am on the translation frontend page
And the GraphQL server is running
When I enter "atha yoganusasanam" in the translation input field
And I click the "Translate" button
Then I should see the original text "atha yoganusasanam"
And I should see the IAST text "atha yogānuśāsanam"
```

**2. Create test file** `tests/app/translate/iast-translation.test.tsx`

**3. Copy scenario as comments** into test:
```typescript
describe('Scenario: Successful translation of IAST text', () => {
  it('displays translation results', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server is running

    // WHEN: I enter "atha yoganusasanam" in the translation input field
    // AND: I click the "Translate" button

    // THEN: I should see the original text "atha yoganusasanam"
    // AND: I should see the IAST text "atha yogānuśāsanam"
  });
});
```

**4. Fill in code** using helpers:
```typescript
describe('Scenario: Successful translation of IAST text', () => {
  it('displays translation results', async () => {
    // GIVEN: I am on the translation frontend page
    // AND: the GraphQL server is running
    const mock = createSuccessfulTranslationMock('atha yoganusasanam', expectedResult);
    renderTranslateScreen([mock]);

    // WHEN: I enter "atha yoganusasanam" in the translation input field
    // AND: I click the "Translate" button
    translateText('atha yoganusasanam');

    // THEN: I should see the original text "atha yoganusasanam"
    // AND: I should see the IAST text "atha yogānuśāsanam"
    await expectTranslationDisplayed({
      original: 'atha yoganusasanam',
      iast: 'atha yogānuśāsanam',
    });
  });
});
```

## TDD Workflow Checklist

For each acceptance criterion:

- [ ] **RED**: Write failing test with Given/When/Then comments
- [ ] Run test - verify it fails
- [ ] **GREEN**: Write minimal code to make test pass
- [ ] Run test - verify it passes
- [ ] **REFACTOR**: Extract any repeated code to helpers
- [ ] Run test - verify it still passes
- [ ] Move to next acceptance criterion

## Common Mistakes to Avoid

❌ **Don't**: Write unit tests for individual functions
✅ **Do**: Write acceptance tests for user-visible behavior

❌ **Don't**: Mock React Native components
✅ **Do**: Mock external services (Apollo Client, clipboard)

❌ **Don't**: Test implementation details
✅ **Do**: Test what user sees and does

❌ **Don't**: Copy-paste setup code across tests
✅ **Do**: Extract to helpers after 2nd occurrence

❌ **Don't**: Skip Given/When/Then comments
✅ **Do**: Always include them for traceability

❌ **Don't**: Make helpers too abstract/generic
✅ **Do**: Keep helpers readable and domain-specific

## Helper Creation Workflow

**When you notice repetition:**

1. **Identify the pattern** - What code is repeated?
2. **Choose the layer** - Setup, action, assertion, or scenario?
3. **Name descriptively** - Use domain language
4. **Extract to helper** - Create function in appropriate file
5. **Update all tests** - Replace inline code with helper call
6. **Verify tests pass** - Ensure extraction didn't break anything

## Quick Reference: Test Imports

```typescript
// Always needed
import { describe, it } from 'vitest';

// For async tests
import { waitFor } from '@testing-library/react-native';

// Setup helpers
import { renderTranslateScreen } from '../helpers/render-utils';
import {
  createSuccessfulTranslationMock,
  createErrorMock,
  createStandardSutraResult
} from '../helpers/apollo-mocks';

// Action helpers
import {
  translateText,
  enterSanskritText,
  clickTranslate,
  clickCopyIast
} from '../helpers/interactions';

// Assertion helpers
import {
  expectTranslationDisplayed,
  expectErrorMessage,
  expectLoadingIndicator
} from '../helpers/assertions';
```

## Remember

1. **Start simple** - First test can be verbose
2. **Extract aggressively** - 2nd occurrence = helper time
3. **Follow the format** - Given/When/Then comments always
4. **One file per AC** - Matches acceptance criteria structure
5. **Red-Green-Refactor** - TDD cycle for every criterion

## Need More Details?

See full test design document: [test-design.md](./test-design.md)

---

**Pro Tip**: Copy the "Test Structure Template" at the top of this doc for every new test. It ensures you never forget Given/When/Then comments or proper test structure.
