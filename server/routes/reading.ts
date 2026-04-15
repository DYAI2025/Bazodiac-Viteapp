/**
 * POST /api/reading
 *
 * Validates birth data, calls FuFirE endpoints in parallel, strips results
 * to teaser (≤30% of full reading), stores session, returns { teaser, reading_hash }.
 *
 * FuFirE calls per person (parallel):
 * 1. POST /experience/bootstrap → sun_sign, moon_sign, ascendant, signature_blueprint
 * 2. POST /calculate/bazi       → four pillars, year animal, day_master
 * 3. POST /calculate/wuxing     → element balance, dominant_element
 *
 * DEC-fufire-bootstrap, DEC-teaser-server-strip, REQ-F-reading-generation, REQ-F-teaser-preview
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireVars } from '../config.js';
import { createSession } from '../sessionStore.js';
import { HttpError } from '../errorHandler.js';
import { callAllEndpoints, type PersonReading } from '../fufire.js';
import { pick, ELEMENT_DE_TO_EN } from '../utils.js';
import type { ReadingRequest, TeaserReading, PersonTeaser } from '../../src/types/reading.js';

export const readingRouter = Router();

// ── Validation ────────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validateBirthData(data: unknown, fieldPath: string): void {
  if (!data || typeof data !== 'object') {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath} is required`);
  }
  const d = data as Record<string, unknown>;

  if (typeof d.date !== 'string' || !ISO_DATE_RE.test(d.date)) {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath}.date must be YYYY-MM-DD`);
  }
  if (typeof d.birth_time_known !== 'boolean') {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath}.birth_time_known must be a boolean`);
  }
  if (d.birth_time_known && (typeof d.time !== 'string' || !TIME_RE.test(d.time as string))) {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath}.time must be HH:MM when birth_time_known is true`);
  }
  if (!d.birth_time_known && d.time !== undefined) {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath}.time must not be set when birth_time_known is false`);
  }
  if (typeof d.timezone !== 'string' || d.timezone.length === 0) {
    throw new HttpError(400, 'INVALID_INPUT', `${fieldPath}.timezone must be a non-empty IANA timezone`);
  }
}

// ── Teaser strip (DEC-teaser-server-strip) ────────────────────────────────────

/**
 * Verified field paths (2026-04-15):
 *
 * bootstrap.profile: { sun_sign, moon_sign, ascendant_sign, day_master, harmony_index }
 * bootstrap.signature_blueprint: { seed (hash, not text), elements, visual }
 * bazi.chinese: { day_master, hour_master, month_master, year: { animal, branch, stem } }
 * bazi.pillars: { year/month/day/hour: { stamm, zweig, tier, element } }
 * wuxing: { wu_xing_vector: { Holz, Feuer, Erde, Metall, Wasser }, dominant_element }
 *
 * Nakshatra: NOT in FuFirE — field renamed to ascendant (uses ascendant_sign).
 */
function toPersonTeaser(data: PersonReading): PersonTeaser {
  const { bootstrap, bazi, wuxing } = data;

  // Sun sign: bootstrap.profile.sun_sign (verified)
  const sun_sign =
    pick(bootstrap.profile, 'sun_sign') ?? 'Unknown';

  // Chinese year animal: bazi.chinese.year.animal, fallback to pillars.year.tier (German)
  const chinese_year_animal =
    pick(bazi, 'chinese', 'year', 'animal') ??
    bazi.pillars?.year?.tier ??
    'Unknown';

  // Ascendant (rising sign) from bootstrap profile
  const ascendant =
    pick(bootstrap.profile, 'ascendant_sign') ?? 'Unknown';

  // Element summary: from wuxing endpoint (verified)
  const rawElement = wuxing.dominant_element ?? 'Unknown';
  const engElement = ELEMENT_DE_TO_EN[rawElement] ?? rawElement;
  const maxScore = wuxing.wu_xing_vector
    ? Math.max(...Object.values(wuxing.wu_xing_vector))
    : 0;
  const total = wuxing.wu_xing_vector
    ? Object.values(wuxing.wu_xing_vector).reduce((a, b) => a + b, 0)
    : 1;
  const pct = total > 0 ? Math.round((maxScore / total) * 100) : 0;
  const element_summary = `${engElement} dominant (${pct}%)`;

  // Preview text: no narrative field in bootstrap — seed is a hash (sig_v1_...), not text
  const preview_text = 'Your reading is ready — unlock to see the full analysis.';

  return { sun_sign, chinese_year_animal, ascendant, element_summary, preview_text };
}

// ── Route handler ─────────────────────────────────────────────────────────────

readingRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireVars(['fufireApiKey', 'fufireBaseUrl'], 'POST /api/reading');

    const body = req.body as ReadingRequest;

    if (body?.mode !== 'character' && body?.mode !== 'partnership') {
      throw new HttpError(400, 'INVALID_INPUT', 'mode must be "character" or "partnership"');
    }

    validateBirthData(body.birth_data, 'birth_data');

    if (body.mode === 'partnership') {
      if (!body.partner_birth_data) {
        throw new HttpError(400, 'INVALID_INPUT', 'partner_birth_data is required for partnership mode');
      }
      validateBirthData(body.partner_birth_data, 'partner_birth_data');
    } else if (body.partner_birth_data !== undefined) {
      throw new HttpError(400, 'INVALID_INPUT', 'partner_birth_data must not be set for character mode');
    }

    // Call FuFirE: 3 endpoints per person, all in parallel
    let subjectData: PersonReading;
    let partnerData: PersonReading | undefined;

    if (body.mode === 'partnership') {
      [subjectData, partnerData] = await Promise.all([
        callAllEndpoints(body.birth_data),
        callAllEndpoints(body.partner_birth_data!),
      ]);
    } else {
      subjectData = await callAllEndpoints(body.birth_data);
    }

    const teaser: TeaserReading = {
      mode: body.mode,
      subject: toPersonTeaser(subjectData),
      ...(partnerData ? { partner: toPersonTeaser(partnerData) } : {}),
    };

    const reading_hash = createSession(body.mode, body.birth_data, body.partner_birth_data);

    res.json({ teaser, reading_hash });
  } catch (err) {
    next(err);
  }
});
