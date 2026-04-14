/**
 * In-memory session store.
 *
 * Associates an opaque reading_hash with the birth data needed to regenerate
 * the full reading after payment is confirmed.
 *
 * Design: module-level Map — no database, no external process, no cross-instance
 * sharing. Entries expire after 1 hour. Railway restarts = clean slate (acceptable
 * for Phase 1–3; revisit if multi-instance scaling is needed).
 *
 * DEC-no-database, REQ-F-reading-unlock, REQ-SEC-data-protection
 */

import { randomUUID } from 'crypto';
import { HttpError } from './errorHandler.js';
import type { SessionEntry } from './types.js';
import type { BirthData } from '../src/types/reading.js';

const SESSION_TTL_MS = 3_600_000; // 1 hour
const MAX_SESSIONS = 10_000;

const sessions = new Map<string, SessionEntry>();

/**
 * Removes all entries older than SESSION_TTL_MS.
 * Called on every write to avoid unbounded growth.
 */
function evictExpired(): void {
  const now = Date.now();
  for (const [hash, entry] of sessions) {
    if (now - entry.created_at > SESSION_TTL_MS) {
      sessions.delete(hash);
    }
  }
}

/**
 * Creates a new session entry and returns its opaque hash.
 */
export function createSession(
  mode: 'character' | 'partnership',
  birth_data: BirthData,
  partner_birth_data?: BirthData
): string {
  evictExpired();

  if (sessions.size >= MAX_SESSIONS) {
    throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'Server is at capacity — please try again later');
  }

  const reading_hash = randomUUID();
  const entry: SessionEntry = {
    reading_hash,
    mode,
    birth_data,
    partner_birth_data,
    created_at: Date.now(),
    paid: false,
  };

  sessions.set(reading_hash, entry);
  return reading_hash;
}

/**
 * Retrieves a session by hash. Returns undefined if not found or expired.
 */
export function getSession(reading_hash: string): SessionEntry | undefined {
  const entry = sessions.get(reading_hash);
  if (!entry) return undefined;

  if (Date.now() - entry.created_at > SESSION_TTL_MS) {
    sessions.delete(reading_hash);
    return undefined;
  }

  return entry;
}

/**
 * Links a Stripe Checkout Session ID to the reading session.
 * Returns false if the session does not exist or has expired.
 */
export function linkStripeSession(
  reading_hash: string,
  stripe_session_id: string
): boolean {
  const entry = getSession(reading_hash);
  if (!entry) return false;

  entry.stripe_session_id = stripe_session_id;
  return true;
}

/**
 * Marks a session as paid by Stripe Checkout Session ID.
 * Called from the webhook handler after `checkout.session.completed`.
 * Returns the reading_hash if found, undefined otherwise.
 */
export function markPaid(stripe_session_id: string): string | undefined {
  for (const [hash, entry] of sessions) {
    if (entry.stripe_session_id === stripe_session_id) {
      entry.paid = true;
      return hash;
    }
  }
  return undefined;
}
