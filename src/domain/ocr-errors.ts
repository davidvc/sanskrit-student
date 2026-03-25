/**
 * Base error for all OCR adapter failures.
 *
 * Wraps underlying vendor errors so callers depend only on domain types.
 * Subclasses pass their name to the base constructor to avoid repeating
 * the `this.name = '...'` assignment in every class.
 */
export class OcrError extends Error {
  constructor(message: string, name = 'OcrError', options?: ErrorOptions) {
    super(message, options);
    this.name = name;
  }
}

/**
 * Thrown when the OCR service rejects the provided credentials.
 *
 * Maps to gRPC UNAUTHENTICATED (16) or HTTP 401.
 */
export class OcrAuthenticationError extends OcrError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'OcrAuthenticationError', options);
  }
}

/**
 * Thrown when the OCR service rate limit is exceeded.
 *
 * Maps to gRPC RESOURCE_EXHAUSTED (8) or HTTP 429.
 */
export class OcrRateLimitError extends OcrError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'OcrRateLimitError', options);
  }
}

/**
 * Thrown when the OCR service is temporarily unavailable.
 *
 * Maps to gRPC UNAVAILABLE (14) or HTTP 503.
 */
export class OcrServiceUnavailableError extends OcrError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'OcrServiceUnavailableError', options);
  }
}

/**
 * Thrown when the OCR service rejects the supplied image.
 *
 * Maps to gRPC INVALID_ARGUMENT (3) for image payload errors.
 */
export class OcrInvalidImageError extends OcrError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'OcrInvalidImageError', options);
  }
}
