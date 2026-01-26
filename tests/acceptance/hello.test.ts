import { describe, it, expect } from 'vitest';
import { hello } from '../../src/domain/hello';

/**
 * Acceptance tests for the hello world function.
 */
describe('Hello world function', () => {
  it('should return "Hello, World!" when called with no arguments', () => {
    expect(hello()).toBe('Hello, World!');
  });

  it('should return personalized greeting when called with a name', () => {
    expect(hello('Sanskrit')).toBe('Hello, Sanskrit!');
  });
});
