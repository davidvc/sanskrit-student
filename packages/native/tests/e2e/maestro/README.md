# Sanskrit Student — Maestro E2E Test Suite

End-to-end UI tests for the Sanskrit Student native app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. **Install Maestro:**
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Build and install the app** on an iOS Simulator or Android Emulator:
   ```bash
   # iOS Simulator
   cd packages/native
   npx expo run:ios

   # Android Emulator
   cd packages/native
   npx expo run:android
   ```

3. **Authenticate with GCP** (required for OCR in Journeys 2):
   ```bash
   gcloud auth application-default login
   ```

4. **Start the backend** (the tests run against the real backend):
   ```bash
   # From the project root
   npm run dev
   ```

## Running the Tests

### Run the full suite (recommended)

From the project root, use the helper script which handles GCP auth and starts the backend automatically:

```bash
./packages/native/tests/e2e/maestro/run-e2e.sh
```

### Run a single flow manually
```bash
maestro test packages/native/tests/e2e/maestro/journey-1-text-translation.yaml
maestro test packages/native/tests/e2e/maestro/journey-2-camera-ocr-happy-path.yaml
maestro test packages/native/tests/e2e/maestro/journey-3-camera-ocr-retake.yaml
```

## Flows

| File | Journey | Description |
|------|---------|-------------|
| `journey-1-text-translation.yaml` | 1 | User types Sanskrit text and receives a full translation |
| `journey-2-camera-ocr-happy-path.yaml` | 2 | User photographs Devanagari text and receives a translation |
| `journey-3-camera-ocr-retake.yaml` | 3 | User retakes a photo and camera state is fully reset |

## Notes

- **Camera permission**: Journeys 2 and 3 use `permissions: { camera: allow }` in `launchApp` to pre-grant camera access, bypassing the system dialog.
- **Backend**: Journeys 1 and 2 require a running backend (`npm run dev`). Journey 3 only exercises the retake path and does not call the backend.
- **GCP auth**: Journey 2 uses Google Vision OCR. Run `gcloud auth application-default login` before starting the backend.
- **Test isolation**: Each flow launches the app with `clearState: true` to ensure a clean starting state.
- **Simulator camera**: On iOS Simulator, the camera captures a simulated still image. On Android Emulator, a virtual scene is used.
