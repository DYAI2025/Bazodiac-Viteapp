/**
 * BFF-only types — never sent to the SPA client.
 *
 * SessionEntry: in-memory session store entry.
 * FuFirE API types: verified against actual endpoints 2026-04-14.
 */

import type { BirthData } from '../src/types/reading.js';

// ── Session Store ─────────────────────────────────────────────────────────────

export interface SessionEntry {
  reading_hash: string;
  mode: 'character' | 'partnership';
  birth_data: BirthData;
  partner_birth_data?: BirthData;
  created_at: number;
  stripe_session_id?: string;
  paid: boolean;
}

// ── FuFirE API ────────────────────────────────────────────────────────────────

/**
 * Flat request format used by /calculate/bazi, /calculate/wuxing, /calculate/fusion.
 * Fields: date, time, lat, lon, timezone.
 */
export interface FufireCalculateRequest {
  date: string;       // "YYYY-MM-DD"
  time: string;       // "HH:MM"
  lat: number;
  lon: number;
  timezone: string;   // IANA timezone
}

/**
 * Nested request format used by /experience/bootstrap.
 * Fields wrapped in birth object; time must be HH:MM:SS; tz not timezone.
 */
export interface FufireBootstrapRequest {
  birth: {
    date: string;       // "YYYY-MM-DD"
    time: string;       // "HH:MM:SS"
    tz: string;         // IANA timezone (NOT "timezone")
    lat: number;
    lon: number;
    place_label?: string;
  };
  locale?: string;
}

/**
 * POST /calculate/bazi response.
 * Pillars (year/month/day/hour) with Stamm, Zweig, Tier, Element.
 */
export interface FufireBaziResponse {
  pillars: {
    year:  { stamm: string; zweig: string; tier: string; element: string };
    month: { stamm: string; zweig: string; tier: string; element: string };
    day:   { stamm: string; zweig: string; tier: string; element: string };
    hour?: { stamm: string; zweig: string; tier: string; element: string };
  };
  chinese: {
    day_master: string;
    hour_master: string;
    month_master: string;
    year: { animal: string; branch: string; stem: string };
  };
  transition: {
    is_before_lichun: boolean;
    solar_year: number;
  };
  [key: string]: unknown;
}

/**
 * POST /calculate/wuxing response.
 * Weighted element scores and dominant element.
 */
export interface FufireWuxingResponse {
  wu_xing_vector: {
    Holz: number;
    Feuer: number;
    Erde: number;
    Metall: number;
    Wasser: number;
  };
  dominant_element: string; // e.g. "Holz"
  contribution_ledger?: {
    western?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * POST /experience/bootstrap response.
 * Compact profile with western astrology, harmony, soulprint, narrative.
 */
export interface FufireBootstrapResponse {
  profile: Record<string, unknown>;
  soulprint_sectors: number[];        // 12 numeric values
  signature_blueprint: Record<string, unknown>;
  meta: Record<string, unknown>;
}
