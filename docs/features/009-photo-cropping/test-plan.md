# Test Plan: Photo Cropping Before OCR Upload

## Scope

Two acceptance tests covering the regressions most likely to break silently:

1. Coordinate conversion correctness
2. Crop-before-upload pipeline integrity

Visual appearance and gesture feel are verified by manual testing on device.

---

## Test 1: Coordinate Conversion

**File:** `packages/native/utils/imageCropper.test.ts`

**What it protects against:** Math bugs in the display→image-space conversion that would silently crop the wrong region.

### Cases

| Scenario | Display container | Image dimensions | Crop region (display px) | Expected crop (image px) |
|---|---|---|---|---|
| 4× scale factor | 300×400 | 1200×1600 | `{x:30, y:40, w:120, h:160}` | `{x:120, y:160, w:480, h:640}` |
| Non-square scale (wider image) | 400×300 | 2000×900 | `{x:80, y:60, w:200, h:150}` | `{x:400, y:180, w:1000, h:450}` |
| Full-image crop | 300×400 | 1200×1600 | `{x:0, y:0, w:300, h:400}` | `{x:0, y:0, w:1200, h:1600}` |
| Region at bottom-right corner | 300×400 | 1200×1600 | `{x:150, y:200, w:150, h:200}` | `{x:600, y:800, w:600, h:800}` |

### Structure

```
describe('ExpoImageCropperAdapter coordinate conversion')
  it('scales x, y, width, height by image/display ratio')
  it('handles non-square scale factors independently on each axis')
  it('maps a full-image crop to full image dimensions')
  it('correctly maps a region at the bottom-right corner')
```

No mocking needed — the conversion is a pure function extracted from the adapter.

---

## Test 2: Camera Flow — Crop Applied Before Upload

**File:** `packages/native/app/camera.test.tsx`

**What it protects against:** Any refactor that bypasses the crop step and uploads the full image instead of the cropped region.

### Setup (stubs)

| Dependency | Stub behaviour |
|---|---|
| `expo-camera` | `takePictureAsync` returns `{ uri: 'file://photo.jpg' }` |
| `expo-image-manipulator` | `manipulateAsync` returns `{ uri: 'file://cropped.jpg' }`, records call args |
| `translateSutraFromImage` mutation | Returns a minimal valid result, records the `image.uri` it was called with |
| `AsyncStorage` | No-op (suppress first-use tip) |

### Cases

#### AC1 — Translate uses cropped URI, not original

```
Given the camera screen is rendered
When the user takes a photo
Then the crop overlay is visible (testID="crop-overlay")
When the user taps "Translate"
Then manipulateAsync is called once with a crop action
And translateSutraFromImage is called with uri = 'file://cropped.jpg' (not 'file://photo.jpg')
```

#### AC2 — Crop region passed to manipulateAsync matches the displayed crop overlay

```
Given the camera screen is rendered and a photo has been taken
And the crop overlay reports a region of {x:30, y:40, width:120, height:160} in display px
And the image size is known as 1200×1600 with a 300×400 display container
When the user taps "Translate"
Then manipulateAsync is called with crop = {originX:120, originY:160, width:480, height:640}
```

#### AC3 — Retake clears state without triggering crop or upload

```
Given a photo has been taken and the crop overlay is visible
When the user taps "Retake"
Then manipulateAsync is NOT called
And translateSutraFromImage is NOT called
And the crop overlay is no longer visible
And the camera viewfinder is visible again
```

### Structure

```
describe('Camera screen — crop flow')
  it('uploads the cropped URI, not the original photo URI')
  it('passes the correct image-space crop coordinates to manipulateAsync')
  it('retake clears the photo without cropping or uploading')
```

---

## Out of scope (manual testing)

- Visual appearance of the crop overlay (mask, handle positions, colours)
- Gesture feel and responsiveness on iOS vs Android
- Minimum size enforcement during drag
- Boundary clamping when dragging near image edges
