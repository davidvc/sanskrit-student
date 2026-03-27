# Frontend Architecture: Monorepo (Web + Native)

## Overview

Sanskrit Student uses a **monorepo with separate web and native apps** sharing a common logic package. This replaced the earlier Universal React Native architecture (see [ADR-0004](../adr/0004-split-web-and-native-apps.md)).

## Monorepo Structure

```
sanskrit-student/
├── src/                        # GraphQL backend (TypeScript)
│   ├── domain/                 # Business logic
│   ├── adapters/               # External integrations (Anthropic, Google Vision)
│   └── server.ts               # GraphQL Yoga server
│
├── api/
│   └── graphql.js              # Vercel serverless function for GraphQL
│
├── packages/
│   ├── shared/                 # Shared logic (no UI)
│   │   ├── src/
│   │   │   ├── graphql/        # GraphQL operations & codegen output
│   │   │   ├── hooks/          # Apollo hooks (useTranslateSutraQuery, etc.)
│   │   │   ├── types/          # Domain types (TranslationResult, WordEntry, etc.)
│   │   │   └── utils/          # Text formatting utilities
│   │   └── package.json
│   │
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages & layouts
│   │   │   ├── components/     # React UI components (semantic HTML + Tailwind)
│   │   │   └── lib/            # Apollo Client config, localStorage helpers
│   │   └── package.json
│   │
│   └── native/                 # Expo mobile app (iOS + Android)
│       ├── app/                # Expo Router screens
│       ├── components/         # React Native UI components (NativeWind)
│       └── package.json
│
└── package.json                # npm workspaces root
```

## Package Boundaries

**`packages/shared`** exports data, types, and hooks — never UI components or styling.

| Belongs in `shared` | Does NOT belong in `shared` |
|---|---|
| GraphQL operations & codegen output | UI components |
| Domain TypeScript types | Apollo Client configuration |
| Apollo hooks (`useTranslateSutraQuery`, etc.) | Styling of any kind |
| Text formatting utilities | Platform-specific code |

**`packages/web`** is a standard Next.js application using semantic HTML and real Tailwind CSS.

**`packages/native`** is a standard Expo application targeting iOS and Android only (no web target).

## Architecture Stack

### packages/shared

```
├── @apollo/client          - GraphQL client hooks
├── graphql                 - Query/mutation definitions
└── TypeScript              - Domain types and utilities
```

### packages/web

```
├── Next.js 14 (App Router) - SSR, routing, image optimization
├── React 18                - UI components
├── Apollo Client           - GraphQL data fetching (SSR-compatible)
│   └── @apollo/experimental-nextjs-app-support
├── Tailwind CSS            - Real CSS utility classes
└── TypeScript              - End-to-end type safety
```

### packages/native

```
├── Expo SDK                - Tooling, camera, device APIs
├── React Native            - Cross-platform UI primitives
├── Expo Router             - File-based navigation
├── Apollo Client           - GraphQL data fetching
├── NativeWind              - Tailwind CSS for React Native
└── TypeScript              - End-to-end type safety
```

## Data Flow

Both apps consume shared GraphQL hooks backed by the same API:

```
packages/web (Next.js)          packages/native (Expo)
       │                                │
       └──── packages/shared ───────────┘
                    │
                    │  useTranslateSutraQuery()
                    │  useTranslateSutraFromImageMutation()
                    ▼
             GraphQL API (/graphql)
                    │
              api/graphql.js (Vercel serverless)
                    │
                 src/ (GraphQL Yoga + backend logic)
```

## Key Design Decisions

### 1. Separate Web and Native Apps

The Universal React Native approach (ADR-0002) required extensive native module stubbing for the web build (123 lines of Metro resolver hacks fixed 9+ times). The split eliminates this entirely — each app uses its platform's native toolchain without compatibility workarounds.

See [ADR-0004](../adr/0004-split-web-and-native-apps.md) for full rationale.

### 2. Shared Package for Logic, Not UI

UI components are platform-specific by necessity (`<button>` vs `<Pressable>`, real CSS vs NativeWind). Sharing hooks, types, and GraphQL operations gives consistent data access without forcing a lowest-common-denominator component model.

### 3. Apollo Client with SSR Support (Web)

The web app uses `ApolloNextAppProvider` and SSR-compatible `ApolloClient`/`InMemoryCache` from `@apollo/experimental-nextjs-app-support`. This handles per-request client creation on the server and proper cache hydration on the client.

### 4. Next.js App Router

All web pages are Server Components by default. Pages that use Apollo hooks are `'use client'` components wrapped by `ApolloWrapper` in the root layout.

## Development Workflow

### Local Development

```bash
# Terminal 1: Backend
npm run dev   # GraphQL server at http://localhost:4000/graphql

# Terminal 2: Web app
cd packages/web && npm run dev   # Next.js at http://localhost:3000

# Terminal 3: Native app (optional)
cd packages/native && npx expo start
```

### Type Generation

```bash
# Regenerate TypeScript types from GraphQL schema
cd packages/shared && npm run codegen
```

### Build

```bash
# Full production build (mirrors Vercel buildCommand)
npm run build                         # Root TypeScript (backend)
cd packages/shared && npm run build   # Shared package
cd packages/web && npm run build      # Next.js
```

## Testing

- **Backend/API**: Vitest acceptance tests in `tests/acceptance/`
- **Native app**: React Native Testing Library in `packages/native/tests/`
- **Web app**: No dedicated test suite yet (validated via build + manual testing)

See [front-end-test-design.md](./front-end-test-design.md) for the native app testing strategy.

## Deployment

The web app deploys to Vercel. See [vercel-setup.md](../vercel-setup.md) for configuration details.

The native app distributes via EAS Build (iOS App Store / Google Play).

## Related Documentation

- [ADR-0002: Universal React Native Frontend](../adr/0002-universal-react-native-frontend.md) — superseded architecture
- [ADR-0004: Split Web and Native Apps](../adr/0004-split-web-and-native-apps.md) — decision that created this architecture
- [Frontend Test Design](./front-end-test-design.md) — native app testing strategy
- [Vercel Setup](../vercel-setup.md) — deployment guide

---

**Last Updated:** 2026-03-27
**Status:** Current
