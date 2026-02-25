# UI Tests (Deferred to DELIVER Wave)

**Feature:** Camera OCR Translation for Sanskrit Study
**Wave:** DISTILL (Acceptance Test Design)
**Date:** 2026-02-25
**Status:** DOCUMENTED - Awaiting UI framework implementation

---

## Overview

The following 7 acceptance criteria require UI implementation and cannot be tested at the API layer. These will be implemented during the DELIVER wave once the UI framework (React, camera API, mobile components) is in place.

**Backend API Tests:** 13/20 AC (65%) - Implemented in `tests/acceptance/ocr-translation/`
**UI Component Tests:** 7/20 AC (35%) - Deferred, documented here

---

## Camera UI Tests (AC-1 to AC-5)

These scenarios test the mobile camera interaction flow.

### AC-1: Launch Camera from Home Screen

```gherkin
Scenario: User taps "Take Photo" and camera opens quickly
  Given I am a spiritual practitioner studying a Sanskrit book
  And I encounter Devanagari text I cannot read
  When I open the Sanskrit Student app
  Then I should see a "Take Photo" button prominently displayed

  When I tap the "Take Photo" button
  Then the device camera should open within 1 second
  And I should see a landscape frame overlay (70% screen width)
  And I should see guidance text: "Best results: photograph 2-6 lines"
```

**Test Type:** UI Component Test (React Native camera component)
**Test Location:** `tests/ui/ocr-translation/camera-launch.test.tsx`
**Dependencies:**
- React Native camera library
- Mobile device or simulator

**Test Implementation:**
```typescript
// Example test structure (not implemented yet)
it('should open camera within 1 second when user taps Take Photo button', async () => {
  render(<HomePage />);

  const takePhotoButton = screen.getByText('Take Photo');
  expect(takePhotoButton).toBeVisible();

  const startTime = Date.now();
  fireEvent.press(takePhotoButton);

  await waitFor(() => {
    expect(screen.getByTestId('camera-view')).toBeVisible();
  });

  const elapsedTime = Date.now() - startTime;
  expect(elapsedTime).toBeLessThan(1000); // < 1 second

  expect(screen.getByTestId('landscape-frame-overlay')).toBeVisible();
  expect(screen.getByText('Best results: photograph 2-6 lines')).toBeVisible();
});
```

---

### AC-2: Capture Photo with Manual Shutter

```gherkin
Scenario: User captures photo and sees preview
  Given the camera is open
  And I have positioned my phone over a 4-line Devanagari sutra
  When I tap the shutter button
  Then a photo should be captured
  And I should immediately see a preview of the captured photo
```

**Test Type:** UI Component Test (camera capture flow)
**Test Location:** `tests/ui/ocr-translation/photo-capture.test.tsx`

---

### AC-3: Preview Photo and Verify Quality

```gherkin
Scenario: User previews photo and verifies quality
  Given I have captured a photo
  When the preview displays
  Then I should see the captured photo
  And I should see the prompt: "Is the text clear and in focus?"
  And I should see two buttons: "Use This Photo" and "Retake"

  When I pinch-to-zoom on the preview
  Then the preview should zoom in for detailed inspection
  And I can verify the Devanagari text is sharp and readable
```

**Test Type:** UI Component Test (photo preview with pinch-to-zoom)
**Test Location:** `tests/ui/ocr-translation/photo-preview.test.tsx`

---

### AC-4: Retake Photo if Quality is Poor

```gherkin
Scenario: User retakes photo when quality is poor
  Given I am viewing the photo preview
  And I notice the photo is blurry
  When I tap the "Retake" button
  Then I should return to the camera view
  And I should still see the frame overlay and guidance
  And my previous session should not be lost
```

**Test Type:** UI Component Test (retake flow)
**Test Location:** `tests/ui/ocr-translation/photo-retake.test.tsx`

---

### AC-5: Submit Clear Photo for Processing

```gherkin
Scenario: User submits photo for processing
  Given I am viewing the photo preview
  And the photo appears clear and focused
  When I tap "Use This Photo"
  Then the photo should be submitted for OCR processing
  And I should immediately see "Uploading image..." progress message
```

**Test Type:** UI Component Test (photo submission)
**Test Location:** `tests/ui/ocr-translation/photo-submit.test.tsx`

---

## Visual Verification UI (AC-8)

### AC-8: Display Side-by-Side Comparison

```gherkin
Scenario: User verifies extraction with side-by-side comparison
  Given OCR extraction has completed
  When the results page displays
  Then I should see a side-by-side comparison:
    | Left Column         | Right Column            |
    | Original Photo      | Extracted Devanagari    |
    | (thumbnail, tappable) | (text, copyable)      |

  When I tap the original photo thumbnail
  Then the photo should expand to full-screen
  And I can pinch-to-zoom for detailed inspection

  When I tap the extracted Devanagari text
  Then it should be copied to my clipboard
  And I should see "Copied!" confirmation
```

**Test Type:** UI Component Test (visual verification component)
**Test Location:** `tests/ui/ocr-translation/visual-verification.test.tsx`

**Test Implementation:**
```typescript
// Example test structure (not implemented yet)
it('should display side-by-side comparison of original photo and extracted text', async () => {
  const mockResult = {
    extractedText: 'सत्यमेव जयते',
    iastText: ['satyameva jayate'],
    ocrConfidence: 0.96,
  };

  render(<ResultsPage result={mockResult} originalPhoto={mockPhotoBlob} />);

  // Verify side-by-side layout
  const leftColumn = screen.getByTestId('original-photo-thumbnail');
  const rightColumn = screen.getByTestId('extracted-devanagari-text');

  expect(leftColumn).toBeVisible();
  expect(rightColumn).toBeVisible();
  expect(rightColumn).toHaveTextContent('सत्यमेव जयते');
});

it('should expand photo to full-screen when thumbnail tapped', async () => {
  render(<ResultsPage result={mockResult} originalPhoto={mockPhotoBlob} />);

  const thumbnail = screen.getByTestId('original-photo-thumbnail');
  fireEvent.press(thumbnail);

  await waitFor(() => {
    expect(screen.getByTestId('full-screen-photo-view')).toBeVisible();
  });

  // Verify pinch-to-zoom enabled
  const photoView = screen.getByTestId('full-screen-photo-view');
  expect(photoView).toHaveProp('pinchEnabled', true);
});

it('should copy extracted text to clipboard when tapped', async () => {
  render(<ResultsPage result={mockResult} originalPhoto={mockPhotoBlob} />);

  const extractedText = screen.getByTestId('extracted-devanagari-text');
  fireEvent.press(extractedText);

  await waitFor(() => {
    expect(screen.getByText('Copied!')).toBeVisible();
  });

  const clipboardContent = await Clipboard.getString();
  expect(clipboardContent).toBe('सत्यमेव जयते');
});
```

---

## Progress Feedback UI (AC-14)

### AC-14: Show Processing Progress Messages

```gherkin
Scenario: User sees progress indicators during processing
  Given I have submitted a photo for processing
  When upload begins
  Then I should see "Uploading image..." with a progress indicator

  When OCR begins
  Then I should see "Reading Devanagari text..."

  When translation begins
  Then I should see "Translating..."

  When all processing completes
  Then total time should be under 5 seconds
```

**Test Type:** UI Component Test (progress indicators)
**Test Location:** `tests/ui/ocr-translation/progress-feedback.test.tsx`

**Test Implementation:**
```typescript
// Example test structure (not implemented yet)
it('should display sequential progress messages during translation', async () => {
  render(<TranslationFlow imageFile={mockImageFile} />);

  // Step 1: Uploading
  expect(screen.getByText('Uploading image...')).toBeVisible();
  expect(screen.getByTestId('progress-spinner')).toBeVisible();

  // Step 2: OCR
  await waitFor(() => {
    expect(screen.getByText('Reading Devanagari text...')).toBeVisible();
  });

  // Step 3: Translating
  await waitFor(() => {
    expect(screen.getByText('Translating...')).toBeVisible();
  });

  // Step 4: Complete
  await waitFor(() => {
    expect(screen.getByTestId('translation-result')).toBeVisible();
  });

  // Verify total time < 5 seconds
  const totalTime = Date.now() - startTime;
  expect(totalTime).toBeLessThan(5000);
});
```

---

## First-Use Tip UI (AC-17)

### AC-17: Show Lighting Tip on First Use

```gherkin
Scenario: User sees lighting tip on first camera launch
  Given I am using the app for the first time
  And I have never seen the lighting tip before
  When I tap "Take Photo" to launch the camera
  Then I should see a tip message:
    """
    💡 Tip: Use bright, even lighting for best results
    """
  And the tip should display for 3 seconds
  And then disappear automatically

  Given I use the app a second time
  When I tap "Take Photo"
  Then I should NOT see the lighting tip again
```

**Test Type:** UI Component Test (first-use tip with persistence)
**Test Location:** `tests/ui/ocr-translation/first-use-tip.test.tsx`

**Test Implementation:**
```typescript
// Example test structure (not implemented yet)
it('should show lighting tip on first use only', async () => {
  // Mock AsyncStorage to simulate first use
  AsyncStorage.getItem.mockResolvedValue(null); // No previous use

  render(<CameraView />);

  // Verify tip appears
  expect(screen.getByText(/Tip: Use bright, even lighting/)).toBeVisible();

  // Wait 3 seconds
  await waitFor(() => {
    expect(screen.queryByText(/Tip: Use bright, even lighting/)).not.toBeVisible();
  }, { timeout: 3500 });

  // Verify tip was marked as shown
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('lightingTipShown', 'true');
});

it('should NOT show lighting tip on subsequent uses', async () => {
  // Mock AsyncStorage to simulate previous use
  AsyncStorage.getItem.mockResolvedValue('true'); // Tip already shown

  render(<CameraView />);

  // Verify tip does NOT appear
  expect(screen.queryByText(/Tip: Use bright, even lighting/)).not.toBeVisible();
});
```

---

## Implementation Checklist

### Prerequisites for UI Tests

- [ ] React Native setup complete
- [ ] Camera library integrated (`react-native-camera` or `expo-camera`)
- [ ] Clipboard API integrated
- [ ] AsyncStorage for persistence
- [ ] Mobile testing framework (Jest + React Native Testing Library)
- [ ] Device simulator or physical device for testing

### Test Files to Create

- [ ] `tests/ui/ocr-translation/camera-launch.test.tsx`
- [ ] `tests/ui/ocr-translation/photo-capture.test.tsx`
- [ ] `tests/ui/ocr-translation/photo-preview.test.tsx`
- [ ] `tests/ui/ocr-translation/photo-retake.test.tsx`
- [ ] `tests/ui/ocr-translation/photo-submit.test.tsx`
- [ ] `tests/ui/ocr-translation/visual-verification.test.tsx`
- [ ] `tests/ui/ocr-translation/progress-feedback.test.tsx`
- [ ] `tests/ui/ocr-translation/first-use-tip.test.tsx`

### UI Components to Implement

- [ ] `<CameraView>` - Camera with frame overlay and guidance
- [ ] `<PhotoPreview>` - Preview with pinch-to-zoom and Use/Retake buttons
- [ ] `<VisualVerification>` - Side-by-side comparison component
- [ ] `<ProgressIndicator>` - Sequential progress messages
- [ ] `<FirstUseTip>` - Auto-dismissing tip with persistence

---

## Coverage Summary

**Total Acceptance Criteria:** 20
**Backend API Tests:** 13 (65%) - Implemented
**UI Component Tests:** 7 (35%) - Documented, awaiting UI framework

**Deferred UI Tests:**
- AC-1: Camera launch (1 test)
- AC-2: Photo capture (1 test)
- AC-3: Photo preview (1 test)
- AC-4: Photo retake (1 test)
- AC-5: Photo submit (1 test)
- AC-8: Visual verification (3 tests)
- AC-14: Progress feedback (1 test)
- AC-17: First-use tip (2 tests)

**Total Deferred UI Tests:** 11 test cases

---

## Next Steps

1. ✅ Backend API tests implemented (13 scenarios)
2. ⏳ UI framework selection (React Native vs Expo)
3. ⏳ Camera library integration
4. ⏳ UI component implementation
5. ⏳ UI test implementation (11 test cases)

**Status:** ✅ DOCUMENTED - Ready for UI implementation in DELIVER wave
