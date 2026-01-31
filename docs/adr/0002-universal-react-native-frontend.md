# ADR 0002: Universal React Native Frontend Architecture

## Status

Accepted

## Context

Sanskrit Student requires a user interface that runs on multiple platforms: web browsers, iOS, and Android. The application is built with a TypeScript backend using GraphQL Yoga, and needs a frontend architecture that can:

1. Share code across web and mobile platforms
2. Access device features (camera for OCR)
3. Render Sanskrit text (Devanagari and IAST scripts) correctly
4. Integrate seamlessly with the existing GraphQL API
5. Provide a native-quality user experience on mobile
6. Be maintainable by a small team

### Platform Requirements

- **Web (Browser)**: Primary development target, accessible to all users
- **iOS**: Native app for App Store distribution
- **Android**: Native app for Google Play Store distribution
- **Future**: Potential offline-first capabilities

### Key Features Requiring Platform Considerations

1. **OCR Image Upload**
   - Mobile: Camera capture preferred
   - Web: File upload fallback

2. **Sanskrit Text Rendering**
   - Unicode Devanagari font support
   - IAST (romanized) text display
   - Script conversion UI

3. **Translation History**
   - Offline storage (mobile and web)
   - Sync across devices (future)

### Architecture Options Considered

#### Option 1: Web-First (Next.js + React)

**Stack:** Next.js, React, Apollo Client, TailwindCSS

**Approach:** Build web app first, then create separate mobile apps later

**Pros:**
- Excellent SEO capabilities
- Server-side rendering for performance
- Rich ecosystem and tooling
- Familiar to web developers

**Cons:**
- ❌ Requires complete rewrite for mobile apps
- ❌ No code sharing between web and mobile
- ❌ Two separate codebases to maintain
- ❌ Different component libraries (React web vs React Native)
- ❌ Camera/device API integration requires separate implementation

**Migration Path:** Web → React Native (complete rewrite)

---

#### Option 2: Universal React Native (Expo + React Native Web)

**Stack:** React Native, React Native Web, Expo, Expo Router, Apollo Client, NativeWind

**Approach:** Use React Native as the foundation with React Native Web for browser support

**Pros:**
- ✅ Single codebase for all platforms
- ✅ True code reuse (components work everywhere)
- ✅ Native performance on mobile
- ✅ File-based routing (Expo Router) works on web and mobile
- ✅ Device API access (camera, storage) built-in
- ✅ Excellent developer experience with Expo tooling
- ✅ Progressive enhancement path (web → mobile → native features)

**Cons:**
- ⚠️ Limited SEO capabilities (client-side rendering)
- ⚠️ Slightly larger web bundle size vs traditional web frameworks
- ⚠️ Some platform-specific code needed for edge cases

**Migration Path:** Web + Mobile from day one (single codebase)

---

#### Option 3: Hybrid (Capacitor + Web Framework)

**Stack:** React/Vue web app + Capacitor for native wrapper

**Approach:** Build web app, wrap it with Capacitor for native distribution

**Pros:**
- Leverage existing web skills
- Single web codebase
- Native app distribution

**Cons:**
- ❌ WebView performance (not true native)
- ❌ Platform feel is "web-like" not native
- ❌ Complex device API integration
- ❌ Debugging challenges across platforms

---

#### Option 4: Native per Platform (Swift/Kotlin + React Web)

**Stack:** Separate Swift (iOS), Kotlin (Android), React (Web) apps

**Approach:** Build native apps per platform

**Pros:**
- Best native performance
- Platform-specific optimizations

**Cons:**
- ❌ Three separate codebases
- ❌ 3x development effort
- ❌ Expertise required in Swift, Kotlin, and React
- ❌ Complex to maintain consistency across platforms

---

## Decision

We will use **Universal React Native** (Option 2) with the following stack:

### Core Stack

- **React Native** - Cross-platform UI primitives
- **React Native Web** - Render React Native components in browsers
- **Expo SDK** - Tooling, build system, and native APIs
- **Expo Router** - File-based routing for all platforms
- **Apollo Client** - GraphQL client with TypeScript integration
- **NativeWind** - Tailwind CSS for React Native
- **GraphQL Code Generator** - Auto-generate typed hooks from schema

### Rationale

#### 1. True Cross-Platform Code Reuse

Sanskrit Student is a mobile-first use case:
- Students will use camera for OCR on physical books
- Mobile devices are primary learning environment
- Web provides accessibility for desktop study

With Universal React Native:
```typescript
// Same component works on web, iOS, and Android
<SutraInput
  onTranslate={handleTranslate}
  supportedScripts={['devanagari', 'iast']}
/>
```

With Next.js approach:
```typescript
// Web component (React)
<SutraInput /> // web/components/SutraInput.tsx

// Mobile component (React Native) - completely separate
<SutraInput /> // mobile/components/SutraInput.tsx
```

**Result:** 70-80% code reuse vs 0% with Next.js

#### 2. Device API Access is First-Class

OCR feature requires camera access:

```typescript
// Universal React Native (same code everywhere)
import * as ImagePicker from 'expo-image-picker';

// Works on mobile (camera) and web (file picker)
const result = await ImagePicker.launchCameraAsync({
  allowsEditing: true,
  quality: 0.8,
});

// Upload to GraphQL
const { data } = await translateFromImage({
  variables: { image: result }
});
```

With Next.js:
- Web: Standard file upload
- Mobile: Separate React Native camera implementation
- **Different code for each platform**

#### 3. Consistent Navigation Model

Expo Router provides file-based routing that works on web and mobile:

```
app/
├── index.tsx          → / (web) or Home screen (mobile)
├── translate.tsx      → /translate (web) or Translate screen (mobile)
└── history/
    └── [id].tsx       → /history/123 (web) or History detail screen (mobile)
```

**Web:** Standard URLs work as expected
**Mobile:** Native navigation with deep linking
**One routing model for all platforms**

#### 4. GraphQL Integration

Apollo Client works identically across platforms:

```typescript
// Generated typed hook (works everywhere)
const { data, loading } = useTranslateSutraQuery({
  variables: { sutra: userInput }
});

// TypeScript knows exact shape
data?.translateSutra.words // ✅ Type-safe
```

File upload for OCR images:
```typescript
// Same mutation on web and mobile
const [translateFromImage] = useTranslateSutraFromImageMutation();

// Upload works with native camera or web file input
await translateFromImage({
  variables: { image: selectedImage }
});
```

#### 5. Sanskrit Text Rendering

Unicode Devanagari rendering works consistently:

```typescript
import { useFonts } from 'expo-font';

// Load custom Devanagari font
const [fontsLoaded] = useFonts({
  'NotoSansDevanagari': require('./assets/fonts/NotoSansDevanagari.ttf'),
});

// Same Text component on all platforms
<Text style={{ fontFamily: 'NotoSansDevanagari' }}>
  योगश्चित्तवृत्तिनिरोधः
</Text>
```

**Web:** Uses web fonts
**Mobile:** Embeds font in app bundle
**Same component code**

#### 6. Development Velocity

Expo's development experience:

```bash
npx expo start

# Press 'w' → Opens in browser
# Press 'i' → iOS simulator
# Press 'a' → Android emulator
# Scan QR → Test on physical device
```

**Hot reload works across all platforms simultaneously**

Changes in one component update web, iOS, and Android instantly.

With Next.js → React Native:
- Develop web features
- Later, rebuild same features in React Native
- **2x development time for mobile**

#### 7. Future-Proof Architecture

Progressive enhancement path:

**Phase 1:** Web browser (Expo web)
**Phase 2:** iOS/Android apps (same code)
**Phase 3:** Native features (camera, offline storage)
**Phase 4:** Advanced (handwriting recognition, audio)

Each phase builds on previous code, no rewrites needed.

### Trade-offs Accepted

#### Limited SEO

**Issue:** React Native Web renders client-side, limiting SEO.

**Mitigation:**
- Sanskrit Student is an app, not a content site
- No need for search engine discovery
- Users access via direct link or app store

**Verdict:** Not a concern for this use case

#### Slightly Larger Web Bundle

**Issue:** React Native Web includes mobile-focused code.

**Mitigation:**
- Modern bundlers tree-shake unused code
- Lazy load heavy features (camera, image processing)
- Acceptable trade-off for code reuse benefits

**Verdict:** Performance is acceptable for educational app

#### Platform-Specific Code for Edge Cases

**Issue:** Some features need platform-specific code:

```typescript
import { Platform } from 'react-native';

const inputMode = Platform.select({
  web: 'text',
  ios: 'default',
  android: 'default',
});
```

**Verdict:** Minimal platform-specific code (<5%), acceptable

## Consequences

### Positive

- ✅ **Single Codebase:** Write once, run on web/iOS/Android
- ✅ **Faster Development:** No need to build features twice
- ✅ **Consistent UX:** Same UI components across platforms
- ✅ **Type Safety:** GraphQL → TypeScript → React components
- ✅ **Device APIs:** First-class camera, storage, notifications
- ✅ **Future-Proof:** Easy to add native features later
- ✅ **Developer Experience:** Hot reload across all platforms
- ✅ **Lower Maintenance:** One codebase to update and debug

### Negative

- ⚠️ **Learning Curve:** Team must learn React Native patterns
- ⚠️ **Build Complexity:** Native builds require Xcode/Android Studio or EAS
- ⚠️ **Platform Quirks:** Occasional platform-specific bugs
- ⚠️ **Web Bundle Size:** Slightly larger than pure web framework

### Mitigations

1. **Learning Curve:**
   - Start with web development (familiar patterns)
   - Gradually adopt mobile-specific features
   - Extensive documentation and examples available

2. **Build Complexity:**
   - Use EAS Build (Expo's cloud build service)
   - No local Xcode/Android Studio required
   - Automated build and deploy pipeline

3. **Platform Quirks:**
   - Use Platform.select() for platform-specific code
   - Comprehensive testing on each platform
   - Expo community support for common issues

4. **Web Bundle Size:**
   - Code splitting via Expo Router
   - Lazy load heavy components
   - Optimize fonts and assets

## Implementation Plan

### Phase 1: Project Setup (Week 1)
- Initialize Expo project with TypeScript
- Configure Expo Router
- Set up Apollo Client
- Configure GraphQL Code Generator
- Install NativeWind for styling

### Phase 2: Core Features (Week 2-3)
- Build translation input component
- Implement translation results display
- Add word breakdown view
- Integrate GraphQL queries/mutations

### Phase 3: OCR Feature (Week 4)
- Camera capture component (mobile)
- File upload fallback (web)
- Image preview and editing
- OCR confidence display

### Phase 4: Polish (Week 5)
- Sanskrit font integration
- Script conversion UI
- Translation history
- Offline caching

### Phase 5: Native Builds (Week 6)
- Configure EAS Build
- Test iOS build
- Test Android build
- Submit to app stores (optional)

## Alternatives Considered and Rejected

### Rejected: Next.js + Separate Mobile Apps

**Reason:** Doubling development effort is not sustainable for small team. Code reuse is critical.

### Rejected: Capacitor Hybrid Approach

**Reason:** WebView performance is suboptimal for text-heavy app with complex Unicode rendering. Want true native performance.

### Rejected: Native Swift/Kotlin per Platform

**Reason:** 3x development effort. Requires expertise in three different ecosystems. Not feasible.

## Success Metrics

This decision will be considered successful if:

1. **Code Reuse:** >70% of codebase shared across platforms
2. **Development Speed:** Features deployed to all platforms in single release cycle
3. **Performance:** 60fps scrolling on translation results (mobile)
4. **User Experience:** Consistent UX across web and mobile (user testing)
5. **Maintainability:** Single developer can maintain all platforms

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Apollo Client for React Native](https://www.apollographql.com/docs/react/integrations/react-native/)
- [NativeWind](https://www.nativewind.dev/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [ADR-0001: Hybrid Translation Approach](./0001-hybrid-translation-approach.md)

## Related Documents

- [Frontend Architecture Documentation](../architecture/front-end-architecture.md)

---

**Date:** 2026-01-31
**Author:** Sanskrit Student Team
**Status:** Accepted
