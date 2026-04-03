# Camera Screen Refactor — Design

*Issue: ss-drw*

---

## Problem

`packages/native/app/camera.tsx` is a 466-line god component. It manages **eight separate `useState` calls** and five distinct render branches, all handling different concerns interleaved in one file:

| Concern | State variables involved |
|---|---|
| Camera permission lifecycle | `permission` (from `useCameraPermissions`) |
| Photo capture | `photoUri`, `isCapturing`, `imageSize` |
| Crop region management | `cropRegion`, `containerSize` |
| First-use lighting tip | `showLightingTip`, `lightingTipTimerRef` |
| Progress + OCR mutation | `progressState`, `translateError` |
| Navigation | `router` |

The render function branches five ways:
1. Permission loading spinner
2. Permission denied / request view
3. Progress view (uploading / OCR / translating)
4. Photo preview with crop overlay
5. Live camera viewfinder

### Consequences

**Untestable in isolation.** To test any single behaviour you must render the entire camera screen, configure Apollo mocks, mock AsyncStorage, mock `expo-camera`, and control timers — all at once. There is no seam to test, say, the lighting tip logic without also dealing with camera permissions.

**Flaky tests from embedded timing.** `handleTranslate()` advances through progress states using artificial `setTimeout(100)` delays:

```typescript
setProgressState('uploading');
await new Promise(resolve => setTimeout(resolve, 100));
setProgressState('ocr');
await new Promise(resolve => setTimeout(resolve, 100));
setProgressState('translating');
const result = await translateSutraFromImage(...);
```

These delays interact badly with `jest.useFakeTimers()` and React's `act()` flushing. Three tests in `processing-progress.test.tsx` are currently `it.skip`-ped with the comment "disabled due to timing race condition". Two more tests in `photo-preview-zoom.test.tsx` are also skipped.

**Ghost components.** Three components were already extracted — `LightingTip.tsx`, `PhotoPreview.tsx`, and `ProgressView.tsx` — but are never imported by `camera.tsx`. The screen re-implements all that logic inline. The `PhotoPreview.tsx` component (which used Reanimated pinch-to-zoom) actually represents an earlier design that was replaced by the current crop-overlay approach; it is now stale and should be deleted.

---

## Goals

1. `camera.tsx` becomes a thin orchestrator: reads from hooks, renders components, ~80–100 lines
2. All business logic lives in focused, independently-testable hooks
3. The fake `setTimeout` progress simulation is removed — progress reflects the single real mutation in flight
4. The three orphaned components are either wired up (LightingTip, ProgressView) or deleted (PhotoPreview)
5. All currently-skipped tests can be unskipped and pass

---

## Proposed Design

### New file layout

```
packages/native/
├── app/
│   └── camera.tsx               ← thin orchestrator (~80 lines)
├── components/camera/
│   ├── CropOverlay.tsx           ← keep as-is
│   ├── LightingTip.tsx           ← keep as-is, wire up in camera.tsx
│   ├── ProgressView.tsx          ← keep as-is, wire up in camera.tsx
│   └── PhotoPreview.tsx          ← DELETE (stale Reanimated design)
└── hooks/
    ├── useLightingTip.ts         ← NEW
    ├── useCameraCapture.ts       ← NEW
    └── useOcrMutation.ts         ← NEW
```

---

### Hook 1: `useLightingTip`

**Responsibility:** AsyncStorage first-use check, auto-dismiss timer, manual dismiss.

```typescript
interface LightingTipState {
  visible: boolean;
  dismiss: () => void;
}

function useLightingTip(): LightingTipState
```

Internally:
- On mount: reads `camera_lighting_tip_shown` from AsyncStorage. If absent, sets `visible = true` and writes the flag.
- Starts a 3-second auto-dismiss timer. Clears it on unmount (or on manual dismiss).
- `dismiss()` clears the timer and sets `visible = false`.

This hook has zero dependencies on camera, Apollo, or navigation. It can be tested completely standalone with a mocked AsyncStorage and `jest.useFakeTimers()`.

---

### Hook 2: `useCameraCapture`

**Responsibility:** Camera ref lifecycle, shutter press, retake, crop region, container/image size tracking.

```typescript
interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

interface CropState {
  cropRegion: CropRegion | null;
  containerSize: ImageSize | null;
  imageSize: ImageSize | null;
  onContainerLayout: (event: LayoutChangeEvent) => void;
  onImageLoad: (event: ImageLoadEvent) => void;
  onCropChange: (region: CropRegion) => void;
}

interface CameraCapture {
  cameraRef: RefObject<CameraView>;
  photo: CapturedPhoto | null;
  isCapturing: boolean;
  cropState: CropState;
  capture: () => Promise<void>;
  retake: () => void;
}

function useCameraCapture(): CameraCapture
```

Internally:
- Holds `photoUri`, `isCapturing`, `cropRegion`, `containerSize`, `imageSize`
- `capture()` calls `cameraRef.current.takePictureAsync()` — no progress simulation, just sets `photoUri`
- `retake()` resets all state to null/idle
- `onContainerLayout` sets `containerSize` and initialises `cropRegion` to the default 80% centred rectangle
- `onImageLoad` sets `imageSize`

This hook can be tested without rendering a full camera view — pass a mock `cameraRef` and call `capture()`.

---

### Hook 3: `useOcrMutation`

**Responsibility:** Crop the photo if needed, fire the OCR mutation, track progress, navigate on success, expose error.

```typescript
type OcrProgressState = 'idle' | 'processing' | 'error';

interface OcrMutationState {
  progress: OcrProgressState;
  error: string | null;
  translate: (photo: CapturedPhoto, cropState: CropState) => Promise<void>;
}

function useOcrMutation(): OcrMutationState
```

Key design decision — **remove the fake `setTimeout` progress stages**. The server processes everything in a single round-trip; the UI pretending otherwise creates the timing problem that breaks tests. Replace the three fake stages with a single `processing` state that is active while the mutation is in flight:

```typescript
// Before (fake stages causing flaky tests)
setProgressState('uploading');
await delay(100);
setProgressState('ocr');
await delay(100);
setProgressState('translating');
const result = await translateSutraFromImage(...);

// After (honest single state)
setProgress('processing');
const result = await translateSutraFromImage(...);
```

`ProgressView` will display a single "Processing..." message while the mutation runs. This matches what the server actually does and eliminates the timing-sensitive code paths that break tests.

On success: calls `router.push('/translate', params)`. On error: sets `error` message and resets to `idle`.

This hook can be tested by mocking `useTranslateSutraFromImageMutation` and calling `translate()` directly.

---

### Refactored `camera.tsx`

With the three hooks in place, the screen becomes a thin orchestrator:

```typescript
export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const lightingTip = useLightingTip();
  const capture = useCameraCapture();
  const ocr = useOcrMutation();

  if (!permission) return <LoadingView />;
  if (!permission.granted) return <PermissionView onRequest={requestPermission} />;
  if (ocr.progress === 'processing') return <ProgressView progressState="translating" />;

  if (capture.photo) {
    return (
      <PhotoPreviewView
        photo={capture.photo}
        cropState={capture.cropState}
        error={ocr.error}
        onRetake={capture.retake}
        onTranslate={() => ocr.translate(capture.photo!, capture.cropState)}
      />
    );
  }

  return (
    <LiveCameraView
      cameraRef={capture.cameraRef}
      isCapturing={capture.isCapturing}
      onCapture={capture.capture}
      lightingTip={lightingTip}
    />
  );
}
```

`LoadingView`, `PermissionView`, `PhotoPreviewView`, and `LiveCameraView` can be inline in the file or extracted as small presentational components — they contain no logic, only JSX.

---

### Handling `PhotoPreview.tsx`

The existing `PhotoPreview.tsx` is stale. It was designed for a pinch-to-zoom photo review flow (using Reanimated `GestureDetector` + `Animated.Image`) that was superseded by the current crop-overlay approach. It does not match the current screen's interface (it takes `gesture` and `animatedStyle` props that nothing in the codebase provides). It should be deleted.

The current photo review UI — a static `<Image>` with `<CropOverlay>` on top — should remain as the `PhotoPreviewView` section of the refactored screen.

---

### Impact on Tests

After this refactor:

- `processing-progress.test.tsx`: The three skipped tests fail because they wait for intermediate progress messages (`"Reading Devanagari text..."`, `"Translating..."`) that are produced by the fake stages. With the fake stages removed, these tests need to be updated — they should assert that `"Processing..."` is shown while the mutation is in flight, which is testable without timing races.

- `photo-preview-zoom.test.tsx`: The three skipped pinch-to-zoom tests relate to the `PhotoPreview.tsx` Reanimated approach. Since that component is being deleted and the crop-overlay approach is the canonical design, these tests should be replaced with crop-overlay interaction tests.

- All other camera tests should continue to pass unchanged, since the public contract of the screen (`testID` attributes, user interactions) is preserved.

---

## What Is Not Changing

- The crop region logic and `CropOverlay.tsx` — these are not part of this problem
- The `ExpoImageCropperAdapter` — this is already correctly extracted
- The navigation call to `/translate` with params — that is a separate issue (ss-drw covers the god component only; the JSON URL param smell is tracked separately)
- The `ProgressView.tsx` and `LightingTip.tsx` components — these are already correct; the refactor just starts using them

---

## Acceptance Criteria

1. `camera.tsx` is ≤ 120 lines
2. No `useState` calls in `camera.tsx` — all state lives in hooks
3. `useLightingTip`, `useCameraCapture`, and `useOcrMutation` each have their own test files
4. No `setTimeout` delays remain in the OCR/translation flow
5. All previously-skipped tests are either passing or explicitly deleted with a replacement test covering the same behaviour
6. All currently-passing camera tests continue to pass
