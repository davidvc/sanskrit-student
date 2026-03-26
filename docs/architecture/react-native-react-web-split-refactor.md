# Design Spec: Split into Separate Web and Native Apps

## Status

Proposed

## Problem Statement

Sanskrit Student currently uses a **Universal React Native** architecture (ADR-0002): a single Expo codebase targeting web, iOS, and Android via React Native Web. In practice, the "single codebase for all platforms" promise has not held up:

1. **Whack-a-mole native module stubbing.** The web build uses Hermes transforms (hardcoded by Expo CLI), which pull in React Native internals (`TurboModuleRegistry`, `BatchedBridge`, `ErrorUtils`, etc.) that don't exist in browsers. We've fixed this **9+ times** across 9 commits, each adding another entry to a growing blocklist in `metro.config.js` (now 123+ lines of defensive resolver logic). The proposed registry-based filter (see `native-module-web-stubbing.md`) would make the whack-a-mole more organized, but it doesn't eliminate the fundamental problem: **we're fighting the bundler to make native code not run on the web.**

2. **Web experience is constrained by React Native primitives.** We use `<View>`, `<Text>`, `<Pressable>` instead of semantic HTML (`<main>`, `<section>`, `<button>`, `<input>`). NativeWind gives us Tailwind-like syntax but compiles to React Native's style system, not real CSS. We can't use standard web libraries, CSS animations, or browser APIs without platform-specific escape hatches.

3. **Native experience is constrained by web compatibility concerns.** Every native feature (camera, haptics, gestures, offline storage) requires a `.web.tsx` fallback or conditional platform check. The camera screen already has separate `camera.tsx` and `camera.web.tsx` files — the "shared code" is less shared than it appears.

4. **Deployment complexity.** The Vercel build command chains together backend compilation, app dependency installation, GraphQL codegen, and Expo web export in a single pipeline. Web-specific concerns (SSR, SEO, routing) and native-specific concerns (EAS Build, app stores) are entangled.

5. **Industry consensus.** The more common and battle-tested approach for cross-platform products is: **React/Next.js for web, React Native/Expo for native, with a shared package for business logic and types.** This is the pattern used by Discord, Shopify, and others at scale.

### What ADR-0002 Got Right

The original decision correctly identified:
- The need for cross-platform reach (web + iOS + Android)
- GraphQL as the shared API layer
- TypeScript end-to-end for type safety
- Expo as the best React Native toolchain

These remain valid. The change is in **how** we achieve cross-platform — not a single codebase, but a monorepo with shared packages.

## Proposed Architecture

### High-Level Structure

```
sanskrit-student/
├── packages/
│   ├── shared/                  # Shared business logic, types, GraphQL
│   │   ├── src/
│   │   │   ├── graphql/         # Schema, operations, codegen output
│   │   │   ├── types/           # Domain types (TranslationResult, WordEntry, etc.)
│   │   │   ├── hooks/           # Platform-agnostic data hooks (Apollo)
│   │   │   └── utils/           # Shared utilities (text formatting, etc.)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                     # React/Next.js web application
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages
│   │   │   ├── components/      # Web-specific React components
│   │   │   └── lib/             # Web-specific utilities
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   └── native/                  # React Native/Expo mobile application
│       ├── app/                 # Expo Router screens
│       ├── components/          # Native-specific components
│       ├── package.json
│       ├── app.json
│       └── tsconfig.json
│
├── src/                         # Backend (unchanged)
│   ├── domain/
│   └── adapters/
│
├── api/                         # Vercel serverless functions (unchanged)
├── tests/                       # Backend tests (unchanged)
├── docs/
├── package.json                 # Root workspace config
└── turbo.json                   # (optional) Turborepo build orchestration
```

### Monorepo Tooling

Use **npm workspaces** (already familiar, no new tooling) to manage the three packages. Optionally add **Turborepo** for build caching and task orchestration.

```jsonc
// root package.json
{
  "workspaces": [
    "packages/shared",
    "packages/web",
    "packages/native"
  ]
}
```

### Package Details

#### `packages/shared` — Shared Logic

**What moves here:**
- GraphQL schema (`schema.graphql`)
- GraphQL operations (queries, mutations)
- GraphQL Code Generator config and output
- Domain types mirroring the backend (`TranslationResult`, `WordEntry`, `OcrTranslationResult`)
- Apollo Client hooks (`useTranslateSutraQuery`, etc.) — these are platform-agnostic
- Text formatting utilities (IAST display helpers, etc.)

**What does NOT go here:**
- UI components (even "shared" ones — React and React Native have different component primitives)
- Apollo Client *configuration* (the client setup differs: Next.js uses SSR-aware configuration, Expo uses a simpler HTTP link)
- Styling of any kind

**Key design principle:** The shared package exports **data and types**, not UI. Keeping UI out of shared avoids the abstraction trap where you build a cross-platform component library that satisfies neither platform well.

```typescript
// packages/shared/src/hooks/useTranslateSutra.ts
import { useQuery } from '@apollo/client';
import { TranslateSutraDocument, TranslateSutraQuery } from '../graphql/generated';

export function useTranslateSutra(sutra: string) {
  return useQuery<TranslateSutraQuery>(TranslateSutraDocument, {
    variables: { sutra },
    skip: !sutra,
  });
}
```

#### `packages/web` — Next.js Web App

**Framework:** Next.js 14+ with App Router

**Why Next.js:**
- Server-side rendering and static generation for fast loads
- Semantic HTML — proper `<form>`, `<input>`, `<button>`, `<main>` elements
- Standard CSS/Tailwind (real CSS, not NativeWind compilation)
- File upload via standard `<input type="file">` — no camera stubs needed
- Built-in image optimization, font loading, metadata API
- Vercel-native deployment (already our host)
- SEO capability if we want public translation pages in the future

**What it contains:**
- Next.js pages and layouts (App Router)
- Web-optimized React components using standard HTML elements
- Tailwind CSS for styling (real Tailwind, not NativeWind)
- Web-specific features: file upload for OCR, keyboard shortcuts, responsive layouts
- Apollo Client configured for Next.js (SSR-compatible)

**What it imports from shared:**
- GraphQL hooks and types
- Domain types
- Text utilities

```tsx
// packages/web/src/app/translate/page.tsx
import { useTranslateSutra } from '@sanskrit-student/shared/hooks';
import { SutraInput } from '@/components/SutraInput';
import { TranslationResult } from '@/components/TranslationResult';

export default function TranslatePage() {
  // Standard React + Next.js — no React Native primitives
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Translate Sanskrit</h1>
      <SutraInput />
      <TranslationResult />
    </main>
  );
}
```

#### `packages/native` — Expo Mobile App

**Framework:** Expo SDK (latest) with Expo Router

**What stays the same:**
- Expo Router for file-based navigation
- React Native components (`<View>`, `<Text>`, `<Pressable>`)
- NativeWind for styling
- Camera integration via `expo-camera` (no web fallback needed!)
- Apollo Client for GraphQL

**What changes:**
- **No web target.** This app only builds for iOS and Android.
- **No metro.config.js stubbing.** The entire `native-web-filter` problem disappears because we never bundle for web.
- **No `*.web.tsx` files.** `camera.web.tsx` is deleted — camera is native-only.
- **Native-first features:** Haptics, gesture handlers, native animations can be used freely without worrying about web compatibility.

**What it imports from shared:**
- GraphQL hooks and types
- Domain types
- Text utilities

### What Gets Deleted

| Current File/Directory | Reason for Removal |
|---|---|
| `app/metro.config.js` (123-line resolver) | No web target in native app; standard Metro config suffices |
| `app/shims/web-globals.js` | Hermes web polyfills no longer needed |
| `app/stubs/TurboModuleRegistry.js` | Native module stub no longer needed |
| `app/app/camera.web.tsx` | Web has its own file upload component |
| `docs/architecture/native-module-web-stubbing.md` | Problem no longer exists |
| NativeWind in web app | Web uses real Tailwind CSS |

### Backend — No Changes

The backend (`src/`, `api/`, `tests/`) is unchanged. It serves the same GraphQL API to both clients. The hexagonal architecture already cleanly separates the API from any client concerns.

## Deployment

### Web (Vercel)

Vercel deploys the Next.js web app natively — this is Vercel's primary use case, so the deployment becomes simpler:

```jsonc
// vercel.json
{
  "buildCommand": "npm run build -w packages/shared && npm run build -w packages/web && npm run build -w src",
  "outputDirectory": "packages/web/.next",
  "framework": "nextjs",
  "rewrites": [
    { "source": "/graphql", "destination": "/api/graphql" }
  ]
}
```

The current build command (`npm run build && cd app && npm install && npm run codegen && npx expo export -p web`) becomes a standard Next.js build. No more `expo export -p web`.

### Native (EAS Build)

Expo Application Services (EAS) handles native builds:

```bash
# From packages/native/
eas build --platform ios
eas build --platform android
```

Native builds are completely decoupled from the web deployment pipeline.

### GraphQL Codegen

Runs once in `packages/shared`, output is consumed by both `packages/web` and `packages/native`:

```yaml
# packages/shared/codegen.yml
schema: "../../src/schema.graphql"  # or fetched from running server
documents: "src/graphql/operations/**/*.graphql"
generates:
  src/graphql/generated.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

## Migration Plan

### Phase 0: Preparation

1. Create a new ADR (`0004-split-web-native.md`) documenting this decision, superseding ADR-0002
2. Set up npm workspaces in root `package.json`
3. Create `packages/shared/` with types and GraphQL codegen

### Phase 1: Extract Shared Package

1. Move GraphQL schema, operations, and codegen config to `packages/shared/`
2. Move domain types (`TranslationResult`, `WordEntry`, etc.) to `packages/shared/`
3. Move platform-agnostic Apollo hooks to `packages/shared/`
4. Verify the existing `app/` still works by importing from `packages/shared/`

### Phase 2: Build Web App (Next.js)

1. Initialize `packages/web/` with Next.js
2. Recreate screens as Next.js pages:
   - Home (`/`) — from `app/app/index.tsx`
   - Translate (`/translate`) — from `app/app/translate.tsx`
   - History (`/history`) — from `app/app/history.tsx`
   - OCR Upload (`/upload`) — new, replaces `camera.web.tsx` with standard file upload
3. Rebuild components using semantic HTML + Tailwind:
   - `SutraInput` — `<form>` with `<input>` or `<textarea>`
   - `TranslationResult` — semantic HTML with proper headings
   - `WordBreakdown` — `<table>` or `<dl>` for word entries
   - `AlternativeTranslations` — collapsible `<details>` or dropdown
   - `CopyButton` — standard `navigator.clipboard` API
4. Configure Apollo Client for Next.js (SSR-compatible)
5. Set up Tailwind CSS (real Tailwind, not NativeWind)
6. Deploy to Vercel, verify full functionality

### Phase 3: Migrate Native App

1. Move `app/` to `packages/native/`
2. Remove all web-specific code:
   - Delete `camera.web.tsx`
   - Delete `shims/`, `stubs/`
   - Simplify `metro.config.js` to default Expo config
3. Update imports to use `packages/shared/`
4. Remove `react-native-web` dependency
5. Verify iOS and Android builds via EAS

### Phase 4: Cleanup

1. Remove old `app/` directory
2. Update Vercel deployment config
3. Update documentation (architecture docs, ADRs)
4. Archive `native-module-web-stubbing.md` — problem is eliminated

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Duplicated UI logic between web and native | Medium | Medium | Accept it. Web and native UIs *should* differ — semantic HTML vs. native primitives. Shared hooks/types prevent logic duplication. |
| Migration takes longer than expected | Medium | Low | Phases are independent. Web app can deploy while native app still uses old code. Both can coexist during migration. |
| Shared package becomes a dumping ground | Low | Medium | Strict rule: shared exports data, types, and hooks — never UI components or styling. Code review enforces this. |
| Monorepo tooling complexity | Low | Low | npm workspaces are simple. Only add Turborepo if build times become a problem. |
| Feature drift between web and native | Medium | Medium | Shared GraphQL operations and types ensure data consistency. Acceptance criteria are platform-agnostic; tests are platform-specific. |

## What This Enables

1. **Web-native UX.** Semantic HTML, real CSS, SSR, proper accessibility (`aria-*`, keyboard navigation), browser-native file upload. The web app stops feeling like a mobile app crammed into a browser.

2. **Native-native UX.** Camera, haptics, gestures, native animations, offline storage — all without worrying about web compatibility. No more `.web.tsx` fallbacks.

3. **Simpler builds.** Web deploys as a standard Next.js app on Vercel. Native builds via EAS. No more chained build commands or Metro resolver hacks.

4. **Independent release cycles.** Ship a web fix without touching the native app. Ship a native feature without worrying about web fallbacks.

5. **Elimination of the native module stubbing problem.** The entire `native-web-filter` initiative, the 9+ commits of whack-a-mole fixes, the 123-line `metro.config.js` — all of it goes away.

6. **Standard tooling.** Next.js and Expo are both mature, well-documented ecosystems. New contributors can onboard with standard tutorials instead of learning custom Metro resolver hacks.

## Decision Criteria

This refactor is worth doing if:
- [ ] We continue to hit native module stubbing issues on web (we have, 9+ times)
- [ ] The web experience needs to improve beyond what React Native Web can provide
- [ ] We want independent deployment of web and native apps
- [ ] The shared logic between web and native is primarily data/types, not UI (it is — the only shared UI is translation display, and even that benefits from platform-specific rendering)

## References

- [ADR-0002: Universal React Native Frontend](../adr/0002-universal-react-native-frontend.md) — the decision this supersedes
- [Native Module Web Stubbing](./native-module-web-stubbing.md) — documents the problem this eliminates
- [Expo + Next.js monorepo examples](https://github.com/vercel/next.js/tree/canary/examples/with-expo)
- [Turborepo with React Native](https://turbo.build/repo/docs/guides/tools/react-native)
