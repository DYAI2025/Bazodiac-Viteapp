# Fix Critical + High Bugs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 7 critical and high severity bugs identified in code review before Railway deployment.

**Architecture:** Targeted fixes across BFF server files and SPA InputSection. No new dependencies — all fixes use existing Express/Node.js APIs.

**Tech Stack:** TypeScript, Express 4, React 19, Vite 7

---

### Task 1: Fix `requireVars` throwing wrong error type (CRITICAL)

**Files:**
- Modify: `server/config.ts:62-69`

**Step 1: Change `requireVars` to throw `HttpError` instead of plain `Error`**

Import `HttpError` at the top of the file, and change the throw to use `HttpError(503, 'SERVICE_UNAVAILABLE', ...)`:

```ts
// Add at top of file:
import { HttpError } from './errorHandler.js';

// Replace the throw in requireVars:
export function requireVars(vars: Array<keyof Config>, featureName: string): void {
  const missing = vars.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new HttpError(
      503,
      'SERVICE_UNAVAILABLE',
      `${featureName} is not available — server configuration incomplete`
    );
  }
}
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 2: Remove dead code `pickNum` (CRITICAL)

**Files:**
- Modify: `server/routes/reading.ts:131-138`

**Step 1: Delete the `pickNum` function entirely**

Remove lines 131-138 (the entire `pickNum` function). It is never called.

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 3: Add timeout to Nominatim geocode call (CRITICAL)

**Files:**
- Modify: `src/sections/InputSection.tsx:9-19`

**Step 1: Add AbortSignal timeout to the fetch call**

Replace the `geocode` function:

```ts
async function geocode(place: string): Promise<{ lat: number; lon: number } | undefined> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Bazodiac/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch { /* geocoding failure is non-fatal — fall back to default coords */ }
  return undefined;
}
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 4: Parallelize partnership FuFirE calls (HIGH)

**Files:**
- Modify: `server/routes/reading.ts:249-253`

**Step 1: Replace sequential calls with `Promise.all`**

Find the section:
```ts
    const subjectRaw = await callFuFire(toBirthDataRequest(body.birth_data));

    let partnerRaw: FufireBootstrapResponse | undefined;
    if (body.mode === 'partnership') {
      partnerRaw = await callFuFire(toBirthDataRequest(body.partner_birth_data!));
    }
```

Replace with:
```ts
    let subjectRaw: FufireBootstrapResponse;
    let partnerRaw: FufireBootstrapResponse | undefined;

    if (body.mode === 'partnership') {
      [subjectRaw, partnerRaw] = await Promise.all([
        callFuFire(toBirthDataRequest(body.birth_data)),
        callFuFire(toBirthDataRequest(body.partner_birth_data!)),
      ]);
    } else {
      subjectRaw = await callFuFire(toBirthDataRequest(body.birth_data));
    }
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 5: Add body size limit to `express.json()` (HIGH)

**Files:**
- Modify: `server/index.ts:20`

**Step 1: Add explicit limit**

Change:
```ts
app.use(express.json());
```
To:
```ts
app.use(express.json({ limit: '16kb' }));
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 6: Add session store size cap (HIGH)

**Files:**
- Modify: `server/sessionStore.ts`

**Step 1: Add MAX_SESSIONS constant and check in `createSession`**

Add after `SESSION_TTL_MS`:
```ts
const MAX_SESSIONS = 10_000;
```

In `createSession`, after `evictExpired()`, add:
```ts
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error('Session store full — please try again later');
  }
```

But this throws a plain Error — import HttpError and use it:

Add import at top:
```ts
import { HttpError } from './errorHandler.js';
```

Then the check becomes:
```ts
  if (sessions.size >= MAX_SESSIONS) {
    throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'Server is at capacity — please try again later');
  }
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 7: Remove duplicate `notFoundHandler` registration (HIGH)

**Files:**
- Modify: `server/index.ts:52`

**Step 1: Remove the global `notFoundHandler` on line 52**

The line `app.use(notFoundHandler);` after the SPA catch-all is unreachable dead code. Remove it. Keep the `app.use(errorHandler);` line — that one IS reachable (handles errors passed via `next(err)`).

After removal, the error handler section should look like:
```ts
// ── Error handlers (must come after all routes) ──────────────────────────────

app.use(errorHandler);
```

**Step 2: Verify build passes**

Run: `npx tsc -b`
Expected: no output (clean)

---

### Task 8: Validate birth place not empty when checkbox is checked (MEDIUM — bonus)

**Files:**
- Modify: `src/sections/InputSection.tsx:190-192`

**Step 1: Update `isValid` to require place when checkbox is checked**

Change:
```ts
  const isValid =
    birthDate !== '' &&
    (pathType !== 'partnership' || partnerDate !== '');
```
To:
```ts
  const isValid =
    birthDate !== '' &&
    (!birthPlaceKnown || birthPlace.trim() !== '') &&
    (pathType !== 'partnership' || partnerDate !== '') &&
    (pathType !== 'partnership' || !partnerPlaceKnown || partnerPlace.trim() !== '');
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: clean build

---

### Task 9: Final verification and commit

**Step 1: Run full build**

Run: `npm run build`
Expected: clean build with no errors

**Step 2: Start server and test**

Run: `PORT=3100 npm run start &`
Then:
- `curl http://localhost:3100/health` → `{"status":"ok"}`
- `curl http://localhost:3100/api/nonexistent` → `{"error":"Not found","code":"NOT_FOUND"}`
- `curl -X POST http://localhost:3100/api/reading -H 'Content-Type: application/json' -d '{}'` → `{"error":"...","code":"INVALID_INPUT"}` (not 500)
