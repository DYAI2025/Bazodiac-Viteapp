import { HttpError } from './errorHandler.js';

/**
 * Environment variable configuration with startup validation.
 *
 * Phase 1 vars (required now): PORT (auto-injected by Railway)
 * Phase 2+ vars (required when features are used): validated lazily per route
 *
 * Any missing Phase 2+ var is warned at startup so operators are aware,
 * but the server still starts — Phase 1 only needs health + static serving.
 */

interface Config {
  port: number;
  // Phase 2+
  fufireApiKey: string | undefined;
  fufireBaseUrl: string | undefined;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  stripePriceId: string | undefined;
  publicUrl: string | undefined;
}

const PHASE2_VARS: Array<{ env: string; description: string }> = [
  { env: 'FUFIRE_API_KEY', description: 'FuFirE API authentication key (required for /api/reading)' },
  { env: 'FUFIRE_BASE_URL', description: 'FuFirE base URL (required for /api/reading)' },
  { env: 'STRIPE_SECRET_KEY', description: 'Stripe secret key (required for /api/checkout)' },
  { env: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook signing secret (required for /api/webhooks/stripe)' },
  { env: 'STRIPE_PRICE_ID', description: 'Stripe price ID for reading product (required for /api/checkout)' },
  { env: 'PUBLIC_URL', description: 'Public domain for Stripe success/cancel URLs (required for /api/checkout)' },
];

function validateConfig(): Config {
  const missing: string[] = [];

  for (const { env, description } of PHASE2_VARS) {
    if (!process.env[env]) {
      missing.push(`  ${env}: ${description}`);
    }
  }

  if (missing.length > 0) {
    console.warn(
      '[config] Phase 2+ environment variables not set (server starts but affected routes will fail):\n' +
        missing.join('\n')
    );
  }

  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    fufireApiKey: process.env.FUFIRE_API_KEY,
    fufireBaseUrl: process.env.FUFIRE_BASE_URL,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceId: process.env.STRIPE_PRICE_ID,
    publicUrl: process.env.PUBLIC_URL,
  };
}

/**
 * Asserts that a set of required vars are configured for a specific feature.
 * Throws a descriptive error if any are missing — call at the top of route handlers.
 */
export function requireVars(vars: Array<keyof Config>, featureName: string): void {
  const missing = vars.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new HttpError(
      503,
      'SERVICE_UNAVAILABLE',
      `${featureName} is not available — server configuration incomplete`
    );
  }
}

export const config = validateConfig();
