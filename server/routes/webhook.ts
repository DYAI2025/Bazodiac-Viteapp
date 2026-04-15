/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events with signature validation.
 * Requires raw body (Buffer) — must NOT use express.json() on this route.
 *
 * Handled events:
 * - checkout.session.completed → marks session as paid (via sessionStore.markPaid)
 *
 * All events return 200 { received: true } — Stripe requires acknowledgment.
 *
 * REQ-SEC-data-protection (webhook signature validation)
 */

import { Router, type Request, type Response } from 'express';
import { config, requireVars } from '../config.js';
import { getStripe } from '../stripe.js';
import { markPaid } from '../sessionStore.js';

export const webhookRouter = Router();

webhookRouter.post('/', (req: Request, res: Response) => {
  try {
    requireVars(['stripeSecretKey', 'stripeWebhookSecret'], 'POST /api/webhooks/stripe');
  } catch (err) {
    res.status(503).json({ error: 'Webhook endpoint not configured', code: 'SERVICE_UNAVAILABLE' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header', code: 'INVALID_SIGNATURE' });
    return;
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,  // raw Buffer — express.raw() middleware
      sig,
      config.stripeWebhookSecret!
    );
  } catch (err) {
    console.error('[webhook] Signature validation failed:', err instanceof Error ? err.message : String(err));
    res.status(400).json({ error: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' });
    return;
  }

  // Handle specific events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stripeSessionId = session.id;
    const readingHash = markPaid(stripeSessionId);
    if (readingHash) {
      console.log(`[webhook] Payment confirmed for reading ${readingHash}`);
    } else {
      console.warn(`[webhook] checkout.session.completed for unknown session ${stripeSessionId}`);
    }
  }

  // Always acknowledge — Stripe retries on non-2xx
  res.json({ received: true });
});
