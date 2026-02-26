import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import Camera from '../../../app/camera';

// Mock AsyncStorage for first-use flag persistence
jest.mock('@react-native-async-storage/async-storage', () => {
  const { jest } = require('@jest/globals');
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  };
});

// Get reference to the mocked functions
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const mockGetItem = AsyncStorage.getItem;
const mockSetItem = AsyncStorage.setItem;

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID="camera-view" {...props}>{children}</View>;
  },
  CameraView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID="camera-view" {...props}>{children}</View>;
  },
  useCameraPermissions: jest.fn(() => [
    { status: 'granted', granted: true },
    jest.fn(),
  ]),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Scenario: Show lighting tip on first use', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays lighting tip on first camera launch', async () => {
    // GIVEN: I am using the app for the first time
    // AND: I have never seen the lighting tip before
    mockGetItem.mockResolvedValue(null); // First-use flag not set

    // WHEN: I tap "Take Photo" to launch the camera
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // THEN: I should see a tip message
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // Verify the tip contains expected content
    const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
    expect(tipMessage).toHaveTextContent(/use bright, even lighting for best results/i);
  });

  it('automatically dismisses lighting tip after 3 seconds', async () => {
    // GIVEN: I am using the app for the first time
    mockGetItem.mockResolvedValue(null);

    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the tip displays
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // AND: 3 seconds pass
    jest.advanceTimersByTime(3000);

    // THEN: the tip should disappear automatically
    await waitFor(() => {
      expect(screen.queryByText(/💡 tip.*bright.*even lighting/i)).toBeNull();
    });
  });

  it('sets first-use flag after displaying tip', async () => {
    // GIVEN: I am using the app for the first time
    mockGetItem.mockResolvedValue(null);

    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the tip displays
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // THEN: the first-use flag should be set in storage
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        'camera_lighting_tip_shown',
        'true'
      );
    });
  });

  it('does not show lighting tip on subsequent uses', async () => {
    // GIVEN: I use the app a second time
    // AND: the first-use flag is set
    mockGetItem.mockResolvedValue('true');

    // WHEN: I tap "Take Photo"
    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // THEN: I should NOT see the lighting tip again
    await waitFor(() => {
      const cameraView = screen.getByTestId('camera-view');
      expect(cameraView).toBeTruthy();
    });

    expect(screen.queryByText(/💡 tip.*bright.*even lighting/i)).toBeNull();
  });

  it('tip does not interfere with camera functionality', async () => {
    // GIVEN: I am using the app for the first time
    mockGetItem.mockResolvedValue(null);

    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the tip is displayed
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // THEN: I should still be able to use the camera
    const cameraView = screen.getByTestId('camera-view');
    expect(cameraView).toBeTruthy();

    const shutterButton = screen.getByTestId('shutter-button');
    expect(shutterButton).toBeTruthy();
    expect(shutterButton).not.toHaveAccessibilityState({ disabled: true });
  });

  it('tip displays as overlay, not blocking camera view', async () => {
    // GIVEN: I am using the app for the first time
    mockGetItem.mockResolvedValue(null);

    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the tip is displayed
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // THEN: the tip should be positioned as an overlay
    const tipContainer = screen.getByTestId('lighting-tip-container');
    expect(tipContainer).toBeTruthy();

    // Verify tip doesn't block camera view
    const cameraView = screen.getByTestId('camera-view');
    expect(cameraView).toBeTruthy();

    // Tip should have overlay styling (e.g., positioned absolutely)
    expect(tipContainer).toHaveStyle({ position: 'absolute' });
  });

  it('can manually dismiss tip before 3 seconds', async () => {
    // GIVEN: I am using the app for the first time
    mockGetItem.mockResolvedValue(null);

    render(
      <MockedProvider mocks={[]}>
        <Camera />
      </MockedProvider>
    );

    // WHEN: the tip is displayed
    await waitFor(() => {
      const tipMessage = screen.getByText(/💡 tip.*bright.*even lighting/i);
      expect(tipMessage).toBeTruthy();
    });

    // AND: I tap the dismiss button
    const dismissButton = screen.getByTestId('dismiss-tip-button');
    fireEvent.press(dismissButton);

    // THEN: the tip should disappear immediately
    await waitFor(() => {
      expect(screen.queryByText(/💡 tip.*bright.*even lighting/i)).toBeNull();
    });

    // AND: advancing time should not cause tip to reappear (timer was cancelled)
    jest.advanceTimersByTime(3000);

    // Tip should still be absent after timer would have fired
    expect(screen.queryByText(/💡 tip.*bright.*even lighting/i)).toBeNull();
  });
});
