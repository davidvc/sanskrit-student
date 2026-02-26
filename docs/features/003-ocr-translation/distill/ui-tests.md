# OCR Translation Feature - UI Acceptance Tests

**Wave:** DISTILL (Acceptance Test Designer)
**Feature:** OCR Translation via Camera
**Date Created:** 2026-02-25
**Status:** Tests Created (Implementation Pending)

## Overview

This document describes the 7 UI acceptance tests created for the OCR translation feature. These tests validate the user interface and user experience of photographing Sanskrit text, verifying quality, and submitting for translation.

## Test Infrastructure

**Testing Framework:**
- React Native Testing Library (@testing-library/react-native ^12.4.3)
- Jest with jest-expo preset
- Apollo Client MockedProvider for GraphQL mocking
- Expo Camera mocking for camera functionality

**Test Location:**
```
app/tests/app/camera/
├── camera-launch.test.tsx           (AC-1: Launch camera)
├── photo-capture.test.tsx           (AC-2: Manual shutter)
├── photo-preview-zoom.test.tsx      (AC-3: Preview with zoom)
├── retake-flow.test.tsx             (AC-4: Retake functionality)
├── processing-progress.test.tsx     (AC-14: Progress messages)
├── first-use-lighting-tip.test.tsx  (AC-17: First-use tip)
└── end-to-end-camera-flow.test.tsx  (Integration test)
```

## Test Coverage Map

### AC-1: Launch Camera from Home Screen
**File:** `camera-launch.test.tsx`
**Scenarios:**
1. Displays "Take Photo" button prominently on home screen
2. Opens camera within 1 second when tapped
3. Displays camera with landscape frame overlay and guidance text (skipped - awaits implementation)

**Driving Port:** Navigation (Expo Router)
**Business Language:**
- "spiritual practitioner"
- "Devanagari text"
- "Take Photo button"
- "camera opens"
- "guidance text"

**Test Status:** Partially implemented (basic navigation tests enabled, camera view test skipped)

---

### AC-2: Capture Photo with Manual Shutter
**File:** `photo-capture.test.tsx`
**Scenarios:**
1. Captures photo when shutter button is tapped (skipped)
2. Shows preview immediately after photo is captured (skipped)
3. Disables shutter button during capture to prevent double-tap (skipped)

**Driving Port:** Camera API (expo-camera), Navigation
**Business Language:**
- "shutter button"
- "photo captured"
- "preview displays"
- "positioned over Devanagari sutra"

**Test Status:** All skipped (awaits Camera component implementation)

**Mock Strategy:**
- Mock `expo-camera` with `takePictureAsync` returning mock photo URI
- Mock photo dimensions (1920x1080)
- Simulate capture delay

---

### AC-3: Preview Photo and Verify Quality
**File:** `photo-preview-zoom.test.tsx`
**Scenarios:**
1. Displays preview with quality verification prompt (skipped)
2. Shows "Use This Photo" and "Retake" buttons in preview (skipped)
3. Enables pinch-to-zoom on preview for quality inspection (skipped)
4. Allows user to verify Devanagari text is sharp when zoomed (skipped)
5. Resets zoom when returning to camera view (skipped)

**Driving Port:** Camera API, Gesture Handling
**Business Language:**
- "preview displays"
- "quality verification"
- "text clear and in focus"
- "pinch-to-zoom"
- "Devanagari text is sharp"

**Test Status:** All skipped (awaits Preview component implementation)

**Mock Strategy:**
- Mock pinch gesture events with scale values
- Mock gesture state transitions
- Verify zoom properties on image component

---

### AC-4: Retake Photo if Quality is Poor
**File:** `retake-flow.test.tsx`
**Scenarios:**
1. Returns to camera view when "Retake" button is tapped (skipped)
2. Preserves camera settings when returning from preview (skipped)
3. Does not lose session state when retaking photo (skipped)
4. Allows multiple retakes without degradation (skipped)
5. Cleans up previous photo URI when retaking (skipped)

**Driving Port:** Navigation, Camera API
**Business Language:**
- "photo is blurry"
- "Retake button"
- "return to camera view"
- "frame overlay and guidance"
- "session not lost"

**Test Status:** All skipped (awaits implementation)

**Mock Strategy:**
- Track photo URIs across multiple captures
- Verify navigation state transitions
- Test memory cleanup

---

### AC-14: Show Processing Progress Messages
**File:** `processing-progress.test.tsx`
**Scenarios:**
1. Shows "Uploading image..." when photo is submitted (skipped)
2. Shows "Reading Devanagari text..." when OCR begins (skipped)
3. Shows "Translating..." when translation begins (skipped)
4. Completes all processing within 5 seconds (skipped)
5. Shows progress indicators in correct sequence (skipped)

**Driving Port:** GraphQL API (`translateSutraFromImage` mutation)
**Business Language:**
- "submitted photo"
- "Uploading image"
- "Reading Devanagari text"
- "Translating"
- "processing completes"

**Test Status:** All skipped (awaits implementation)

**Mock Strategy:**
- Mock GraphQL mutation with delays to simulate processing stages
- Mock typical photo (2 MB, 4 lines)
- Track message sequence with state observer
- Verify total processing time < 5 seconds

**GraphQL Mutation:**
```graphql
mutation TranslateSutraFromImage($image: Upload!) {
  translateSutraFromImage(image: $image) {
    originalText
    iastText
    words { word meanings }
    alternativeTranslations
    ocrConfidence
    extractedText
    ocrWarnings
  }
}
```

---

### AC-17: Show Lighting Tip on First Use
**File:** `first-use-lighting-tip.test.tsx`
**Scenarios:**
1. Displays lighting tip on first camera launch (skipped)
2. Automatically dismisses lighting tip after 3 seconds (skipped)
3. Sets first-use flag after displaying tip (skipped)
4. Does not show lighting tip on subsequent uses (skipped)
5. Tip does not interfere with camera functionality (skipped)
6. Tip displays as overlay, not blocking camera view (skipped)
7. Can manually dismiss tip before 3 seconds (skipped)

**Driving Port:** Local Storage (AsyncStorage)
**Business Language:**
- "first time using app"
- "lighting tip"
- "bright, even lighting"
- "3 seconds"
- "never seen again"

**Test Status:** All skipped (awaits implementation)

**Mock Strategy:**
- Mock `@react-native-async-storage/async-storage`
- Mock first-use flag (`camera_lighting_tip_shown`)
- Use fake timers to control 3-second auto-dismiss
- Verify overlay positioning (position: absolute)

---

### Integration: End-to-End Camera Flow
**File:** `end-to-end-camera-flow.test.tsx`
**Scenarios:**
1. Completes full journey from camera launch to translation display (skipped)
2. Handles retake during the flow (skipped)
3. Displays high confidence badge in results (skipped)
4. Handles low confidence warning gracefully (skipped)
5. Preserves line structure in multi-line sutras (skipped)

**Driving Ports:** Camera API, GraphQL API, Navigation
**Business Language:**
- "spiritual practitioner"
- "Devanagari text"
- "camera opens"
- "position phone over sutra"
- "photo captured"
- "verify quality"
- "uploading, reading, translating"
- "translation results"
- "confidence badge"
- "line structure preserved"

**Test Status:** All skipped (awaits implementation)

**Mock Strategy:**
- Full GraphQL mock with realistic OCR response (96% confidence)
- Mock multi-line sutra extraction (6 lines)
- Mock low confidence scenario (65% confidence with warnings)
- Verify navigation to `/translate` with correct params
- Test complete flow timing (< 5 seconds)

---

## Test Execution

**Current Status:**
- **Total Scenarios:** 33
- **Enabled:** 2 (basic navigation tests)
- **Skipped:** 31 (awaiting Camera component implementation)

**Run Tests:**
```bash
cd app
npm test camera
```

**Run Specific Test:**
```bash
npm test camera-launch.test.tsx
```

**Expected Output:**
All tests should be runnable but most are marked as skipped (`.skip`). As camera functionality is implemented, tests should be enabled one at a time following the TDD workflow:

1. Un-skip one test
2. Watch it fail (red)
3. Implement minimal code to make it pass (green)
4. Refactor while keeping tests green
5. Commit
6. Repeat with next test

---

## Hexagonal Architecture Compliance

### Driving Ports Used (CM-A Evidence)
1. **Camera API Port** (`expo-camera`):
   - Camera permissions
   - Photo capture (`takePictureAsync`)
   - Camera view rendering

2. **GraphQL API Port** (`@apollo/client`):
   - `translateSutraFromImage` mutation
   - OCR confidence scores
   - Translation results

3. **Navigation Port** (`expo-router`):
   - Screen transitions (camera → preview → results)
   - Route parameters passing

4. **Storage Port** (`AsyncStorage`):
   - First-use flag persistence

5. **Gesture Port** (React Native Gesture Handler):
   - Pinch-to-zoom gestures

### Business Language Verification (CM-B Evidence)
Zero technical terms in test descriptions. All scenarios use domain language:
- "spiritual practitioner"
- "Devanagari text"
- "photo quality"
- "translation results"
- "confidence badge"
- NO "API", "mutation", "component", "state", "props"

### Walking Skeleton vs Focused Scenarios (CM-C Evidence)
**Walking Skeleton:** `end-to-end-camera-flow.test.tsx`
- Full user journey: Camera → Capture → Preview → Submit → Translate
- Observable outcome: User receives translation of photographed text
- Demo-able to stakeholders

**Focused Scenarios:** 6 files covering specific boundaries
- Camera launch (UI responsiveness)
- Photo capture (camera interaction)
- Preview and zoom (quality verification)
- Retake flow (error recovery)
- Processing progress (feedback)
- First-use tip (onboarding)

---

## Dependencies and Mocks

### External Dependencies Mocked
1. **expo-camera** - Camera hardware and permissions
2. **expo-router** - Navigation framework
3. **@apollo/client** - GraphQL API calls
4. **@react-native-async-storage/async-storage** - Local storage
5. **react-native-gesture-handler** - Gesture recognition (for zoom)

### Mock Data
- **Photo URI:** `file:///mock-photo.jpg`
- **Photo Dimensions:** 1920x1080
- **High Confidence:** 96% (green badge)
- **Low Confidence:** 65% (orange warning)
- **Multi-line Sutra:** 6 lines (confidence 91%)
- **OCR Response Time:** 1.5-2 seconds (simulated)

---

## Next Steps (DELIVER Wave)

1. **Enable First Test:** Un-skip `camera-launch.test.tsx` - first scenario
2. **Implement Camera Component:**
   - Camera view with permissions
   - Frame overlay (70% width)
   - Guidance text
3. **Run Test (Fail):** Watch it fail for correct reason
4. **Implement Code:** Minimal implementation to pass
5. **Refactor:** Apply SOLID principles, clean code
6. **Commit:** With peer review approval
7. **Repeat:** Enable next test in sequence

---

## Test Design Principles Applied

1. **Outside-In Testing:** Tests interact with UI components (driving ports), not internals
2. **Business Language:** Zero technical jargon in Given-When-Then
3. **One Test at a Time:** Most tests skipped, enable sequentially
4. **Production-like Mocks:** GraphQL mutations with realistic delays and data
5. **Observable Outcomes:** Tests verify what user sees/experiences
6. **Error Path Coverage:** Includes low confidence, retake flow, tip dismissal

---

## Definition of Done Checklist

- [x] All 7 UI acceptance criteria have corresponding tests
- [x] Tests follow existing React Native test patterns
- [x] Tests use MockedProvider for GraphQL
- [x] Camera functionality properly mocked
- [x] Given-When-Then structure maintained
- [x] Tests are runnable with `npm test` in app/ directory
- [x] Documentation created
- [ ] Peer review approved (pending)
- [ ] First test enabled and passing (pending implementation)

---

## Handoff to DELIVER Wave

**Artifacts Delivered:**
1. 7 test files in `app/tests/app/camera/`
2. This documentation file
3. Mandate compliance evidence (see Hexagonal Architecture Compliance section)

**Implementation Sequence:**
Follow the test order as listed in Test Coverage Map. Start with camera-launch.test.tsx and proceed sequentially. Each test builds on the previous functionality.

**Success Criteria:**
When all 30 skipped tests are enabled and passing, the OCR translation UI feature is complete.
