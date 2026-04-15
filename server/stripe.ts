/**
 * Shared Stripe client — lazy singleton, reused across checkout and unlock routes.
 */

import Stripe from 'stripe';
import { config } from './config.js';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(config.stripeSecretKey!);
  }
  return _stripe;
}
