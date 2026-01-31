# ADR 0003: Vercel Hosting Platform

## Status

Accepted

## Context

Sanskrit Student requires a hosting platform for both the GraphQL backend and the Universal React Native frontend (web build). The platform must support easy deployment, minimal DevOps overhead, and allow for future migration if requirements change.

## Decision

We will use **Vercel** as the hosting platform for both frontend and backend.

## Rationale

- Single platform for entire stack simplifies initial deployment
- Zero-config deployments from Git
- Excellent developer experience for rapid iteration
- Generous free tier for validation phase
- GraphQL Yoga runs as serverless function
- Native support for Expo/React Native Web
- Easy migration path to EAS Hosting + Railway if needed later

## Consequences

### Positive

- Fastest time to deployment
- Minimal configuration required
- Automatic SSL, CDN, and edge network
- Preview deployments for pull requests
- No DevOps expertise needed

### Negative

- Serverless functions have cold starts
- Less control over backend execution environment
- May need to migrate if long-running processes are added

### Mitigations

- Cold starts acceptable for educational app traffic patterns
- Migration to dedicated backend (Railway/Render) is straightforward if needed
- Architecture remains platform-agnostic

## Date

2026-01-31
