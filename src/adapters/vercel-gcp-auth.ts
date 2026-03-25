import fs from 'fs';
import { ExternalAccountClient } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';
import type { GcpAuthClientProvider } from './gcp-auth-client-provider';

const AUDIENCE =
  '//iam.googleapis.com/projects/540202192085/locations/global/workloadIdentityPools/sanskrit-scholar/providers/vercel';

const SERVICE_ACCOUNT_IMPERSONATION_URL =
  'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/sanskrit-scholar@gen-lang-client-0138876090.iam.gserviceaccount.com:generateAccessToken';

const SUBJECT_TOKEN_PATH = '/tmp/vercel-oidc-token';

/**
 * GCP auth provider for Vercel deployments.
 *
 * Exchanges Vercel's OIDC token for short-lived GCP credentials via
 * Workload Identity Federation with service account impersonation.
 * Swap this out for a different GcpAuthClientProvider when moving
 * away from Vercel.
 */
export class VercelGcpAuthClientProvider implements GcpAuthClientProvider {
  async createAuthClient() {
    const token = await getVercelOidcToken();
    fs.writeFileSync(SUBJECT_TOKEN_PATH, token);

    const client = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: AUDIENCE,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: SERVICE_ACCOUNT_IMPERSONATION_URL,
      credential_source: {
        file: SUBJECT_TOKEN_PATH,
      },
    });

    if (!client) {
      throw new Error('Failed to create GCP external account auth client');
    }

    return client;
  }
}
