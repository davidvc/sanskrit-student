# High-Level Design: Photo Cropping Before OCR Upload

## Overview

Add an interactive crop step to the native camera flow. After taking a photo, the user sees a crop overlay on the preview and can drag/resize a rectangle to select the region of text they want to translate. Only the cropped region is uploaded to the OCR service.

**Feature Goal:** Reduce noise in OCR input by letting users select just the Sanskrit text region, improving accuracy and speed.

---

## User Flow (Updated)

**Before:**
```
Take Photo → Preview (Retake / Use This Photo) → Upload full image → OCR
```

**After:**
```
Take Photo → Preview + Crop Overlay (Retake / Translate) → Crop image locally → Upload cropped region → OCR
```

The "Use This Photo" button becomes **"Translate"**. The crop overlay appears immediately on the preview.

---

## Architecture

### Hexagonal boundary

Image cropping is a device capability (like the camera itself). It belongs in the adapter layer.

```
camera.tsx (orchestrator)
    │
    ├── CropOverlay (UI component — pure presentation)
    │
    └── imageCropper.ts (port + adapter)
            └── expo-image-manipulator (external dependency)
```

### New components

#### `CropOverlay` (`packages/native/components/camera/CropOverlay.tsx`)

A pure UI component that renders a draggable, resizable crop rectangle over the photo preview.

**Props:**
```typescript
interface CropOverlayProps {
  containerWidth: number;   // display dimensions (px)
  containerHeight: number;
  cropRegion: CropRegion;   // current region in display px
  onCropChange: (region: CropRegion) => void;
}

interface CropRegion {
  x: number;      // left edge (display px)
  y: number;      // top edge (display px)
  width: number;  // width (display px)
  height: number; // height (display px)
}
```

**Behaviour:**
- Darkened mask outside the crop rectangle
- 4 corner drag handles for resizing (minimum size: 100×100 display px)
- Drag anywhere inside the rectangle to move it (pan gesture)
- Constrained to image bounds
- Uses `react-native-gesture-handler` (already installed) for gestures
- Uses `react-native-reanimated` (already installed) for smooth animation

**Default region:** centred rectangle, 80% of the smaller dimension on each axis.

#### `imageCropper.ts` (`packages/native/utils/imageCropper.ts`)

Port interface + Expo adapter for cropping an image.

```typescript
// Port
export interface ImageCropperPort {
  crop(uri: string, region: CropRegion, imageSize: ImageSize): Promise<string>;
}

export interface ImageSize {
  width: number;   // actual image pixels
  height: number;
}

// Adapter
export class ExpoImageCropperAdapter implements ImageCropperPort {
  // Converts display-space CropRegion to image-space coordinates,
  // then calls expo-image-manipulator.manipulateAsync()
}
```

**Coordinate conversion:**
```
imageX = (displayX / containerWidth)  * imageWidth
imageY = (displayY / containerHeight) * imageHeight
imageW = (displayW / containerWidth)  * imageWidth
imageH = (displayH / containerHeight) * imageHeight
```

### Modified components

#### `camera.tsx`

**New state:**
```typescript
const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
```

**Updated photo preview block:**
- Replace inline `<Image>` with `<Image onLayout onLoad>` to capture display and actual dimensions
- Overlay `<CropOverlay>` on top of the preview image
- Rename button label from "Use This Photo" to "Translate"

**Updated `handleUsePhoto` → `handleTranslate`:**
```
1. Compute display container size (from onLayout)
2. Get actual image size (from Image.getSize or onLoad)
3. Call ExpoImageCropperAdapter.crop(photoUri, cropRegion, imageSize)
4. Use croppedUri in place of photoUri for upload
```

**Retake path:** unchanged — clears `photoUri`, `cropRegion`, `imageSize`.

---

## New dependency

| Package | Purpose | Why this one |
|---|---|---|
| `expo-image-manipulator` | Client-side image crop | Official Expo package; ships as part of Expo SDK; no extra native setup required; works on both iOS and Android |

---

## Data flow

```
takePictureAsync()
    → photoUri (full image)
    → user adjusts CropOverlay
    → "Translate" tapped
    → ExpoImageCropperAdapter.crop(photoUri, cropRegion, imageSize)
        → expo-image-manipulator.manipulateAsync(uri, [{crop: {...}}])
        → croppedUri (temp file)
    → convertPhotoToFile(croppedUri)  ← existing utility, unchanged
    → translateSutraFromImage({ image: file })  ← existing mutation, unchanged
```

No backend changes required. The server receives a smaller image and produces results faster.

---

## Key design decisions

### 1. Crop on device, not server

Cropping is applied locally before upload. This keeps the server simple (it already accepts any image), avoids transmitting unnecessary pixel data, and gives immediate feedback.

**Alternative considered:** Send full image + crop coordinates to server, crop server-side.
**Rejected:** Requires backend API change, more data transfer, more complexity.

### 2. Display-space coordinates in state

`CropRegion` stores display pixel values (not normalised 0–1 fractions). This matches what gesture handlers naturally produce and simplifies the `CropOverlay` component. Conversion to image-space coordinates happens once, at crop time.

**Alternative considered:** Normalised (0–1) coordinates throughout.
**Rejected:** Requires more arithmetic in the gesture handler with no benefit.

### 3. Crop overlay integrated into preview, not a separate screen

The crop rectangle appears immediately on the photo preview. No additional navigation step.

**Alternative considered:** Separate "crop screen" pushed onto the navigation stack.
**Rejected:** Unnecessary navigation complexity for a lightweight interaction.

### 4. Corner handles only (not edge handles)

4 corner handles are sufficient and keep the touch targets large. Edge handles add complexity and are harder to hit accurately on small screens.

---

## Component structure (after this change)

```
packages/native/
├── app/
│   └── camera.tsx                    [MODIFY]
├── components/camera/
│   ├── CropOverlay.tsx               [NEW]
│   ├── PhotoPreview.tsx              [UNCHANGED — not used by camera.tsx]
│   ├── LightingTip.tsx               [UNCHANGED]
│   └── ProgressView.tsx              [UNCHANGED]
└── utils/
    ├── imageCropper.ts               [NEW]
    └── photoConverter.ts             [UNCHANGED]
```

> Note: `PhotoPreview.tsx` already exists in the components folder but is not referenced by `camera.tsx`. This design leaves it untouched.

---

## Acceptance criteria mapping

| AC | Implementation |
|---|---|
| User can drag/resize crop rectangle after capture | `CropOverlay` with pan gestures on corners and interior |
| Default to reasonable region | `useState` initialised to centred 80% rectangle |
| "Translate" sends only cropped region | `handleTranslate` calls `ExpoImageCropperAdapter.crop()` before upload |
| Retake works without cropping | "Retake" clears `photoUri` — unchanged path |
| Works on iOS and Android | `expo-image-manipulator` + `react-native-gesture-handler` both cross-platform |

---

## Testing approach

Acceptance tests will:
- Render the camera screen with a mock photo URI
- Verify the crop overlay is visible and responds to gesture simulation
- Verify `translateSutraFromImage` is called with a different (cropped) URI
- Stub `expo-image-manipulator` to avoid actual image processing in tests
- Verify retake clears the photo without calling the mutation

---

## Status

**READY FOR REVIEW**
