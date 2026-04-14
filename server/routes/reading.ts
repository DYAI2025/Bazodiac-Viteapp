/**
 * POST /api/reading
 *
 * Validates birth data, calls FuFirE /v1/experience/bootstrap, strips the
 * response to a teaser (≤30% of full reading), stores the session, and returns
 * { teaser, reading_hash }.
 *
 * For partnership mode, two sequential FuFirE calls are made and merged.
 * DEC-fufire-bootstrap, DEC-teaser-server-strip, REQ-F-reading-generation, REQ-F-teaser-preview
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { config, requireVars } from '../config.js';
import { createSession } from '../sessionStore.js';
import { HttpError } from '../errorHandler.js';
import type { ReadingRequest, TeaserReading, PersonTeaser } from '../../src/types/reading.js';
import type { FufireBootstrapRequest, FufireBootstrapResponse } from '../types.js';

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

// ── FuFirE API call ───────────────────────────────────────────────────────────

/**
 * Builds the FuFirE BootstrapRequest from our internal BirthData.
 *
 * Mapping notes (verified against openapi.json BirthInput schema 2026-04-14):
 * - All birth fields are REQUIRED by FuFirE (date, time, tz, lat, lon)
 * - time format is HH:MM:SS — default to "12:00:00" when birth time is unknown
 * - lat/lon default to 0.0 when user has not provided location
 */
function toBirthDataRequest(bd: ReadingRequest['birth_data'], locale?: string): FufireBootstrapRequest {
  // Convert "HH:MM" to "HH:MM:SS", or default to noon
  const timeStr = bd.birth_time_known && bd.time
    ? `${bd.time}:00`
    : '12:00:00';

  return {
    birth: {
      date: bd.date,
      time: timeStr,
      tz: bd.timezone,
      lat: bd.lat ?? 0.0,
      lon: bd.lon ?? 0.0,
      ...(bd.lat !== undefined && bd.lon !== undefined
        ? {}
        : { place_label: 'Unknown location' }),
    },
    locale: locale ?? 'de-DE',
  };
}

async function callFuFire(req: FufireBootstrapRequest): Promise<FufireBootstrapResponse> {
  const url = `${config.fufireBaseUrl}/v1/experience/bootstrap`;
  let res: globalThis.Response;

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.fufireApiKey!,
      },
      body: JSON.stringify(req),
    });
  } catch (err) {
    console.error('[fufire] Network error:', err instanceof Error ? err.message : String(err));
    throw new HttpError(502, 'FUFIRE_ERROR', 'FuFirE API unreachable');
  }

  if (res.status === 429) {
    throw new HttpError(429, 'RATE_LIMIT', 'Reading rate limit exceeded — please try again shortly');
  }

  if (!res.ok) {
    // Log the actual FuFirE error body so we can diagnose issues
    const errBody = await res.text().catch(() => '(unreadable)');
    console.error(`[fufire] HTTP ${res.status} error:`, errBody);
    throw new HttpError(502, 'FUFIRE_ERROR', 'FuFirE API returned an error');
  }

  const body = await res.json() as FufireBootstrapResponse;

  // Log top-level response keys once (debug — remove in production when shape is confirmed)
  console.log('[fufire] response keys:', Object.keys(body));

  return body;
}

// ── Teaser strip (DEC-teaser-server-strip) ────────────────────────────────────

/**
 * Extracts a safe string from a deeply nested unknown object.
 */
function pick(obj: unknown, ...path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function pickNum(obj: unknown, ...path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'number' ? cur : undefined;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Extracts a PersonTeaser from a FuFirE BootstrapResponse.
 *
 * NOTE: The exact ProfileSummary schema is not fully known (spec truncated).
 * We try multiple plausible field paths with fallbacks. Once a real response
 * is observed via server logs, update the paths here.
 *
 * Known from spec:
 * - soulprint_sectors: number[12]
 * - profile: unknown ProfileSummary
 * - signature_blueprint: unknown SignatureBlueprint
 */
function toPersonTeaser(raw: FufireBootstrapResponse): PersonTeaser {
  const p = raw.profile;
  const sb = raw.signature_blueprint;

  // Try common field paths for sun sign
  const sun_sign =
    pick(p, 'western', 'sun_sign') ??
    pick(p, 'sun_sign') ??
    pick(p, 'zodiac', 'sun_sign') ??
    pick(sb, 'sun_sign') ??
    'Unknown';

  // Chinese year animal
  const chinese_year_animal =
    pick(p, 'bazi', 'year_pillar', 'animal') ??
    pick(p, 'year_animal') ??
    pick(p, 'chinese', 'year_animal') ??
    pick(sb, 'year_animal') ??
    'Unknown';

  // Nakshatra
  const nakshatra =
    pick(p, 'vedic', 'nakshatra') ??
    pick(p, 'nakshatra') ??
    pick(sb, 'nakshatra') ??
    'Unknown';

  // Element summary — try to build from element_balance or use pre-formatted string
  const element_summary =
    pick(p, 'element_summary') ??
    pick(sb, 'element_summary') ??
    buildElementSummary(p) ??
    'Unknown';

  // Preview text — try several plausible locations
  const preview_text =
    pick(sb, 'preview_text') ??
    pick(sb, 'text') ??
    pick(sb, 'summary') ??
    pick(p, 'preview_text') ??
    pick(p, 'summary') ??
    'Your reading is ready — unlock to see the full analysis.';

  return { sun_sign, chinese_year_animal, nakshatra, element_summary, preview_text };
}

function buildElementSummary(profile: unknown): string | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  const p = profile as Record<string, unknown>;

  // Try bazi.element_balance
  const eb =
    (p['bazi'] as Record<string, unknown> | undefined)?.['element_balance'] ??
    p['element_balance'];

  if (!eb || typeof eb !== 'object') return undefined;

  const balance = eb as Record<string, unknown>;
  let maxVal = -Infinity;
  let maxKey = '';
  for (const [key, val] of Object.entries(balance)) {
    if (typeof val === 'number' && val > maxVal) {
      maxVal = val;
      maxKey = key;
    }
  }
  if (!maxKey) return undefined;
  return `${capitalize(maxKey)} dominant (${Math.round(maxVal * 100)}%)`;
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

    const subjectRaw = await callFuFire(toBirthDataRequest(body.birth_data));

    let partnerRaw: FufireBootstrapResponse | undefined;
    if (body.mode === 'partnership') {
      partnerRaw = await callFuFire(toBirthDataRequest(body.partner_birth_data!));
    }

    const teaser: TeaserReading = {
      mode: body.mode,
      subject: toPersonTeaser(subjectRaw),
      ...(partnerRaw ? { partner: toPersonTeaser(partnerRaw) } : {}),
    };

    const reading_hash = createSession(body.mode, body.birth_data, body.partner_birth_data);

    res.json({ teaser, reading_hash });
  } catch (err) {
    next(err);
  }
});
