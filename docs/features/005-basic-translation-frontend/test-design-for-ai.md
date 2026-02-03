# Test Design for AI: Basic Translation Frontend

**For implementation, use the architecture-level guide:**

→ [docs/architecture/front-end-test-design-for-ai.md](../../architecture/front-end-test-design-for-ai.md)

## Feature-Specific Quick Reference

**Acceptance Criteria**: [acceptance-criteria.md](./acceptance-criteria.md)

**Test Directory**: `tests/app/translate/`

**Helper Directory**: `tests/app/helpers/`

## Acceptance Criteria → Test File Mapping

| Scenario | Test File | Key Helpers |
|----------|-----------|-------------|
| Successful translation of IAST text | `iast-translation.test.tsx` | `createSuccessfulTranslationMock`, `translateText`, `expectTranslationDisplayed` |
| Successful translation of Devanagari text | `devanagari-translation.test.tsx` | Same as IAST |
| Empty input validation | `validation.test.tsx` | `clickTranslate`, `expectErrorMessage` |
| Loading state during translation | `loading.test.tsx` | `createLoadingMock`, `expectLoadingIndicator` |
| Server error handling | `error-handling.test.tsx` | `createErrorMock`, `expectErrorMessage` |
| Multi-line text support | `multiline.test.tsx` | `createSuccessfulTranslationMock` (with arrays) |
| Clear previous results | `clear-results.test.tsx` | Two sequential `translateText` calls |
| Copy translation results | `copy.test.tsx` | `clickCopyIast`, clipboard mock |
| Alternative translation display | `alternatives.test.tsx` | `expectTranslationDisplayed({ alternatives })` |
| Responsive layout | `responsive.test.tsx` | Static rendering checks |

## TDD Workflow Checklist

For each test file:

- [ ] Create test file in `tests/app/translate/`
- [ ] Copy scenario from `acceptance-criteria.md` as comments
- [ ] Write test with Given/When/Then structure
- [ ] Run test - verify it fails (RED)
- [ ] Implement minimal code to pass
- [ ] Run test - verify it passes (GREEN)
- [ ] Extract any repeated code to `tests/app/helpers/`
- [ ] Run test - verify still passes (REFACTOR)
- [ ] Move to next scenario

## Standard Imports

```typescript
import { describe, it } from 'vitest';
import { waitFor } from '@testing-library/react-native';
import { renderTranslateScreen } from '../helpers/render-utils';
import {
  createSuccessfulTranslationMock,
  createErrorMock,
  createStandardSutraResult
} from '../helpers/apollo-mocks';
import { translateText, clickTranslate } from '../helpers/interactions';
import { expectTranslationDisplayed, expectErrorMessage } from '../helpers/assertions';
```

## Template

```typescript
describe('Scenario: <copy from acceptance-criteria.md>', () => {
  it('<user action and expectation>', async () => {
    // GIVEN: <copy from AC>
    const mock = createSuccessfulTranslationMock('input', result);
    renderTranslateScreen([mock]);

    // WHEN: <copy from AC>
    translateText('input');

    // THEN: <copy from AC>
    await expectTranslationDisplayed({ /* expected */ });
  });
});
```
