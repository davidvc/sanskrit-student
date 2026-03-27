# ADR 0004: Split Web and Native Apps

## Status

Accepted (supersedes ADR-0002)

## Context

Sanskrit Student currently uses a Universal React Native architecture (ADR-0002): a single Expo codebase targeting web, iOS, and Android via React Native Web. In practice, the "single codebase for all platforms" promise has not held up:

1. **Whack-a-mole native module stubbing.** The web build pulls in React Native internals (`TurboModuleRegistry`, `BatchedBridge`, `ErrorUtils`, etc.) that don't exist in browsers. We've fixed this 9+ times across 9 commits, each adding another entry to a growing blocklist in `metro.config.js` (now 123+ lines of defensive resolver logic). We are fighting the bundler to make native code not run on the web.

2. **Web experience constrained by React Native primitives.** We use `<View>`, `<Text>`, `<Pressable>` instead of semantic HTML (`<main>`, `<section>`, `<button>`, `<input>`). NativeWind compiles to React Native's style system, not real CSS. Standard web libraries, CSS animations, and browser APIs require platform-specific escape hatches.

3. **Native experience constrained by web compatibility.** Every native feature (camera, haptics, gestures, offline storage) requires a `.web.tsx` fallback or conditional platform check. The camera screen already has separate `camera.tsx` and `camera.web.tsx` files.

4. **Deployment complexity.** The Vercel build chains backend compilation, app dependency installation, GraphQL codegen, and Expo web export in a single pipeline. Web and native concerns are entangled.

5. **Industry consensus.** The battle-tested approach for cross-platform products is: React/Next.js for web, React Native/Expo for native, with a shared package for business logic and types. This is the pattern used by Discord, Shopify, and others at scale.

### What ADR-0002 Got Right

The original decision correctly identified:
- The need for cross-platform reach (web + iOS + Android)
- GraphQL as the shared API layer
- TypeScript end-to-end for type safety
- Expo as the best React Native toolchain

These remain valid. The change is in **how** we achieve cross-platform: not a single codebase, but a monorepo with shared packages.

## Decision

We will split into a monorepo with three packages:

- **`packages/shared`** -- shared business logic, GraphQL hooks, types, and utilities (no UI)
- **`packages/web`** -- Next.js web application using semantic HTML and real Tailwind CSS
- **`packages/native`** -- Expo mobile application targeting iOS and Android only (no web target)

The backend (`src/`, `api/`, `tests/`) remains unchanged.

### Monorepo Tooling

Use **npm workspaces** to manage the three packages. Only add Turborepo if build times become a problem.

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

### Package Boundaries

**`packages/shared` exports data, types, and hooks -- never UI components or styling.** This avoids the abstraction trap of building a cross-platform component library that satisfies neither platform well.

What moves to shared:
- GraphQL schema, operations, and codegen output
- Domain types (`TranslationResult`, `WordEntry`, `OcrTranslationResult`)
- Platform-agnostic Apollo hooks (`useTranslateSutraQuery`, etc.)
- Text formatting utilities (IAST display helpers, etc.)

What does NOT go in shared:
- UI components (React and React Native have different primitives)
- Apollo Client configuration (Next.js uses SSR-aware setup; Expo uses simpler HTTP link)
- Styling of any kind

### What Gets Eliminated

| Current artifact | Why it goes away |
|---|---|
| 123-line Metro resolver in `metro.config.js` | No web target in native app |
| `shims/web-globals.js` | Hermes web polyfills no longer needed |
| `stubs/TurboModuleRegistry.js` | Native module stubs no longer needed |
| `camera.web.tsx` | Web has its own file upload component |
| All `*.web.tsx` fallback files | Each platform uses its own components |

## Rationale

### Why Next.js for Web

- Server-side rendering and static generation for fast loads
- Semantic HTML with proper accessibility (`aria-*`, keyboard navigation)
- Standard CSS/Tailwind (real CSS, not NativeWind compilation)
- Built-in image optimization, font loading, metadata API
- Vercel-native deployment (already our host)
- SEO capability for future public translation pages

### Why Expo-Only for Native

- Camera, haptics, gestures, and native animations can be used freely
- No `.web.tsx` fallbacks or `Platform.select()` workarounds
- Standard Metro config (no custom resolver hacks)
- Independent release cycle via EAS Build

### Why Shared Package for Logic

- Single source of truth for GraphQL operations and domain types
- Both apps get type-safe data hooks without duplicating query logic
- Changes to the API contract propagate automatically to both clients
- Clear boundary: shared = data layer, apps = presentation layer

## Consequences

### Positive

- Web app uses semantic HTML, real CSS, SSR, and proper accessibility
- Native app uses camera, haptics, and gestures without web compatibility concerns
- Simpler builds: standard Next.js on Vercel, standard Expo via EAS
- Independent release cycles for web and native
- Eliminates the entire native module stubbing problem (9+ commits of fixes)
- Standard tooling that new contributors can learn from public documentation

### Negative

- UI components are not shared between web and native (intentional trade-off)
- Migration effort across multiple phases
- Two sets of UI components to maintain

### Mitigations

- Shared hooks and types prevent business logic duplication; only presentation differs
- Phases are independent: web can deploy while native still uses old code
- Strict rule enforced via code review: shared package never contains UI or styling

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration takes longer than expected | Medium | Low | Phases are independent; both apps can coexist during migration |
| Shared package becomes a dumping ground | Low | Medium | Strict rule: data, types, hooks only. Code review enforces this. |
| Feature drift between web and native | Medium | Medium | Shared GraphQL operations and types ensure data consistency |
| Monorepo tooling complexity | Low | Low | npm workspaces are simple; Turborepo only if needed |

## References

- [ADR-0002: Universal React Native Frontend](./0002-universal-react-native-frontend.md) -- the decision this supersedes
- [Design Spec: Split into Separate Web and Native Apps](../architecture/react-native-react-web-split-refactor.md)
- [Native Module Web Stubbing](../architecture/native-module-web-stubbing.md) -- documents the problem this eliminates

## Date

2026-03-26
