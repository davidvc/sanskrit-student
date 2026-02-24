# Vercel Deployment Guide

This guide explains how to deploy the Sanskrit Student app (both backend and frontend) to Vercel as a single unified deployment.

## Overview

Vercel hosts:
- **Backend**: GraphQL server running as a serverless function at `/graphql`
- **Frontend**: React Native Web build served as static files

After deployment, you get a single URL (e.g., `https://sanskrit-student.vercel.app`) that works on any device without needing Expo Go or native app installation.

**Related**: See [ADR 0003: Vercel Hosting Platform](./adr/0003-vercel-hosting.md) for the architectural decision.

## Prerequisites

- Vercel account (free tier is sufficient)
- Git repository with your code
- Anthropic API key

## Initial Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Create Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "buildCommand": "npm install && npm run build && cd app && npm install && npm run codegen && npx expo export -p web",
  "outputDirectory": "app/dist",
  "framework": null,
  "functions": {
    "api/graphql.js": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/graphql",
      "destination": "/api/graphql"
    },
    {
      "source": "/(.*)",
      "destination": "/app/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**What this does:**
- `buildCommand`: Builds both backend and frontend
- `outputDirectory`: Where the frontend static files are output
- `functions`: Configures the GraphQL serverless function
- `rewrites`: Routes `/graphql` to the backend, everything else to the frontend

### 3. Create Serverless Function for GraphQL

Create `api/graphql.js` in the project root:

```javascript
const { createServer } = require('../dist/index.js');

module.exports = async (req, res) => {
  const yoga = createServer();
  return yoga.handle(req, res);
};
```

### 4. Update Backend Server Configuration

The backend needs to work in both local development and serverless environments.

Edit `src/index.ts` to export the server creator:

```typescript
import { createYoga } from 'graphql-yoga';
import { createServerConfig } from './server';

export function createServer() {
  const config = createServerConfig();
  const yoga = createYoga({
    schema: config.schema,
    graphqlEndpoint: '/graphql',
    cors: {
      origin: '*', // Configure appropriately for production
      credentials: true
    }
  });

  return yoga;
}

// For local development
if (require.main === module) {
  const yoga = createServer();
  const server = yoga.createServer({ port: 4000 });

  server.listen().then(() => {
    console.log('Server running at http://localhost:4000/graphql');
  });
}
```

### 5. Configure Environment Variables

You need to set environment variables in Vercel:

**Via Vercel CLI:**
```bash
vercel env add ANTHROPIC_API_KEY
# Enter your API key when prompted
```

**Via Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `ANTHROPIC_API_KEY` with your key value
4. Set for all environments (Production, Preview, Development)

### 6. Update Frontend GraphQL Endpoint

The frontend needs to point to the correct GraphQL endpoint in production.

Edit `app/lib/apollo.ts`:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production'
    ? '/graphql'  // Same domain in production
    : 'http://localhost:4000/graphql'  // Local development
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

## Deployment

### First Deployment

```bash
# From project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - Project name? sanskrit-student
# - In which directory is your code located? ./
```

This will:
1. Build the backend (TypeScript → JavaScript)
2. Install frontend dependencies
3. Generate GraphQL types
4. Build the Expo web app
5. Deploy everything to Vercel

### Subsequent Deployments

After the first deployment, simply run:

```bash
vercel --prod
```

Or push to your Git repository if you've connected it to Vercel for automatic deployments.

### Automatic Git Deployments

**Recommended**: Connect your GitHub repository to Vercel for automatic deployments:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect settings from `vercel.json`
5. Add environment variables in the project settings
6. Click "Deploy"

Now every push to `main` triggers a production deployment, and every PR gets a preview deployment.

## Accessing Your Deployed App

After deployment, you'll get URLs like:

- **Production**: `https://sanskrit-student.vercel.app`
- **Preview** (from PRs): `https://sanskrit-student-git-branch-name.vercel.app`

### Using on Mobile

**Share with friends:**
1. Send them the URL
2. They open it in their phone browser (Safari/Chrome)
3. Works immediately - no app installation needed

**Add to home screen for app-like experience:**
- **iPhone**: Open in Safari → Share button → "Add to Home Screen"
- **Android**: Open in Chrome → Menu (⋮) → "Add to Home Screen"

## Verifying the Deployment

### Test the GraphQL API

Visit `https://your-app.vercel.app/graphql` in a browser. You should see the GraphQL Yoga GraphiQL interface.

Try this query:
```graphql
query {
  translateSutra(sutra: "om") {
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

### Test the Frontend

Visit `https://your-app.vercel.app` and verify:
- Translation input works
- Results display correctly
- Devanagari text renders properly
- Navigation between screens works

## Troubleshooting

### Build Fails: "Cannot find module"

**Issue**: Dependencies not installed correctly

**Fix**: Check that both root and `app/` package.json files are correct. Vercel runs the `buildCommand` which should install both.

### GraphQL Endpoint Returns 404

**Issue**: Serverless function not deployed or rewrites not working

**Fix**:
1. Verify `api/graphql.js` exists and is committed to Git
2. Check `vercel.json` rewrites configuration
3. Check deployment logs in Vercel dashboard

### Frontend Shows "Network Error"

**Issue**: Frontend can't connect to GraphQL backend

**Fix**:
1. Check that `app/lib/apollo.ts` uses `/graphql` in production
2. Verify the GraphQL endpoint works independently
3. Check browser console for CORS errors

### Cold Start Delays

**Issue**: First request after inactivity is slow (serverless cold start)

**Expected behavior**: This is normal for Vercel's free tier. The second request will be fast.

**Mitigation**: Upgrade to Vercel Pro for faster cold starts, or migrate to a dedicated server (Railway, Render) if needed.

### Environment Variables Not Working

**Issue**: `ANTHROPIC_API_KEY` not accessible in serverless function

**Fix**:
1. Verify env var is set in Vercel dashboard
2. Ensure it's set for the correct environment (Production/Preview)
3. Redeploy after adding new env vars

### Expo Web Build Fails

**Issue**: `npx expo export -p web` fails during build

**Fix**:
1. Ensure `app/package.json` has all dependencies listed
2. Check that `app/app.json` has correct Expo configuration
3. Verify `app/assets/` directory exists with required assets (icon.png, etc.)

## Cost

**Free Tier Limits:**
- 100 GB bandwidth per month
- Serverless function execution limits
- Unlimited deployments

**Sufficient for:**
- Personal use
- Sharing with friends
- Small-scale testing

**Upgrade needed if:**
- High traffic (thousands of users)
- Consistent usage (not hobby project)
- Need faster cold starts

## Migration Path

If you later need more control or better performance:

### Option 1: EAS Hosting (Frontend Only)
Deploy frontend to EAS, backend to Railway/Render:
```bash
cd app
npx expo export -p web
npx eas-cli hosting create
npx eas-cli hosting deploy
```

Update `apollo.ts` to point to separate backend URL.

### Option 2: Railway (Full Stack)
Deploy both backend and frontend to Railway for persistent servers (no cold starts).

### Option 3: Native Apps via EAS Build
Build actual iOS/Android apps:
```bash
cd app
npx eas-cli build:configure
npx eas-cli build -p ios --profile preview
npx eas-cli build -p android --profile preview
```

Backend stays on Vercel or migrates to dedicated server.

## Development Workflow

### Local Development
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd app
npm start
# Press 'w' for web
```

### Test Production Build Locally
```bash
# Build everything
npm run build
cd app
npm run codegen
npx expo export -p web

# Serve locally with vercel dev
vercel dev
```

### Preview Deployments
Push to a branch and create a PR. Vercel automatically creates a preview deployment with a unique URL.

## Related Documentation

- [ADR 0003: Vercel Hosting Platform](./adr/0003-vercel-hosting.md)
- [ADR 0002: Universal React Native Frontend](./adr/0002-universal-react-native-frontend.md)
- [Frontend Setup Verification](./FRONTEND_SETUP_VERIFICATION.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)

---

**Last Updated**: 2026-02-23
