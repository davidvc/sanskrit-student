# High-Level Design: Basic Translation Frontend

## Overview

This feature adds a web-based user interface for Sanskrit translation as the **first screen** in the Universal React Native application. This follows the established frontend architecture documented in `docs/architecture/front-end-architecture.md`, using React Native with Expo Router for cross-platform development.

While the architecture supports web, iOS, and Android, **this initial implementation focuses on the web platform** to deliver immediate value. Mobile platform support is already enabled by the architecture and requires no additional design work.

## Architecture

### System Context

```
┌──────────────────────────────────────┐
│   Platform Layer                     │
│   ┌──────────┬──────────┬──────────┐ │
│   │   Web    │   iOS    │ Android  │ │
│   │ (React   │ (React   │ (React   │ │
│   │  Native  │  Native) │  Native) │ │
│   │   Web)   │          │          │ │
│   └──────────┴──────────┴──────────┘ │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Universal React Native App         │
│   ┌──────────────────────────────┐   │
│   │  Expo Router (file-based)    │   │
│   │  /translate.tsx              │   │
│   └──────────────────────────────┘   │
│   ┌──────────────────────────────┐   │
│   │  Apollo Client (GraphQL)     │   │
│   │  + Auto-generated hooks      │   │
│   └──────────────────────────────┘   │
└──────────────┬───────────────────────┘
               │ GraphQL over HTTP
               ▼
┌──────────────────────────────────────┐
│  GraphQL Yoga Server (Existing)      │
│  ┌──────────────────────────────┐    │
│  │  translateSutra query        │    │
│  └──────────────────────────────┘    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Translation Services (Existing)     │
│  No changes required                 │
└──────────────────────────────────────┘
```

### Design Principles

This design follows **Hexagonal Architecture** and **SOLID principles** as mandated by the project:

- **Single Responsibility**: Each component handles one UI concern
- **Dependency Inversion**: UI depends on GraphQL schema (port), Apollo Client is the adapter
- **Interface Segregation**: Components receive only the props they need
- **Open/Closed**: GraphQL API remains unchanged; frontend extends without modifying backend
- **Liskov Substitution**: React components are composable and substitutable

### Technology Stack (Per Frontend Architecture)

**Frontend Framework**: Universal React Native + Expo
- **React Native**: Cross-platform UI primitives (View, Text, TextInput, Pressable)
- **React Native Web**: Renders React Native components as HTML/CSS in browsers
- **Expo SDK**: Tooling, bundling, development server
- **Expo Router**: File-based routing (`app/translate.tsx`)

**Data Layer**: Apollo Client + GraphQL Code Generator
- **Apollo Client**: GraphQL client with caching and state management
- **GraphQL Code Generator**: Auto-generates TypeScript types and typed hooks from schema
- Type-safe queries with `useTranslateSutraQuery` hook

**Styling**: NativeWind (Tailwind CSS for React Native)
- Utility-first CSS classes that work across web and native
- Responsive design utilities (`sm:`, `md:`, `lg:`)
- Theme support for future dark mode

**Language**: TypeScript (end-to-end type safety)
- GraphQL schema → TypeScript types → React components
- No manual type definitions for GraphQL data

**Server Changes**: None required
- Backend GraphQL server remains unchanged
- Expo dev server serves frontend in development
- Web build outputs static files for production deployment

## Components

### 1. Translation Screen (`app/app/translate.tsx`)

**Responsibilities**:
- Main screen component for text translation feature
- Orchestrates child components
- Manages local UI state (input text, form submission)
- Uses Apollo hook for GraphQL query

**Component Structure**:
```typescript
export default function TranslateScreen() {
  const [inputText, setInputText] = useState('');
  const { data, loading, error } = useTranslateSutraQuery({
    variables: { sutra: inputText },
    skip: !inputText, // Don't query until user submits
  });

  return (
    <View>
      <SutraInput value={inputText} onChange={setInputText} />
      <TranslationResult data={data} loading={loading} error={error} />
    </View>
  );
}
```

**Port (Abstraction)**:
- Depends on `useTranslateSutraQuery` hook (GraphQL abstraction)
- Apollo Client is the adapter implementing the GraphQL port
- Testable with mocked Apollo Client

### 2. Sutra Input Component (`app/components/translation/SutraInput.tsx`)

**Responsibilities**:
- Multi-line text input for Sanskrit text
- Client-side validation (empty input check)
- Submit button with loading/disabled states
- Error message display

**Props Interface**:
```typescript
interface SutraInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}
```

**Key Features**:
- Uses React Native `TextInput` with `multiline` prop
- NativeWind styling for responsive layout
- Accessible labels and hints
- Keyboard-aware behavior (submits on Enter for web)

### 3. Translation Result Component (`app/components/translation/TranslationResult.tsx`)

**Responsibilities**:
- Display translation results or loading/error states
- Container for result sub-components
- Conditional rendering based on state

**Props Interface**:
```typescript
interface TranslationResultProps {
  data?: TranslationResult;
  loading: boolean;
  error?: ApolloError;
}
```

**Sub-components**:
- `OriginalText.tsx` - Displays user's input text
- `IastText.tsx` - Displays IAST transliteration with copy button
- `WordBreakdown.tsx` - Word-by-word analysis
- `AlternativeTranslations.tsx` - Alternative translation options

### 4. Word Breakdown Component (`app/components/translation/WordBreakdown.tsx`)

**Responsibilities**:
- Render list of words with meanings
- Handle multi-meaning words
- Responsive card layout

**Props Interface**:
```typescript
interface WordBreakdownProps {
  words: Array<{
    word: string;
    meanings: string[];
  }>;
}
```

**Design**:
- Each word in a card/section
- Multiple meanings as bulleted list
- Clear visual separation between words

### 5. Copy Button Component (`app/components/ui/CopyButton.tsx`)

**Responsibilities**:
- Copy text to clipboard
- Show confirmation feedback
- Handle clipboard permissions

**Implementation**:
```typescript
// Uses Expo's Clipboard API (works on web and mobile)
import * as Clipboard from 'expo-clipboard';

async function handleCopy(text: string) {
  await Clipboard.setStringAsync(text);
  // Show toast/confirmation
}
```

### 6. GraphQL Configuration (`app/lib/apollo.ts`)

**Responsibilities**:
- Configure Apollo Client instance
- Set GraphQL endpoint
- Configure caching strategy
- Error handling policies

**Implementation**:
```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          translateSutra: {
            keyArgs: ['sutra'], // Cache by input text
          },
        },
      },
    },
  }),
});
```

### 7. Generated GraphQL Hooks (`app/graphql/generated/hooks.ts`)

**Auto-generated by GraphQL Code Generator**:
- `useTranslateSutraQuery` - Typed hook for translation query
- Full TypeScript types for query variables and response
- No manual typing required

**Configuration** (`codegen.yml`):
```yaml
schema: http://localhost:4000/graphql
documents: 'app/graphql/**/*.graphql'
generates:
  app/graphql/generated/:
    preset: client
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

## Data Flow

### Translation Request Flow

```
User types in TextInput
    ↓
Component state updated (setInputText)
    ↓
User presses "Translate" button
    ↓
Client-side validation (empty check)
    ↓ (if valid)
Apollo hook executes query
    ↓
Loading state = true (button disabled, spinner shown)
    ↓
HTTP POST to GraphQL endpoint
    ↓
GraphQL Yoga resolves translateSutra query
    ↓
Translation service processes text
    ↓
Response returns to Apollo Client
    ↓
Apollo cache updated
    ↓
Component re-renders with data
    ↓
TranslationResult displays results
    ↓
Loading state = false (button re-enabled)
```

### GraphQL Query

**Query Definition** (`app/graphql/queries/translateSutra.graphql`):
```graphql
query TranslateSutra($sutra: String!) {
  translateSutra(sutra: $sutra) {
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

**Generated Hook Usage**:
```typescript
// Auto-generated by GraphQL Code Generator
const { data, loading, error } = useTranslateSutraQuery({
  variables: { sutra: inputText },
  skip: !shouldQuery, // Conditional execution
  fetchPolicy: 'cache-first', // Use cached results if available
});

// TypeScript knows exact shape:
// data.translateSutra.originalText: string[]
// data.translateSutra.words: Array<{ word: string; meanings: string[] }>
```

### State Management

**Component-Level State** (React useState):
- Input text value
- Form submission trigger
- UI-only state (expanded/collapsed sections)

**Apollo Client Cache** (Global State):
- GraphQL query results
- Loading and error states
- Normalized data for efficient re-renders
- Automatic cache invalidation

**No Redux/MobX Required**:
- Apollo Client provides sufficient state management
- Component state for local UI concerns
- Keeps architecture simple

## Key Design Decisions

### 1. Universal React Native (Per Architecture Doc)
**Decision**: Use established React Native + Expo architecture

**Rationale**:
- **Consistency**: Follows `docs/architecture/front-end-architecture.md`
- **Mobile-Ready**: Architecture supports iOS/Android when needed
- **Type Safety**: GraphQL Code Generator provides end-to-end types
- **Developer Experience**: Expo dev server with hot reload
- **Future-Proof**: Enables camera OCR feature on mobile later

**Trade-offs**:
- Larger initial setup than vanilla HTML
- Learning curve for React Native primitives
- **Mitigated**: Architecture already defined, just implementing first screen

### 2. Web-First Implementation
**Decision**: Focus on web platform initially, defer mobile builds

**Rationale**:
- **Faster Delivery**: Web build is quickest to deploy
- **No Deployment Complexity**: Static export to Vercel/Netlify
- **Architecture Supports Mobile**: No rework needed later, just build for iOS/Android when ready
- **User Need**: Web interface provides immediate value

**Future Work**:
- Run `npx eas build --platform ios` when mobile needed
- No code changes required for mobile

### 3. Apollo Client for GraphQL
**Decision**: Use Apollo Client with auto-generated hooks (per architecture)

**Rationale**:
- **Defined in Architecture**: Standard for this project
- **Type Safety**: GraphQL Code Generator creates `useTranslateSutraQuery` hook
- **Caching**: Automatic query result caching
- **Error Handling**: Built-in error states
- **Testing**: Easy to mock for acceptance tests

**Alternative Considered**: urql, React Query
- Rejected: Architecture already specifies Apollo Client

### 4. NativeWind for Styling
**Decision**: Use NativeWind (Tailwind CSS for React Native)

**Rationale**:
- **Defined in Architecture**: Standard for this project
- **Responsive Design**: Utility classes for breakpoints (`sm:`, `md:`, `lg:`)
- **Cross-Platform**: Same styles work on web and mobile
- **Developer Productivity**: Rapid styling with utility classes
- **Theme Support**: Future dark mode support

**Alternative Considered**: Plain StyleSheet API
- Allowed as fallback for complex styles
- NativeWind preferred for consistency

### 5. File-Based Routing (Expo Router)
**Decision**: Create `app/app/translate.tsx` for translation screen

**Rationale**:
- **Defined in Architecture**: Expo Router is standard
- **Simple URL**: `/translate` route automatically created
- **Type-Safe Navigation**: TypeScript knows route structure
- **Deep Linking**: URL sharing works automatically on web

### 6. Component-Based Architecture
**Decision**: Break UI into reusable components

**Rationale**:
- **Single Responsibility Principle**: Each component has one job
- **Testability**: Test components in isolation
- **Reusability**: Components can be used in other screens later
- **Maintainability**: Easy to locate and modify specific UI elements

**Component Hierarchy**:
```
TranslateScreen (page)
├── SutraInput (feature component)
│   ├── TextInput (RN primitive)
│   └── Button (UI component)
└── TranslationResult (feature component)
    ├── OriginalText (display component)
    ├── IastText (display component)
    │   └── CopyButton (UI component)
    ├── WordBreakdown (display component)
    └── AlternativeTranslations (display component)
```

### 7. Client-Side Validation
**Decision**: Validate empty input before GraphQL query

**Rationale**:
- **Better UX**: Immediate feedback to user
- **Reduced API Calls**: Don't send invalid requests
- **Apollo Skip**: Use `skip` option to prevent unnecessary queries

**Implementation**:
```typescript
const { data, loading, error } = useTranslateSutraQuery({
  variables: { sutra: inputText },
  skip: !inputText || inputText.trim() === '', // Skip if empty
});
```

## API Contract

### Existing GraphQL API (No Changes)

The frontend consumes the existing `translateSutra` query:

```graphql
type TranslationResult {
  originalText: [String!]!
  iastText: [String!]!
  words: [WordEntry!]!
  alternativeTranslations: [String!]
}

type WordEntry {
  word: String!
  meanings: [String!]!
}
```

**No API changes required** - frontend adapts to existing contract.

## File Structure

```
app/                                    # Universal React Native frontend (NEW)
├── app/                                # Expo Router (file-based routing)
│   ├── _layout.tsx                    # Root layout (navigation structure)
│   ├── index.tsx                      # Home screen (can redirect to translate)
│   └── translate.tsx                  # Translation screen (NEW - main feature)
│
├── components/                        # Reusable UI components (NEW)
│   ├── ui/                           # Generic UI components
│   │   ├── Button.tsx                # Reusable button component
│   │   ├── Card.tsx                  # Card/container component
│   │   └── CopyButton.tsx            # Copy to clipboard button (NEW)
│   │
│   └── translation/                  # Translation feature components (NEW)
│       ├── SutraInput.tsx            # Input field + submit button (NEW)
│       ├── TranslationResult.tsx     # Results container (NEW)
│       ├── OriginalText.tsx          # Display original input (NEW)
│       ├── IastText.tsx              # Display IAST with copy (NEW)
│       ├── WordBreakdown.tsx         # Word-by-word display (NEW)
│       └── AlternativeTranslations.tsx # Alternative translations (NEW)
│
├── graphql/                           # GraphQL operations (NEW)
│   ├── queries/
│   │   └── translateSutra.graphql    # Translation query definition (NEW)
│   └── generated/                    # Auto-generated by codegen
│       ├── graphql.ts                # TypeScript types (AUTO-GENERATED)
│       └── hooks.ts                  # Typed Apollo hooks (AUTO-GENERATED)
│
├── lib/                               # Configuration and utilities (NEW)
│   └── apollo.ts                     # Apollo Client setup (NEW)
│
├── package.json                       # Frontend dependencies (NEW)
├── app.json                          # Expo configuration (NEW)
├── metro.config.js                   # Metro bundler config (NEW)
├── tailwind.config.js                # NativeWind/Tailwind config (NEW)
├── tsconfig.json                     # TypeScript config (NEW)
└── codegen.yml                       # GraphQL Code Generator config (NEW)

backend/                               # Backend moved to subdirectory (RENAMED)
├── src/                              # Existing backend code (NO CHANGES)
│   ├── domain/
│   ├── adapters/
│   └── server.ts
├── package.json
└── tsconfig.json

tests/                                 # Test files (NEW)
└── app/
    └── translate.test.tsx            # Translation screen acceptance tests (NEW)
```

**Key Changes**:
1. **Backend moved to `backend/`**: Separates frontend and backend code
2. **New `app/` directory**: Universal React Native application
3. **No changes to backend code**: GraphQL server remains unchanged

## Risks and Mitigations

### Risk 1: GraphQL Server Not Running
**Impact**: Frontend cannot connect to backend
**Mitigation**:
- Apollo Client error handling displays clear message
- Environment variable for GraphQL endpoint (easy to configure)
- Development: Ensure `npm run dev` starts backend before frontend
- Error message: "Cannot connect to translation service. Ensure backend is running."

### Risk 2: Network Errors
**Impact**: Failed translations, poor UX
**Mitigation**:
- Apollo Client retry policies (exponential backoff)
- Error state displays user-friendly message
- "Try Again" button to manually retry
- Loading state prevents multiple simultaneous requests

**Apollo Configuration**:
```typescript
const link = new HttpLink({
  uri: graphqlEndpoint,
  fetchOptions: {
    timeout: 30000, // 30 second timeout
  },
});
```

### Risk 3: Large Text Input
**Impact**: Slow response times, potential timeout
**Mitigation**:
- Client-side warning (not restriction) for very long text
- Loading indicator keeps user informed
- Server timeout handling with clear error
- Future: Implement pagination for very long sutras

### Risk 4: React Native Web Compatibility
**Impact**: UI issues on web platform
**Mitigation**:
- React Native Web is mature and well-tested
- Use standard RN primitives (View, Text, TextInput, Pressable)
- Test on multiple browsers (Chrome, Firefox, Safari)
- Expo handles web polyfills automatically

### Risk 5: Accessibility
**Impact**: Screen readers and keyboard navigation don't work
**Mitigation**:
- Use React Native accessibility props (`accessibilityLabel`, `accessibilityHint`)
- Test with screen readers (VoiceOver on Mac, NVDA on Windows)
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Semantic roles for components

**Example**:
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Translate Sanskrit text"
  accessibilityHint="Sends your text to the translation service"
>
  <Text>Translate</Text>
</Pressable>
```

### Risk 6: Initial Setup Complexity
**Impact**: Time to set up Expo project, dependencies, configs
**Mitigation**:
- Use `npx create-expo-app` for quick scaffolding
- Follow exact structure from architecture doc
- Copy configuration from similar Expo + Apollo projects
- First TDD cycle includes setup verification

### Risk 7: Type Generation Fails
**Impact**: GraphQL Code Generator doesn't produce types
**Mitigation**:
- Ensure backend GraphQL server is running during codegen
- Verify `codegen.yml` schema URL is correct
- Run `npm run codegen` before tests
- Add codegen to pre-test script

**Pre-test Hook** (`package.json`):
```json
{
  "scripts": {
    "pretest": "npm run codegen",
    "codegen": "graphql-codegen --config codegen.yml",
    "test": "vitest run"
  }
}
```

## Dependencies

### New Production Dependencies (Frontend App)

**Core Framework**:
```json
{
  "expo": "^50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "react-native-web": "~0.19.0",
  "expo-router": "^3.0.0"
}
```

**GraphQL & Data**:
```json
{
  "@apollo/client": "^3.8.0",
  "graphql": "^16.8.0"
}
```

**Styling**:
```json
{
  "nativewind": "^4.0.0",
  "tailwindcss": "^3.3.0"
}
```

**Utilities**:
```json
{
  "expo-clipboard": "~5.0.0"
}
```

### New Development Dependencies

**TypeScript & Types**:
```json
{
  "@types/react": "~18.2.0",
  "@types/react-native": "~0.73.0",
  "typescript": "^5.3.0"
}
```

**GraphQL Code Generation**:
```json
{
  "@graphql-codegen/cli": "^5.0.0",
  "@graphql-codegen/client-preset": "^4.1.0",
  "@graphql-codegen/typescript": "^4.0.0",
  "@graphql-codegen/typescript-operations": "^4.0.0",
  "@graphql-codegen/typescript-react-apollo": "^4.1.0"
}
```

**Testing**:
```json
{
  "@testing-library/react-native": "^12.4.0",
  "vitest": "^1.0.0",
  "jsdom": "^23.0.0"
}
```

**Build Tools**:
```json
{
  "@expo/metro-config": "~0.17.0",
  "metro": "~0.80.0"
}
```

### Backend Dependencies
**No changes** - existing backend dependencies remain unchanged

## Implementation Plan (TDD Cycles)

This implementation follows **RED-GREEN-REFACTOR** TDD methodology with **acceptance tests only** (per AGENTS.md).

### Phase 0: Project Setup and Infrastructure
**Prerequisite**: Set up Expo app before any TDD cycles

**Test**: `tests/app/setup.test.tsx`
```typescript
test('Expo app renders without crashing', () => {
  // RED: Test fails - no app exists
  // GREEN: Run `npx create-expo-app app --template blank-typescript`
  // REFACTOR: Configure Expo Router, Metro, NativeWind
});

test('Apollo Client connects to GraphQL server', async () => {
  // RED: Test fails - Apollo not configured
  // GREEN: Set up Apollo Client in app/lib/apollo.ts
  // REFACTOR: Add error handling, configure cache
});

test('GraphQL Code Generator produces types', () => {
  // RED: Test fails - no generated types
  // GREEN: Configure codegen.yml, run npm run codegen
  // REFACTOR: Add to pre-test script
});
```

**Implementation Steps**:
1. RED: Write tests expecting basic app structure
2. GREEN:
   - Run `npx create-expo-app app --template blank-typescript`
   - Install dependencies (Apollo, NativeWind, Expo Router)
   - Configure `app.json`, `metro.config.js`, `tailwind.config.js`
   - Set up Apollo Client
   - Configure GraphQL Code Generator
3. REFACTOR: Verify all configs, clean up default files

---

### Phase 1: Empty Input Validation (AC: Empty input validation)
**Acceptance Criterion**: Scenario "Empty input validation"

**Test**: `tests/app/translate-validation.test.tsx`
```typescript
test('shows error when translate clicked with empty input', () => {
  // RED: Test fails - no translate screen exists
  // GREEN: Create minimal translate screen with validation
  // REFACTOR: Extract validation logic to SutraInput component
});

test('does not send API request when input is empty', () => {
  // RED: Test fails - API called with empty input
  // GREEN: Use Apollo skip option when input empty
  // REFACTOR: Centralize skip logic
});
```

**Implementation**:
1. RED: Render TranslateScreen, expect error message when submitting empty
2. GREEN: Create `app/app/translate.tsx` with validation
3. REFACTOR: Extract `SutraInput.tsx` component

---

### Phase 2: Loading State (AC: Loading state during translation)
**Acceptance Criterion**: Scenario "Loading state during translation"

**Test**: `tests/app/translate-loading.test.tsx`
```typescript
test('shows loading indicator and disables button during translation', async () => {
  // RED: Test fails - no loading state shown
  // GREEN: Use Apollo loading state to show spinner, disable button
  // REFACTOR: Extract loading indicator to reusable component
});
```

**Implementation**:
1. RED: Submit translation, expect button disabled and spinner visible
2. GREEN: Use `loading` from `useTranslateSutraQuery`, conditionally render
3. REFACTOR: Create `LoadingSpinner.tsx` component

---

### Phase 3: Successful IAST Translation (AC: Successful translation of IAST text)
**Acceptance Criterion**: Scenario "Successful translation of IAST text"

**Test**: `tests/app/translate-iast.test.tsx`
```typescript
test('displays translation results for IAST input', async () => {
  // RED: Test fails - no results display
  // GREEN: Create TranslationResult component, render data
  // REFACTOR: Extract sub-components (OriginalText, IastText, etc.)
});

test('shows original text, IAST, word breakdown, and alternatives', async () => {
  // RED: Test fails - incomplete rendering
  // GREEN: Add all result sections
  // REFACTOR: Create WordBreakdown and AlternativeTranslations components
});
```

**Implementation**:
1. RED: Mock Apollo query, expect result sections visible
2. GREEN: Create `TranslationResult.tsx`, render all fields
3. REFACTOR: Extract `OriginalText.tsx`, `IastText.tsx`, `WordBreakdown.tsx`, `AlternativeTranslations.tsx`

---

### Phase 4: Devanagari Translation (AC: Successful translation of Devanagari text)
**Acceptance Criterion**: Scenario "Successful translation of Devanagari text"

**Test**: `tests/app/translate-devanagari.test.tsx`
```typescript
test('displays translation results for Devanagari input', async () => {
  // RED: Test may pass if Unicode handled correctly
  // GREEN: Verify TextInput preserves Unicode
  // REFACTOR: Add Devanagari font support if needed
});
```

**Implementation**:
1. RED: Test with Devanagari input "अथ योगानुशासनम्"
2. GREEN: Ensure TextInput `multiline` prop preserves Unicode
3. REFACTOR: Load Devanagari font via `expo-font` if needed

---

### Phase 5: Error Handling (AC: Server error handling)
**Acceptance Criterion**: Scenario "Server error handling"

**Test**: `tests/app/translate-error.test.tsx`
```typescript
test('shows error message when server returns error', async () => {
  // RED: Test fails - error crashes app
  // GREEN: Use Apollo error state to display message
  // REFACTOR: Create ErrorMessage component
});

test('allows retry after error', async () => {
  // RED: Test fails - button stays disabled
  // GREEN: Re-enable button when error shown
  // REFACTOR: Add explicit "Retry" button
});
```

**Implementation**:
1. RED: Mock Apollo error, expect error message displayed
2. GREEN: Conditionally render error from `useTranslateSutraQuery`
3. REFACTOR: Create `ErrorMessage.tsx` with retry button

---

### Phase 6: Multi-Line Support (AC: Multi-line text support)
**Acceptance Criterion**: Scenario "Multi-line text support"

**Test**: `tests/app/translate-multiline.test.tsx`
```typescript
test('handles multi-line input correctly', async () => {
  // RED: Test may pass (TextInput multiline already set)
  // GREEN: Verify newlines preserved in GraphQL variables
  // REFACTOR: Style multi-line results display
});

test('displays each line with separate word breakdown', async () => {
  // RED: Test fails - lines not visually separated
  // GREEN: Map over arrays in results, add separators
  // REFACTOR: Extract line rendering logic
});
```

**Implementation**:
1. RED: Test with "line1\nline2", expect both lines visible
2. GREEN: Ensure `originalText` and `iastText` arrays rendered separately
3. REFACTOR: Add visual separators between lines in `TranslationResult.tsx`

---

### Phase 7: Clear Previous Results (AC: Clear previous results)
**Acceptance Criterion**: Scenario "Clear previous results"

**Test**: `tests/app/translate-clear.test.tsx`
```typescript
test('clears previous results when new translation starts', async () => {
  // RED: Test fails - old results still visible during loading
  // GREEN: Conditionally hide results when loading new query
  // REFACTOR: Centralize result display logic
});
```

**Implementation**:
1. RED: Do two translations in sequence, check first not visible during second
2. GREEN: Hide `TranslationResult` when `loading` is true
3. REFACTOR: Add smooth transition animation (optional)

---

### Phase 8: Copy Functionality (AC: Copy translation results)
**Acceptance Criterion**: Scenario "Copy translation results"

**Test**: `tests/app/translate-copy.test.tsx`
```typescript
test('copies IAST text to clipboard when copy button clicked', async () => {
  // RED: Test fails - no copy button
  // GREEN: Add CopyButton using expo-clipboard
  // REFACTOR: Extract CopyButton to reusable component
});

test('shows confirmation message after copy', async () => {
  // RED: Test fails - no feedback
  // GREEN: Show toast/alert after successful copy
  // REFACTOR: Create Toast component or use library
});
```

**Implementation**:
1. RED: Expect copy button, click it, verify clipboard contains IAST
2. GREEN: Create `CopyButton.tsx` using `expo-clipboard`
3. REFACTOR: Add confirmation feedback (toast or inline message)

---

### Phase 9: Alternative Translations Display (AC: Alternative translation display)
**Acceptance Criterion**: Scenario "Alternative translation display"

**Test**: `tests/app/translate-alternatives.test.tsx`
```typescript
test('displays up to 3 alternative translations', async () => {
  // RED: Test fails - alternatives section missing
  // GREEN: Add alternatives rendering in AlternativeTranslations.tsx
  // REFACTOR: Handle missing alternatives gracefully
});

test('alternatives are clearly separated and readable', async () => {
  // RED: Test fails - poor formatting
  // GREEN: Style alternatives with NativeWind
  // REFACTOR: Add numbering (1, 2, 3)
});
```

**Implementation**:
1. RED: Mock query with 3 alternatives, expect all visible
2. GREEN: Map over `alternativeTranslations` array, render each
3. REFACTOR: Add styling, handle null/empty array

---

### Phase 10: Responsive Layout (AC: Responsive layout)
**Acceptance Criterion**: Scenario "Responsive layout"

**Test**: `tests/app/translate-responsive.test.tsx`
```typescript
test('layout adapts to mobile viewport', () => {
  // RED: Test fails - layout not responsive
  // GREEN: Use NativeWind responsive utilities (sm:, md:, lg:)
  // REFACTOR: Test on multiple viewport sizes
});

test('all controls accessible and readable', () => {
  // RED: Test fails - elements overlap or too small
  // GREEN: Add proper spacing, font sizes
  // REFACTOR: Use accessibility props
});
```

**Implementation**:
1. RED: Render on small viewport, expect elements readable
2. GREEN: Apply NativeWind classes like `w-full`, `p-4`, `text-lg`
3. REFACTOR: Test on tablet/desktop viewports

---

## TDD Summary

**Total Phases**: 11 (setup + 10 acceptance criteria)
**TDD Cycle per Phase**: RED → GREEN → REFACTOR

### Test Coverage Mapping

| Phase | Acceptance Criterion | Test File | Components Created |
|-------|---------------------|-----------|-------------------|
| 0 | Infrastructure setup | `setup.test.tsx` | Expo app, Apollo, codegen |
| 1 | Empty input validation | `translate-validation.test.tsx` | `translate.tsx`, `SutraInput.tsx` |
| 2 | Loading state | `translate-loading.test.tsx` | `LoadingSpinner.tsx` |
| 3 | IAST translation | `translate-iast.test.tsx` | `TranslationResult.tsx`, `OriginalText.tsx`, `IastText.tsx`, `WordBreakdown.tsx`, `AlternativeTranslations.tsx` |
| 4 | Devanagari translation | `translate-devanagari.test.tsx` | (Verifies Unicode support) |
| 5 | Server error handling | `translate-error.test.tsx` | `ErrorMessage.tsx` |
| 6 | Multi-line support | `translate-multiline.test.tsx` | (Enhances existing components) |
| 7 | Clear previous results | `translate-clear.test.tsx` | (Enhances TranslationResult) |
| 8 | Copy functionality | `translate-copy.test.tsx` | `CopyButton.tsx` |
| 9 | Alternative translations | `translate-alternatives.test.tsx` | (Enhances AlternativeTranslations) |
| 10 | Responsive layout | `translate-responsive.test.tsx` | (Applies NativeWind styling) |

**Total TDD Cycles**: 11 phases × 3 steps (RED-GREEN-REFACTOR) = 33 steps

### Testing Strategy (Per AGENTS.md)

**Acceptance Tests Only**:
- Test at the public contract level (React component rendering and user interactions)
- Use `@testing-library/react-native` for component testing
- Mock Apollo Client responses with `MockedProvider`
- Test in complete isolation (no real backend calls)
- Focus on behavior, not implementation details

**Example Test Structure**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import TranslateScreen from '@/app/translate';
import { TranslateSutraDocument } from '@/graphql/generated/graphql';

test('displays translation results for IAST input', async () => {
  const mocks = [{
    request: {
      query: TranslateSutraDocument,
      variables: { sutra: 'atha yoganusasanam' },
    },
    result: {
      data: {
        translateSutra: {
          originalText: ['atha yoganusasanam'],
          iastText: ['atha yogānuśāsanam'],
          words: [{ word: 'atha', meanings: ['now', 'here begins'] }],
          alternativeTranslations: ['Now begins the practice of yoga'],
        },
      },
    },
  }];

  render(
    <MockedProvider mocks={mocks}>
      <TranslateScreen />
    </MockedProvider>
  );

  const input = screen.getByPlaceholderText('Enter Sanskrit text');
  fireEvent.changeText(input, 'atha yoganusasanam');

  const button = screen.getByText('Translate');
  fireEvent.press(button);

  await waitFor(() => {
    expect(screen.getByText('atha yogānuśāsanam')).toBeTruthy();
    expect(screen.getByText('atha')).toBeTruthy();
    expect(screen.getByText('now')).toBeTruthy();
  });
});
```

**No Unit Tests** unless explicitly requested.

**No End-to-End Tests** unless explicitly requested.

## Success Criteria

The implementation is complete when:

1. ✅ All 11 acceptance test phases pass (setup + 10 acceptance criteria)
2. ✅ Frontend loads in web browser via Expo dev server (`npx expo start`, press 'w')
3. ✅ All scenarios from acceptance criteria work manually in browser
4. ✅ Responsive design tested on mobile viewport (browser dev tools)
5. ✅ Accessibility validated:
   - Keyboard navigation works (Tab, Enter, Escape)
   - Screen reader announces elements correctly
   - `accessibilityLabel` and `accessibilityRole` props set
6. ✅ Code follows SOLID principles and Hexagonal Architecture:
   - Apollo Client = adapter for GraphQL port
   - Components follow Single Responsibility
   - No business logic in UI components
7. ✅ GraphQL Code Generator successfully produces types
8. ✅ Web build completes successfully (`npx expo export:web`)

## Future Enhancements (Out of Scope)

**Immediate Next Steps** (already supported by architecture):
- iOS build: `npx eas build --platform ios` (no code changes)
- Android build: `npx eas build --platform android` (no code changes)

**Future Features**:
- Real-time translation as user types (debounced query)
- Translation history (AsyncStorage/localStorage)
- Bookmarking favorite translations
- Dark mode toggle (NativeWind theming)
- Export translations to PDF/text file
- Voice input for Sanskrit text
- Offline support (Apollo cache persistence)
- Progressive Web App (service worker)
- Camera OCR integration (already planned in architecture)

## Development Workflow

### Initial Setup
```bash
# 1. Create Expo app (Phase 0 - GREEN step)
npx create-expo-app app --template blank-typescript

# 2. Install dependencies
cd app
npm install @apollo/client graphql expo-router nativewind tailwindcss
npm install --save-dev @graphql-codegen/cli @graphql-codegen/client-preset

# 3. Configure GraphQL Code Generator
npm run codegen

# 4. Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd app && npx expo start
# Press 'w' to open in browser
```

### TDD Workflow
```bash
# 1. Write failing test (RED)
npm test translate-validation.test.tsx

# 2. Implement minimal code (GREEN)
# Edit app/app/translate.tsx

# 3. Refactor (REFACTOR)
# Extract components, clean up

# 4. Run tests again (should pass)
npm test

# 5. Repeat for next acceptance criterion
```

### GraphQL Type Generation
```bash
# Run whenever GraphQL schema changes
npm run codegen

# Generates:
# - app/graphql/generated/graphql.ts (types)
# - app/graphql/generated/hooks.ts (useTranslateSutraQuery)
```

### Web Build (Production)
```bash
# Export static web build
npx expo export:web

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=web-build
```

## Related Documentation

- [Frontend Architecture](../../architecture/front-end-architecture.md) - Universal React Native architecture
- [Acceptance Criteria](./acceptance-criteria.md) - Detailed scenarios and requirements
- [Expo Documentation](https://docs.expo.dev/) - Expo SDK and CLI
- [Apollo Client Testing](https://www.apollographql.com/docs/react/development-testing/testing/) - MockedProvider guide
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) - Component testing
