import type { AuthClient } from 'google-auth-library';

/**
 * Port for obtaining a GCP auth client.
 *
 * Implement this interface to support different authentication strategies
 * without coupling core code to any specific deployment environment.
 * Returns undefined to signal that the underlying client should fall back
 * to Application Default Credentials.
 */
export interface GcpAuthClientProvider {
  createAuthClient(): Promise<AuthClient | undefined>;
}

/**
 * GCP auth provider that relies on Application Default Credentials.
 *
 * Suitable for local development via `gcloud auth application-default login`
 * or any environment where ADC is already configured.
 */
export class DefaultGcpAuthClientProvider implements GcpAuthClientProvider {
  async createAuthClient(): Promise<AuthClient | undefined> {
    return undefined;
  }
}
