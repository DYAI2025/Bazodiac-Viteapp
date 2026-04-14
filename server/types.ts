/**
 * BFF-only types — never sent to the SPA client.
 *
 * SessionEntry: in-memory session store entry.
 * FufireBootstrapRequest/Response: verified against FuFirE OpenAPI spec 2026-04-14.
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
 * Verified request shape from openapi.json BirthInput schema.
 * All birth fields are required; time must be HH:MM:SS.
 */
export interface FufireBootstrapRequest {
  birth: {
    date: string;          // "YYYY-MM-DD"
    time: string;          // "HH:MM:SS" — required; use "12:00:00" when unknown
    tz: string;            // IANA timezone
    lat: number;           // decimal degrees (required)
    lon: number;           // decimal degrees (required)
    place_label?: string;
  };
  locale?: string;         // default "de-DE"
}

/**
 * Raw response from POST /v1/experience/bootstrap.
 * The exact shape of profile/signature_blueprint is resolved at runtime
 * (spec truncated). We cast loosely and extract what we need.
 */
export interface FufireBootstrapResponse {
  profile: Record<string, unknown>;
  soulprint_sectors: number[];   // 12 numeric values
  signature_blueprint: Record<string, unknown>;
  meta: Record<string, unknown>;
}
