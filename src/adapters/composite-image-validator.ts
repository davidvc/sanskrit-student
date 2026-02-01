import { ImageValidator } from '../domain/image-validator';

/**
 * Composite image validator that tries multiple validators.
 *
 * Validates an image buffer by trying each registered validator until one succeeds.
 * This allows validating multiple image formats with a single validator instance.
 */
export class CompositeImageValidator implements ImageValidator {
  constructor(private validators: ImageValidator[]) {}

  validate(buffer: Buffer): boolean {
    return this.validators.some((validator) => validator.validate(buffer));
  }
}
