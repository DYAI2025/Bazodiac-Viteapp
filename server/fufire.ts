/**
 * FuFirE API client — shared by reading and unlock routes.
 *
 * Calls 3 endpoints per person in parallel:
 * 1. POST /experience/bootstrap (nested birth format)
 * 2. POST /calculate/bazi (flat format)
 * 3. POST /calculate/wuxing (flat format)
 */

import { config } from './config.js';
import { HttpError } from './errorHandler.js';
import type { BirthData } from '../src/types/reading.js';
import type {
  FufireBootstrapRequest,
  FufireBootstrapResponse,
  FufireCalculateRequest,
  FufireBaziResponse,
  FufireWuxingResponse,
} from './types.js';

// ── Request builders ──────────────────────────────────────────────────────────

function toCalculateRequest(bd: BirthData): FufireCalculateRequest {
  return {
    date: bd.date,
    time: bd.birth_time_known && bd.time ? bd.time : '12:00',
    lat: bd.lat ?? 0.0,
    lon: bd.lon ?? 0.0,
    timezone: bd.timezone,
  };
}

function toBootstrapRequest(bd: BirthData): FufireBootstrapRequest {
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
    },
  };
}

// ── Generic fetch ─────────────────────────────────────────────────────────────

async function fuFetch<T>(path: string, body: unknown): Promise<T> {
  const url = `${config.fufireBaseUrl}${path}`;
  let res: globalThis.Response;

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.fufireApiKey!,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[fufire] Network error on ${path}:`, err instanceof Error ? err.message : String(err));
    throw new HttpError(502, 'FUFIRE_ERROR', 'FuFirE API unreachable');
  }

  if (res.status === 429) {
    throw new HttpError(429, 'RATE_LIMIT', 'Reading rate limit exceeded — please try again shortly');
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(unreadable)');
    console.error(`[fufire] ${path} HTTP ${res.status}:`, errBody);
    throw new HttpError(502, 'FUFIRE_ERROR', `FuFirE ${path} returned an error`);
  }

  return await res.json() as T;
}

// ── Combined call ─────────────────────────────────────────────────────────────

export async function callAllEndpoints(bd: BirthData) {
  const [bootstrap, bazi, wuxing] = await Promise.all([
    fuFetch<FufireBootstrapResponse>('/experience/bootstrap', toBootstrapRequest(bd)),
    fuFetch<FufireBaziResponse>('/calculate/bazi', toCalculateRequest(bd)),
    fuFetch<FufireWuxingResponse>('/calculate/wuxing', toCalculateRequest(bd)),
  ]);
  return { bootstrap, bazi, wuxing };
}

export type PersonReading = Awaited<ReturnType<typeof callAllEndpoints>>;
