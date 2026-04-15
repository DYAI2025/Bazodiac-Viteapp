/**
 * GET /api/reading/unlock?session_id=cs_...
 *
 * Verifies Stripe payment, retrieves stored birth data, calls FuFirE for
 * the full (unstripped) reading, and returns it.
 *
 * REQ-F-reading-unlock, DEC-teaser-server-strip
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireVars } from '../config.js';
import { getSession } from '../sessionStore.js';
import { HttpError } from '../errorHandler.js';
import { getStripe } from '../stripe.js';
import { callAllEndpoints, type PersonReading } from '../fufire.js';
import { pick, pickNum } from '../utils.js';
import type { FullReading, PersonProfile } from '../../src/types/reading.js';

export const unlockRouter = Router();

function toPersonProfile(data: PersonReading): PersonProfile {
  const { bootstrap, bazi, wuxing } = data;

  // Western (from bootstrap.profile)
  const sun_sign = pick(bootstrap.profile, 'sun_sign') ?? 'Unknown';
  const moon_sign = pick(bootstrap.profile, 'moon_sign') ?? 'Unknown';
  const ascendant = pick(bootstrap.profile, 'ascendant_sign') ?? 'Unknown';

  // BaZi (from bazi endpoint)
  const day_master =
    pick(bazi, 'chinese', 'day_master') ??
    pick(bootstrap.profile, 'day_master') ??
    'Unknown';
  const chinese_year_animal =
    pick(bazi, 'chinese', 'year', 'animal') ??
    bazi.pillars?.year?.tier ??
    'Unknown';

  const four_pillars = {
    year: bazi.pillars.year,
    month: bazi.pillars.month,
    day: bazi.pillars.day,
    ...(bazi.pillars.hour ? { hour: bazi.pillars.hour } : {}),
  };

  // Wu-Xing element balance (map German keys to English)
  const element_balance = {
    wood:  wuxing.wu_xing_vector?.Holz ?? 0,
    fire:  wuxing.wu_xing_vector?.Feuer ?? 0,
    earth: wuxing.wu_xing_vector?.Erde ?? 0,
    metal: wuxing.wu_xing_vector?.Metall ?? 0,
    water: wuxing.wu_xing_vector?.Wasser ?? 0,
  };

  // Fusion (from bootstrap)
  const harmony_index = pickNum(bootstrap.profile, 'harmony_index') ?? 0;
  const soulprint_sectors = bootstrap.soulprint_sectors ?? [];
  const signature_seed = pick(bootstrap.signature_blueprint, 'seed') ?? '';

  return {
    sun_sign,
    moon_sign,
    ascendant,
    four_pillars,
    day_master,
    chinese_year_animal,
    element_balance,
    harmony_index,
    soulprint_sectors,
    signature_seed,
  };
}

unlockRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireVars(['stripeSecretKey', 'fufireApiKey', 'fufireBaseUrl'], 'GET /api/reading/unlock');

    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      throw new HttpError(400, 'INVALID_INPUT', 'session_id query parameter is required (format: cs_...)');
    }

    // 1. Verify Stripe payment
    const stripe = getStripe();
    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      console.error('[stripe] Session retrieval failed:', err instanceof Error ? err.message : String(err));
      throw new HttpError(404, 'SESSION_NOT_FOUND', 'Stripe session not found');
    }

    if (stripeSession.payment_status !== 'paid') {
      throw new HttpError(402, 'PAYMENT_REQUIRED', 'Payment has not been completed');
    }

    // 2. Look up reading session from Stripe metadata
    const readingHash = stripeSession.metadata?.reading_hash;
    if (!readingHash) {
      throw new HttpError(404, 'SESSION_NOT_FOUND', 'No reading associated with this payment');
    }

    const session = getSession(readingHash);
    if (!session) {
      throw new HttpError(410, 'SESSION_EXPIRED', 'Reading session has expired — please generate a new reading');
    }

    // 3. Call FuFirE for full reading (no stripping — DEC-teaser-server-strip only applies to teaser)
    let subjectData: PersonReading;
    let partnerData: PersonReading | undefined;

    if (session.mode === 'partnership' && session.partner_birth_data) {
      [subjectData, partnerData] = await Promise.all([
        callAllEndpoints(session.birth_data),
        callAllEndpoints(session.partner_birth_data),
      ]);
    } else {
      subjectData = await callAllEndpoints(session.birth_data);
    }

    // 4. Build full reading
    const full_reading: FullReading = {
      mode: session.mode,
      subject: toPersonProfile(subjectData),
      ...(partnerData ? { partner: toPersonProfile(partnerData) } : {}),
    };

    res.json({ full_reading });
  } catch (err) {
    next(err);
  }
});
