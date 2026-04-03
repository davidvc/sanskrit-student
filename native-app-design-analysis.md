# Native App Design Analysis

*Analysis date: 2026-04-02*

This document analyzes the current design of the Expo/React Native app in `packages/native/` against current best practices, identifies problematic design choices, and highlights missing pieces that are likely to cause problems.

---

## Executive Summary

The app has a solid foundation in a few areas (GraphQL integration, the translate screen's state machine, the image cropper's hexagonal architecture pattern). However, several design choices are actively problematic or represent significant gaps compared to current best practices. The most critical issues are:

1. **`camera.tsx` is a god component** that is nearly impossible to test reliably
2. **Data passing between screens via JSON-serialized URL params** is fragile and bypasses the Apollo cache
3. **Fake progress simulation** using `setTimeout` is causing flaky tests and is architecturally dishonest
4. **No EAS Build/Update configuration** — production builds are not planned for
5. **`process.env.NODE_ENV` for production URL** will produce a broken URL in native production builds

---

## 1. Critical Design Problems

### 1.1 `camera.tsx` is a God Component (466 lines)

**The problem:** `camera.tsx` handles at least six distinct responsibilities in a single file:
- Camera permission lifecycle
- First-use lighting tip (AsyncStorage-backed)
- Photo capture
- Crop region management
- Progress simulation and OCR mutation
- Navigation and error display

It manages **8 separate `useState` calls** and branches into **5 distinct render paths** with conditional logic scattered throughout.

**Why this matters:** God components are the leading cause of untestable React Native code. The test suite confirms this: two tests are outright skipped (`it.skip`) due to timing races caused by the `setTimeout` delays embedded in the component logic. Logic that lives in a monolithic component cannot be tested in isolation — you have to render the entire camera viewfinder, mock permissions, mock Apollo, mock AsyncStorage, and control timers all at once.

**Best practice:** Screen components should be thin orchestrators. Extract logic into custom hooks:
- `useLightingTip()` — AsyncStorage read/write + timer
- `useCameraCapture()` — permission, photo taking, crop, progress state
- `useOcrMutation()` — Apollo mutation + progress state machine (mirroring translate.tsx's reducer pattern)

The screen file should then read from these hooks and only contain JSX.

**Also:** Three extracted components already exist (`LightingTip.tsx`, `PhotoPreview.tsx`, `ProgressView.tsx`) but are never imported. The camera screen re-implements all that logic inline. Either these components should be used or deleted — right now they create confusion about what the actual implementation is.

---

### 1.2 Cross-Screen Data Transfer via JSON-Serialized URL Params

**The problem:** After OCR, `camera.tsx` passes the result to `translate.tsx` by JSON-serializing each field into a URL parameter:

```typescript
// camera.tsx
router.push({
  pathname: '/translate',
  params: {
    fromCamera: 'true',
    originalText: JSON.stringify(data.originalText),
    iastText: JSON.stringify(data.iastText),
    // ...
  }
});

// translate.tsx
const { originalText: originalTextParam } = useLocalSearchParams();
const originalText = JSON.parse(originalTextParam as string);
```

**Why this matters:**
- There is no shared type contract for the param shape — any mismatch between what camera sends and translate expects is a runtime error with no compile-time safety
- Large data objects in URL params are error-prone and become problematic if data contains characters that need URL encoding
- This completely bypasses Apollo's `InMemoryCache` — the data the server just returned is thrown away and re-transmitted as a string over the router
- `useLocalSearchParams()` returns `string | string[]` for every value, so every usage requires a cast and parse

**Best practice:** The standard approach when using Apollo is to pass only an ID in the URL, then let the destination screen re-query from cache. Since the data is already in Apollo's cache from the mutation response, this is a zero-network-cost operation:

```typescript
// camera.tsx
router.push({ pathname: '/translate', params: { translationId: data.id } });

// translate.tsx
const { translationId } = useLocalSearchParams();
const { data } = useTranslationQuery({ variables: { id: translationId }, fetchPolicy: 'cache-first' });
```

If the mutation result doesn't have a stable ID, an alternative is a minimal global store (Zustand) to hold the pending result across navigation without touching the URL.

---

### 1.3 Fake Progress Simulation Causing Flaky Tests

**The problem:** The camera screen advances through `uploading → ocr → translating` progress states using artificial 100ms `setTimeout` delays before the actual mutation fires:

```typescript
setProgressState('uploading');
await new Promise(resolve => setTimeout(resolve, 100));
setProgressState('ocr');
await new Promise(resolve => setTimeout(resolve, 100));
setProgressState('translating');
const result = await translateSutraFromImage(...);
```

**Why this matters:**
- The server processes everything in a single round-trip — these states don't reflect real server-side stages
- 100ms delays in Jest tests require `jest.useFakeTimers()` and careful `act()` flushing. Two tests are already skipped because this is not working reliably
- If the mutation resolves in under 100ms (fast network/local dev), the UX will show `uploading` then `translating` and skip `ocr` visually — the actual user experience depends on network speed

**Best practice:** If you want to show fake progress to improve perceived performance, use a `useEffect` with Reanimated's progress animation rather than embedding state transitions in a mutation handler. Better yet, if the backend can report actual progress stages (via a subscription or a polling endpoint), show real stages. For a first iteration, simply showing a spinner while the single mutation is in flight is honest and reliable.

---

### 1.4 Production API URL Will Break in Native Builds

**The problem:** In `lib/apollo.ts`:

```typescript
const uri = process.env.NODE_ENV === 'production'
  ? '/graphql'
  : `http://${Constants.expoConfig?.hostUri?.split(':')[0]}:4000/graphql`;
```

`'/graphql'` is a relative URL. Relative URLs only work in a web browser. In a native app (iOS/Android), `fetch('/graphql')` will either throw or try to resolve against `file://`, both of which are broken. A native production build will have no working API endpoint.

**Best practice:** Native production builds require an absolute URL. This should come from an environment variable configured in `app.config.js` or EAS Secrets:

```typescript
const uri = Constants.expoConfig?.extra?.apiUrl ?? 
  `http://${Constants.expoConfig?.hostUri?.split(':')[0]}:4000/graphql`;
```

With `eas.json` providing `EXPO_PUBLIC_API_URL` per build profile (development / staging / production).

---

## 2. Significant Design Gaps

### 2.1 No EAS Build or EAS Update Configuration

There is no `eas.json` in the project. The app has no defined path to production — no build profiles, no environment variable management, no OTA update configuration. Key consequences:

- No way to create a production build with a production API URL
- No way to push OTA JavaScript updates after a store submission
- No environment separation (dev/staging/prod API endpoints)

**Best practice:** Add `eas.json` with at minimum three build profiles (`development`, `preview`, `production`). Configure `app.config.js` (instead of `app.json`) so it can read environment variables at build time. Use `expo-constants` to expose these to the runtime.

---

### 2.2 No Global Error Handling in Apollo

The Apollo client has no `errorLink`. Currently, errors are handled component-by-component via `error` from `useMutation`/`useQuery`. This means:

- Network errors (timeouts, server down) surface inconsistently across screens
- There is no single place to handle auth failures (e.g., 401 → redirect to login)
- No centralized error logging/reporting

**Best practice:** Add an `errorLink` that catches network errors and GraphQL errors globally. Connect it to a toast/notification system and a crash reporting service (Sentry). The component-level `error` handling can then focus on user-visible feedback for expected error states (validation, not-found) rather than infrastructure failures.

---

### 2.3 No Crash Reporting or Observability

There is no Sentry, Bugsnag, or equivalent crash reporting configured. In production, React Native crashes produce minimal information from app store crash logs. Without a crash reporting SDK, diagnosing production issues is essentially impossible.

**Best practice:** Add `@sentry/react-native` before the first production release. Configure it in `_layout.tsx` as an error boundary. Sentry also captures ANRs, native crashes, and slow frames — valuable data for a camera-heavy app where native library issues are common.

---

### 2.4 `LogBox.ignoreAllLogs()` in Development

```typescript
if (__DEV__) {
  LogBox.ignoreAllLogs();
}
```

This was added to prevent LogBox from intercepting touches during E2E testing, but it silences all warnings and errors during development. Deprecation warnings from dependencies, invalid prop warnings, and hook violations are all hidden.

**Best practice:** Use `LogBox.ignoreLogs(['specific warning text'])` to suppress only the specific warnings that interfere with E2E testing. Or, better, configure Maestro to dismiss the LogBox overlay rather than suppressing logging globally.

---

### 2.5 `moduleResolution: "node"` in tsconfig

`tsconfig.json` uses `"moduleResolution": "node"`, which is the legacy TypeScript module resolution mode. For an Expo SDK 54 / React Native 0.76+ project using modern packages, `"moduleResolution": "bundler"` is the correct setting. It enables proper resolution of `exports` fields in `package.json`, which many modern packages now require.

This won't cause obvious build failures today, but it can cause packages to resolve the wrong entry points and will create problems as the dependency tree evolves.

---

### 2.6 NativeWind Installed but Entirely Unused

`nativewind`, `tailwindcss`, `global.css`, and `tailwind.config.js` are all configured, but every component uses `StyleSheet.create()`. The NativeWind setup is dead weight — it increases bundle size and adds a transformer to Metro's processing pipeline with no benefit.

**Best practice:** Either adopt NativeWind consistently (which has real DX advantages for styling) or remove it. Mixed styling approaches (Tailwind classes on some components, StyleSheet on others) create confusion and inconsistency. The current state of "configured but never used" is the worst of both worlds.

---

### 2.7 `photoConverter.ts` Utility is Unused

The `convertPhotoToFile()` function in `utils/photoConverter.ts` is documented and does exactly what `camera.tsx` does inline:

```typescript
// photoConverter.ts (unused utility)
export function convertPhotoToFile(uri: string): ReactNativeFile {
  return { uri, name: 'photo.jpg', type: 'image/jpeg' };
}

// camera.tsx (inline, bypasses the utility)
const uploadFile = { uri: uploadUri, name: 'photo.jpg', type: 'image/jpeg' };
```

Either use the utility or delete it. Dead utility code creates confusion about what the canonical implementation is.

---

### 2.8 `useTranslateSutraQuery` with `onCompleted`/`onError` Callbacks

In `translate.tsx`, state machine transitions are driven via Apollo's `onCompleted` and `onError` callbacks:

```typescript
const { loading } = useTranslateSutraQuery({
  onCompleted: (data) => dispatch({ type: 'TRANSLATION_SUCCEEDED', ... }),
  onError: (error) => dispatch({ type: 'TRANSLATION_FAILED', ... }),
});
```

Apollo's `onCompleted`/`onError` callbacks are known to fire multiple times under React 18's StrictMode (which double-invokes effects) and can be called incorrectly with concurrent rendering. The Apollo team has documented these as problematic for side-effect-heavy use cases.

**Best practice:** Drive state from the hook's return values (`data`, `error`, `loading`) in a `useEffect` rather than callbacks:

```typescript
const { data, error, loading } = useTranslateSutraQuery(...);

useEffect(() => {
  if (data) dispatch({ type: 'TRANSLATION_SUCCEEDED', payload: data });
}, [data]);

useEffect(() => {
  if (error) dispatch({ type: 'TRANSLATION_FAILED', payload: error });
}, [error]);
```

This is idempotent and safe under StrictMode.

---

## 3. Things Done Well

These are design choices that align with best practices and should be preserved:

- **State machine in `translate.tsx`**: The `useReducer` + discriminated union `TranslationState` pattern correctly models the screen as a state machine. This is the right approach and prevents impossible states. The camera screen should adopt the same pattern.

- **Port/Adapter for image cropping**: `ImageCropperPort` + `ExpoImageCropperAdapter` in `utils/imageCropper.ts` is a textbook application of the hexagonal architecture pattern. The pure `toImageSpaceCrop()` function is separately testable. This pattern should be the model for other external integrations.

- **Apollo `isExtractableFile` customization**: Correctly handling React Native's URI-based file objects in the upload link is non-obvious and correctly implemented.

- **`useLocalSearchParams()` over `useGlobalSearchParams()`**: The app uses the scoped version, which is the correct choice per Expo Router docs — it avoids re-renders in background screens.

- **`testID` coverage**: Components consistently use `testID` props, enabling reliable querying in tests without depending on visible text content.

- **Shared GraphQL package**: Moving generated hooks and types into `@sanskrit-student/shared` is the right call for a monorepo — it keeps the native package thin and makes the data contracts available to any future web frontend.

- **BDD-style test organization**: Tests are organized with Given/When/Then comments and test complete user flows via `MockedProvider`, which aligns with the "test behavior, not implementation" principle.

---

## 4. Summary of Recommendations

| Priority | Issue | Action |
|----------|-------|--------|
| **Critical** | Production API URL broken | Replace relative `/graphql` with env-var-backed absolute URL |
| **Critical** | No EAS configuration | Add `eas.json` with dev/staging/prod profiles |
| **High** | `camera.tsx` god component | Extract `useLightingTip`, `useCameraCapture`, `useOcrMutation` hooks |
| **High** | JSON URL param data transfer | Pass only ID; let translate screen read from Apollo cache |
| **High** | Fake `setTimeout` progress | Replace with Reanimated animation or real server progress |
| **High** | No crash reporting | Add Sentry before first production release |
| **Medium** | No Apollo `errorLink` | Add centralized error/auth handling link |
| **Medium** | `onCompleted`/`onError` callbacks | Migrate to `useEffect` on `data`/`error` values |
| **Medium** | `LogBox.ignoreAllLogs()` | Replace with targeted `LogBox.ignoreLogs([...])` |
| **Medium** | Dead components (LightingTip, PhotoPreview, ProgressView) | Use them or delete them |
| **Low** | NativeWind unused | Adopt consistently or remove entirely |
| **Low** | `photoConverter.ts` unused | Use the utility in camera.tsx or delete it |
| **Low** | `moduleResolution: "node"` | Upgrade to `"bundler"` in tsconfig |
| **Low** | tsconfig path aliases not in Metro | Add `resolver` config to `metro.config.js` or remove aliases |
