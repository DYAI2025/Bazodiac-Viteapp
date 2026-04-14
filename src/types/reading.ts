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
  nakshatra: string;           // e.g. "Rohini"
  element_summary: string;     // e.g. "Fire dominant (64%)"
  preview_text: string;        // one-paragraph teaser narrative from bootstrap
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
  // Western astrology
  sun_sign: string;
  moon_sign: string;
  ascendant: string;
  dominant_planets: string[];

  // BaZi (Four Pillars of Destiny)
  four_pillars: FourPillars;
  day_master: string;       // e.g. "Yang Wood"
  element_balance: ElementBalance;

  // Vedic / Nakshatra
  nakshatra: string;        // birth star
  nakshatra_lord: string;   // ruling planet

  // Tri-system fusion narrative
  soulprint_sectors: SoulprintSector[];
  signature_blueprint: string; // full narrative — the core product text
}

export interface FourPillars {
  year:  { stem: string; branch: string; animal: string };
  month: { stem: string; branch: string };
  day:   { stem: string; branch: string };
  hour?: { stem: string; branch: string }; // absent when birth_time_known = false
}

export interface ElementBalance {
  wood:  number; // 0.0–1.0 (fractional share)
  fire:  number;
  earth: number;
  metal: number;
  water: number;
}

export interface SoulprintSector {
  name:        string; // e.g. "Identity", "Relationships", "Purpose"
  score:       number; // 0–100
  description: string; // narrative paragraph for this sector
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
