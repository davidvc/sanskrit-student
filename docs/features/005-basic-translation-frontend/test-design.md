# Test Design: Basic Translation Frontend

**This feature uses the standard frontend test design.**

See: [docs/architecture/front-end-test-design.md](../../architecture/front-end-test-design.md)

For AI agents: [docs/architecture/front-end-test-design-for-ai.md](../../architecture/front-end-test-design-for-ai.md)

## Feature-Specific Test Organization

**Acceptance Criteria**: [acceptance-criteria.md](./acceptance-criteria.md)

**Test Files**: `tests/app/translate/`

```
tests/app/translate/
├── validation.test.tsx            # AC: Empty input validation
├── loading.test.tsx               # AC: Loading state during translation
├── iast-translation.test.tsx      # AC: Successful translation of IAST text
├── devanagari-translation.test.tsx # AC: Successful translation of Devanagari text
├── error-handling.test.tsx        # AC: Server error handling
├── multiline.test.tsx             # AC: Multi-line text support
├── clear-results.test.tsx         # AC: Clear previous results
├── copy.test.tsx                  # AC: Copy translation results
├── alternatives.test.tsx          # AC: Alternative translation display
└── responsive.test.tsx            # AC: Responsive layout
```

## Test Coverage Mapping

| Acceptance Criterion | Test File | Mock Strategy |
|---------------------|-----------|---------------|
| Empty input validation | `validation.test.tsx` | No mock needed (client-side) |
| Loading state | `loading.test.tsx` | Use `delay` in mock |
| IAST translation | `iast-translation.test.tsx` | Success mock |
| Devanagari translation | `devanagari-translation.test.tsx` | Success mock (Devanagari input) |
| Server error | `error-handling.test.tsx` | Error mock |
| Multi-line support | `multiline.test.tsx` | Success mock (multi-line arrays) |
| Clear previous results | `clear-results.test.tsx` | Two sequential mocks |
| Copy functionality | `copy.test.tsx` | Success mock + clipboard spy |
| Alternative translations | `alternatives.test.tsx` | Success mock (with alternatives) |
| Responsive layout | `responsive.test.tsx` | No mock needed (static rendering) |

## Implementation Phases (TDD)

Follow the standard TDD workflow from the architecture doc:

1. **Phase 0**: Set up Expo app, Apollo Client, GraphQL codegen
2. **Phase 1-10**: Implement each acceptance criterion via RED-GREEN-REFACTOR
3. Each phase:
   - RED: Write failing test with Given/When/Then comments
   - GREEN: Write minimal code to make test pass
   - REFACTOR: Extract repeated code to helpers in `tests/app/helpers/`

## Next Steps

After test design approval (ss-mol-coh.2), proceed to TDD implementation (ss-mol-8z2).
