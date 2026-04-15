/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for a reading. Looks up the session by
 * reading_hash, creates the checkout session, links it, and returns the URL.
 *
 * REQ-F-payment-integration, DEC-teaser-server-strip
 */

import Stripe from 'stripe';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { config, requireVars } from '../config.js';
import { getSession, linkStripeSession } from '../sessionStore.js';
import { HttpError } from '../errorHandler.js';
import type { CheckoutRequest } from '../../src/types/reading.js';

export const checkoutRouter = Router();

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(config.stripeSecretKey!);
  }
  return _stripe;
}

checkoutRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireVars(
      ['stripeSecretKey', 'stripePriceId', 'publicUrl'],
      'POST /api/checkout'
    );

    const body = req.body as CheckoutRequest;

    if (!body?.reading_hash || typeof body.reading_hash !== 'string') {
      throw new HttpError(400, 'INVALID_INPUT', 'reading_hash is required');
    }
    if (body.locale !== 'de' && body.locale !== 'en') {
      throw new HttpError(400, 'INVALID_INPUT', 'locale must be "de" or "en"');
    }

    const session = getSession(body.reading_hash);
    if (!session) {
      throw new HttpError(404, 'SESSION_NOT_FOUND', 'Reading session not found or expired');
    }

    const stripe = getStripe();

    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: config.stripePriceId!, quantity: 1 }],
        locale: body.locale,
        success_url: `${config.publicUrl}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.publicUrl}/`,
        metadata: { reading_hash: body.reading_hash },
      });
    } catch (err) {
      console.error('[stripe] Checkout session creation failed:', err instanceof Error ? err.message : String(err));
      throw new HttpError(502, 'STRIPE_ERROR', 'Could not create checkout session');
    }

    if (!checkoutSession.url) {
      throw new HttpError(502, 'STRIPE_ERROR', 'Stripe did not return a checkout URL');
    }

    linkStripeSession(body.reading_hash, checkoutSession.id);

    res.json({ checkout_url: checkoutSession.url });
  } catch (err) {
    next(err);
  }
});
