import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OcrEngine, OcrResult, OcrOptions } from '../domain/ocr-engine';
import {
  OcrError,
  OcrAuthenticationError,
  OcrRateLimitError,
  OcrServiceUnavailableError,
  OcrInvalidImageError,
} from '../domain/ocr-errors';

const GRPC_UNKNOWN = 2;
const GRPC_INVALID_ARGUMENT = 3;
const GRPC_UNAUTHENTICATED = 16;
const GRPC_RESOURCE_EXHAUSTED = 8;
const GRPC_UNAVAILABLE = 14;

const CREDENTIAL_ERROR_PATTERN = /getting metadata from plugin failed|invalid_grant|invalid credentials/i;

/**
 * Shape of a Vision API page from documentTextDetection response.
 */
interface VisionPage {
  confidence?: number;
}

/**
 * Shape of the fullTextAnnotation portion of a Vision API response.
 */
interface VisionFullTextAnnotation {
  text?: string;
  pages?: VisionPage[];
}

/**
 * Shape of individual text annotations returned by the Vision API.
 */
interface VisionTextAnnotation {
  locale?: string;
}

/**
 * Vision API response body for documentTextDetection.
 */
interface VisionResponse {
  fullTextAnnotation?: VisionFullTextAnnotation;
  textAnnotations?: VisionTextAnnotation[];
}

/**
 * Request payload for the Vision API documentTextDetection call.
 */
interface VisionRequest {
  image: { content: string };
  imageContext: { languageHints: string[] };
}

/**
 * Minimal contract for the Vision API client used by this adapter.
 *
 * Defined as a local interface so tests can inject stubs without
 * depending on the @google-cloud/vision package.
 */
export interface VisionClient {
  documentTextDetection(request: VisionRequest): Promise<[VisionResponse]>;
}

/**
 * Google Cloud service account credentials.
 *
 * Matches the shape accepted by @google-cloud/vision ImageAnnotatorClient.
 */
export interface GoogleCredentials {
  client_email: string;
  private_key: string;
  [key: string]: unknown;
}

/**
 * Configuration options for GoogleVisionOcrEngine.
 *
 * Credential resolution order:
 * 1. `credentials` — explicit service account object
 * 2. `keyFilename` — path to a service account JSON file
 * 3. Application Default Credentials (ADC) when neither is provided
 */
export interface GoogleVisionOcrEngineOptions {
  /** Path to a service account key file. */
  keyFilename?: string;
  /** Explicit service account credentials. */
  credentials?: GoogleCredentials;
}

/**
 * OCR adapter that uses Google Cloud Vision to extract text from images.
 *
 * Implements the OcrEngine port using the Vision documentTextDetection API.
 * Accepts an optional VisionClient for testing without real API calls.
 */
export class GoogleVisionOcrEngine implements OcrEngine {
  private readonly client: VisionClient;

  /**
   * Creates a new GoogleVisionOcrEngine.
   *
   * @param options - Credentials options (uses ADC when omitted)
   * @param client - Optional Vision client; used by tests to inject stubs
   */
  constructor(options: GoogleVisionOcrEngineOptions = {}, client?: VisionClient) {
    this.client = client ?? this.createVisionClient(options);
  }

  /**
   * Creates the real @google-cloud/vision ImageAnnotatorClient.
   *
   * Not exercised in tests — tests inject a stub client directly.
   * Uses ADC when no credentials are provided (recommended for production).
   */
  private createVisionClient(options: GoogleVisionOcrEngineOptions): VisionClient {
    return new ImageAnnotatorClient(options) as unknown as VisionClient;
  }

  /**
   * Extracts text from an image buffer using Google Cloud Vision.
   *
   * @param imageBuffer - Binary image data
   * @param options - OCR options including language hints
   * @returns Extracted text, confidence score, and detected language
   */
  async extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult> {
    const request = this.buildRequest(imageBuffer, options);
    try {
      const [response] = await this.client.documentTextDetection(request);
      return this.mapResponse(response);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Maps a Vision API error to a domain OcrError subtype.
   *
   * Uses the gRPC status code on the error object. Falls back to OcrError
   * for any unrecognised code, preserving the original error as `cause`.
   */
  private mapError(error: unknown): OcrError {
    const code = (error as { code?: number }).code;
    const cause = { cause: error instanceof Error ? error : new Error(String(error)) };
    const message = cause.cause.message;

    switch (code) {
      case GRPC_UNAUTHENTICATED:
        return new OcrAuthenticationError(`Vision API authentication failed: ${message}`, cause);
      case GRPC_UNKNOWN:
        if (CREDENTIAL_ERROR_PATTERN.test(message)) {
          return new OcrAuthenticationError(`Vision API authentication failed: ${message}`, cause);
        }
        return new OcrError(`Vision API error: ${message}`, 'OcrError', cause);
      case GRPC_RESOURCE_EXHAUSTED:
        return new OcrRateLimitError(`Vision API rate limit exceeded: ${message}`, cause);
      case GRPC_UNAVAILABLE:
        return new OcrServiceUnavailableError(`Vision API temporarily unavailable: ${message}`, cause);
      case GRPC_INVALID_ARGUMENT:
        return new OcrInvalidImageError(message, cause);
      default:
        return new OcrError(`Vision API error: ${message}`, 'OcrError', cause);
    }
  }

  /**
   * Builds the Vision API request from the image buffer and options.
   *
   * Encodes the image as base64 and forwards language hints to imageContext.
   */
  private buildRequest(imageBuffer: Buffer, options?: OcrOptions): VisionRequest {
    return {
      image: { content: imageBuffer.toString('base64') },
      imageContext: { languageHints: options?.languageHints ?? [] },
    };
  }

  /**
   * Maps a Vision API response to the OcrResult domain type.
   *
   * TODO: AC3 — extract language from textAnnotations[0].locale
   * TODO: AC6 — normalise confidence to [0.0, 1.0]
   */
  private mapResponse(response: VisionResponse): OcrResult {
    const text = response.fullTextAnnotation?.text ?? '';
    const confidence = response.fullTextAnnotation?.pages?.[0]?.confidence ?? 0.0;
    return { text, confidence };
  }
}
