/**
 * Shared TypeScript types for the Bazodiac reading flow.
 *
 * Types here are used by both the SPA (src/) and the BFF (server/).
 * The BFF imports these directly; the SPA receives the data via API responses.
 *
 * BFF-only types (SessionEntry, raw FuFirE BootstrapResponse) live in server/types.ts.
 */

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * User-supplied birth information.
 * Used within a single request cycle only — never persisted or logged.
 * REQ-F-birth-data-input, REQ-SEC-data-protection
 */
export interface BirthData {
  date: string;              // ISO 8601: "YYYY-MM-DD"
  time?: string;             // "HH:MM" (24h) — omitted when birth time is unknown
  birth_time_known: boolean; // sent to FuFirE — controls hour pillar calculation
  timezone: string;          // IANA timezone: e.g. "Europe/Berlin"
  lat?: number;              // decimal degrees — improves BaZi accuracy (optional)
  lon?: number;              // decimal degrees
}

/**
 * Body of POST /api/reading.
 * REQ-F-birth-data-input
 */
export interface ReadingRequest {
  mode: 'character' | 'partnership';
  birth_data: BirthData;
  partner_birth_data?: BirthData; // required when mode = "partnership"
}

// ── Teaser Reading (≤30% of full) ────────────────────────────────────────────

/**
 * Returned by POST /api/reading.
 * At most 30% of the full reading content. REQ-F-teaser-preview.
 * See DEC-teaser-server-strip.
 */
export interface TeaserReading {
  mode: 'character' | 'partnership';
  subject: PersonTeaser;
  partner?: PersonTeaser; // present when mode = "partnership"
}

export interface PersonTeaser {
  sun_sign: string;            // e.g. "Scorpio"
  chinese_year_animal: string; // e.g. "Year of the Dragon"
  ascendant: string;           // e.g. "Scorpio" (rising sign from bootstrap)
  element_summary: string;     // e.g. "Fire dominant (64%)"
  preview_text: string;        // teaser narrative
}

// ── Full Reading ──────────────────────────────────────────────────────────────

/**
 * Returned by GET /api/reading/unlock after verified payment.
 * REQ-F-reading-generation, REQ-F-reading-unlock.
 */
export interface FullReading {
  mode: 'character' | 'partnership';
  subject: PersonProfile;
  partner?: PersonProfile; // present when mode = "partnership"
}

export interface PersonProfile {
  // Western astrology (from /experience/bootstrap profile)
  sun_sign: string;
  moon_sign: string;
  ascendant: string;

  // BaZi (from /calculate/bazi)
  four_pillars: FourPillars;
  day_master: string;
  chinese_year_animal: string;
  element_balance: ElementBalance;

  // Fusion (from /experience/bootstrap)
  harmony_index: number;
  soulprint_sectors: number[];  // 12 numeric values
  signature_seed: string;       // signature_blueprint.seed hash
}

export interface FourPillars {
  year:  { stamm: string; zweig: string; tier: string; element: string };
  month: { stamm: string; zweig: string; element: string };
  day:   { stamm: string; zweig: string; element: string };
  hour?: { stamm: string; zweig: string; element: string };
}

export interface ElementBalance {
  wood:  number; // 0.0–1.0 (fractional share)
  fire:  number;
  earth: number;
  metal: number;
  water: number;
}

// ── Checkout ─────────────────────────────────────────────────────────────────

/**
 * Body of POST /api/checkout.
 * REQ-F-payment-integration
 */
export interface CheckoutRequest {
  reading_hash: string; // opaque token from POST /api/reading response
  locale: 'de' | 'en'; // used to set Stripe Checkout locale
}

/**
 * Response of POST /api/checkout.
 */
export interface CheckoutResponse {
  checkout_url: string; // Stripe-hosted Checkout page URL
}

// ── API response wrapper ──────────────────────────────────────────────────────

/**
 * Response of POST /api/reading.
 */
export interface ReadingResponse {
  teaser: TeaserReading;
  reading_hash: string; // opaque token for checkout and unlock
}
