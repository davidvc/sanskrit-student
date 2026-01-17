# High-Level Design: Basic Sanskrit Sutra Translation

## Overview

A serverless service that translates Sanskrit sutras from IAST transliteration, providing word-by-word breakdowns and multiple full translation alternatives. The service uses an LLM to power translations.

## Architecture Decisions

### Language: TypeScript

**Rationale:**
- Strong typing catches errors at compile time
- Excellent GraphQL ecosystem (Apollo Server, GraphQL Yoga)
- First-class LLM SDK support (Anthropic, OpenAI)
- Shared types between API and future web UI
- Fast cold starts on serverless platforms

### Platform: Vercel Serverless

**Rationale:**
- Excellent developer experience with automatic deployments
- Native TypeScript support
- Built-in edge functions and API routes
- Easy path to adding web UI later
- Generous free tier for low-usage applications

### API: GraphQL

**Rationale:**
- Flexible queries allow clients to request exactly what they need
- Strong typing aligns well with TypeScript
- Self-documenting schema
- Good fit for the nested data structure (sutra → words → meanings)

### Translation Engine: LLM (Claude)

**Rationale:**
- Sanskrit requires deep linguistic knowledge for accurate translation
- LLM can provide multiple interpretive translations
- Can identify grammatical forms and sandhi (compound words)
- No need to maintain custom dictionaries or rule engines

## System Components

```
┌─────────────────────────────────────────────────────────┐
│                      Clients                            │
│              (CLI, Future Web UI)                       │
└─────────────────────┬───────────────────────────────────┘
                      │ GraphQL
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 Vercel Serverless                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │              GraphQL API Layer                    │  │
│  │         (Schema, Resolvers, Validation)           │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────▼───────────────────────────┐  │
│  │            Translation Service                    │  │
│  │    (Orchestrates LLM calls, formats response)     │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────▼───────────────────────────┐  │
│  │              LLM Client (Claude)                  │  │
│  │         (Anthropic SDK, prompt management)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key Dependencies

- `@vercel/node` - Vercel serverless runtime
- `graphql-yoga` - Lightweight GraphQL server (works well with Vercel)
- `@anthropic-ai/sdk` - Claude API client
- `vitest` - Testing framework
- `commander` - CLI framework

## Testing Strategy

- **Acceptance tests**: End-to-end tests against the GraphQL API (primary contract)
- **CLI tests**: Separate tests to verify CLI correctly translates commands to GraphQL queries
- **Unit tests**: For complex logic in translation service (if needed)

## Future Considerations

- Caching layer for repeated translations (Vercel KV or similar)
- Rate limiting for API protection
- Web UI using Next.js (natural fit with Vercel)
- Support for additional input formats (Devanagari, HK transliteration)
