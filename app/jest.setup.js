// Jest setup file for NativeWind compatibility
import '@testing-library/jest-native/extend-expect';

// Set environment variable to disable NativeWind CSS processing in Jest
process.env.NATIVEWIND_SKIP_BABEL = 'true';
