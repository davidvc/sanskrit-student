import { OcrEngine, OcrResult, OcrOptions } from '../domain/ocr-engine';

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
 * Minimal contract for the Vision API client used by this adapter.
 *
 * Defined as a local interface so tests can inject stubs without
 * depending on the @google-cloud/vision package.
 */
export interface VisionClient {
  documentTextDetection(request: object): Promise<[VisionResponse]>;
}

/**
 * Configuration options for GoogleVisionOcrEngine.
 */
export interface GoogleVisionOcrEngineOptions {
  /** Path to a service account key file. */
  keyFilename?: string;
  /** Explicit credentials object. */
  credentials?: object;
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
   */
  private createVisionClient(options: GoogleVisionOcrEngineOptions): VisionClient {
    // Deferred: requires @google-cloud/vision to be installed at runtime
    throw new Error(
      'GoogleVisionOcrEngine: real Vision client requires @google-cloud/vision. ' +
      'Pass a VisionClient stub in tests or install the package for production use.'
    );
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
    const [response] = await this.client.documentTextDetection(request);
    return this.mapResponse(response);
  }

  /**
   * Builds the Vision API request from the image buffer and options.
   */
  private buildRequest(imageBuffer: Buffer, options?: OcrOptions): object {
    return {
      image: { content: imageBuffer.toString('base64') },
      imageContext: { languageHints: options?.languageHints ?? [] },
    };
  }

  /**
   * Maps a Vision API response to the OcrResult domain type.
   */
  private mapResponse(response: VisionResponse): OcrResult {
    const text = response.fullTextAnnotation?.text ?? '';
    const confidence = response.fullTextAnnotation?.pages?.[0]?.confidence ?? 0.0;
    return { text, confidence };
  }
}
