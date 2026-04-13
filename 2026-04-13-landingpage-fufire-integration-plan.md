# Integrationsplan: Landingpage × FuFirE API × Bazodiac.space WebApp

> Stand: 13. April 2026 | Autor: Claude (PM/PO Bazodiac) | Status: ENTWURF v2

---

## 0. Ist-Zustand (Analyse)

### System A — Landingpage (`Landingpage/app`)

Eine **eigenständige Vite 7 + React 19 SPA** mit folgendem Stack:

- **UI:** Tailwind CSS v3 + shadcn/ui (40+ Komponenten), GSAP ScrollTrigger für Scroll-Animationen
- **Sektionen:** HeroSection → TwoPathsSection (Character / Partnership) → InputSection (BirthForm) → RevealSection → HowItWorksSection → SampleReadingsSection → ClosingSection
- **Lokale Astrologie:** `utils/astrology.ts` berechnet Sonnenzeichen, BaZi-Tagessäule, dominantes Element und Harmony-Index **client-seitig** — vereinfachte Logik, NICHT FuFirE
- **Zwei Pfade:** User wählt "Character" oder "Partnership", InputSection passt sich an (solo / zwei Formulare)
- **A/B-Testing:** `utils/experiments.ts` mit 3 Varianten (a/b/c) für Hero-CTA und Path-Button-Texte, localStorage-basiert
- **Analytics:** `utils/analytics.ts` mit dataLayer-Push + localStorage-Fallback
- **Domain-Anspruch:** `index.html` hat `<link rel="canonical" href="https://bazodiac.com/" />` — also auf `bazodiac.com` geplant
- **Kein Routing:** Alles single-page Scroll, kein React Router
- **Kein Backend-Anbindung:** Kein API-Fetch, kein Supabase, kein FuFirE
- **"Coming Soon" Stubs:** Save, Share, Read Full → zeigen nur Statusmeldungen

### System B — WebApp Bazodiac.space (`Bazodiac-WebApp/Astro-Noctum`)

Die **vollständige Produkt-App** auf `bazodiac.space`:

- **Stack:** React 19 + Vite 6 + React Router v7, deployed via Railway
- **Backend:** Express `server.mjs` (monolithisch, ~3200 Zeilen)
- **Auth:** Supabase (Email + Auto-Confirm), alle Kernfeatures hinter `requireUserAuth`
- **FuFirE-Endpoints (via server.mjs Proxy):**

| Endpoint | Funktion | Auth |
|----------|----------|------|
| `POST /api/calculate/bazi` | Vier Säulen des Schicksals | requireUserAuth |
| `POST /api/calculate/western` | Natal-Chart (Sonne, Mond, Aszendent, Häuser) | requireUserAuth |
| `POST /api/calculate/wuxing` | Fünf-Elemente-Verteilung | requireUserAuth |
| `POST /api/calculate/fusion` | 12-Sektor Fusion-Signal-Vektor | requireUserAuth |
| `POST /api/calculate/tst` | Transit-Positionen | requireUserAuth |
| `POST /api/synastry` | Partnerschaftsaspekte + Gemini-Narrative | requireUserAuth + requirePremium |
| `POST /api/interpret` | Gemini KI-Interpretation | requireUserAuth |
| `POST /api/experience/daily` | Tageshoroskop (Gemini) | requireUserAuth |
| `GET /share/:hash` | Öffentliches Chart-Sharing | keine |

- **Existierende Landingpage-Komponente:** `LandingHero.tsx` in Astro-Noctum (EN/DE, Levi/Victoria Agents) — aber **nicht im Router eingebunden**
- **Router-Routen:** `/` (Dashboard), `/onboarding`, `/signatur`, `/fu-ring`, `/wu-xing`, `/synastry`, `/faq`, `/sky`, `/weekly`, `/wissen/:slug`
- **Partnerschafts-Features:** 3 PartnerMatch-Quizzes + Synastry-Endpoint (Inter-Aspekt-Mathematik in server.mjs, nicht in FuFirE)

### Kernproblem

Die **zwei Systeme leben komplett isoliert**. Die Landingpage berechnet lokal mit vereinfachter Logik, die WebApp hat echte FuFirE-Daten aber keinen öffentlichen Zugang. Es gibt keinen Link, keinen Redirect und keinen Datenfluss zwischen den beiden.

---

## 1. Architektur-Entscheidung

### Option A: Zwei Apps, eine Domain-Strategie

```
bazodiac.com          → Landingpage (Vite-App, statisch)
bazodiac.space        → WebApp (Vite + Express, Railway)
bazodiac.com → API    → bazodiac.space/api/public/* (CORS oder Proxy)
```

### Option B: Landingpage in WebApp integrieren

Die Landingpage-Sektionen werden als Komponenten in Astro-Noctum importiert, eine Single-App bedient alles.

### Option C: Getrennte Apps, API-Bridge (EMPFEHLUNG)

```
bazodiac.com              → Landingpage (eigene App, eigenes Deployment)
bazodiac.space            → WebApp (bestehend, Railway)
bazodiac.space/api/public → Neue öffentliche Endpoints für Landingpage
```

**Warum Option C:**

- Die Landingpage hat ihren eigenen Design-Ansatz (GSAP-Scroll-Pinning, shadcn, Experiment-Framework) — das kollidiert mit Astro-Noctum (motion/react, anderer Tailwind-Ansatz, v4 vs v3)
- Die Landingpage braucht schnelles Laden (SEO, Conversion) — schlanke App ohne Supabase/Auth-Bundle
- Canonical ist bereits `bazodiac.com` — eigene Domain macht Sinn
- Die WebApp-`LandingHero.tsx` kann deprecated werden, sobald bazodiac.com live ist
- API-Integration durch wenige öffentliche Endpoints sauber lösbar

**Trade-off:** Zwei Deployments zu pflegen. Aber die Landingpage ändert sich selten, die WebApp oft.

---

## 2. Feature-Blöcke

### 2.1 — Verknüpfung: Links & Redirects

**Ziel:** Nahtloser Übergang zwischen Landing (bazodiac.com) und WebApp (bazodiac.space).

| Von → Nach | Trigger | URL |
|------------|---------|-----|
| Landing → WebApp Registrierung | CTA "Deutung beginnen" / "Begin Reading" | `https://bazodiac.space/onboarding?ref=landing&exp={variant}` |
| Landing → WebApp Chart (nach Berechnung) | CTA "Vollständige Analyse" / "Read Full" | `https://bazodiac.space/onboarding?ref=landing&prefill=1` |
| Landing → WebApp Partnership | CTA "Partner Reading starten" | `https://bazodiac.space/onboarding?ref=landing&path=partnership` |
| WebApp → Landing | Footer-Link "Über Bazodiac" | `https://bazodiac.com/` |
| WebApp Onboarding → Landing | "Zurück"-Link für nicht-registrierte User | `https://bazodiac.com/` |

**Datenbrücke über URL-Parameter + sessionStorage:**

```typescript
// Landingpage: Nach lokaler Berechnung
const params = new URLSearchParams({
  ref: 'landing',
  exp: experimentVariant,
  prefill: '1',
  birth: birthDate.toISOString(),
  // Zeit und Ort optional mitsenden
});
window.location.href = `https://bazodiac.space/onboarding?${params}`;
```

```typescript
// WebApp Onboarding: Parameter auslesen und vorausfüllen
const params = new URLSearchParams(window.location.search);
if (params.get('prefill') === '1') {
  const birthISO = params.get('birth');
  // BirthForm-Felder vorausfüllen
}
```

### 2.2 — FuFirE-Anbindung: Chart-Berechnung ohne Anmeldung

**Problem:** Die Landingpage berechnet aktuell lokal mit vereinfachter Logik (`utils/astrology.ts`). Das ist inakkurat — z.B. berechnet `calculateBaZi()` den Tagessäulen-Index einfach über `dayOfYear % 10`, was astronomisch falsch ist.

**Ziel:** Die Landingpage soll echte FuFirE-Daten zeigen, ohne dass der User sich anmelden muss.

**Zwei Varianten:**

#### Variante A — Hybrid (EMPFEHLUNG für MVP)

Die lokale Berechnung bleibt als **Instant-Fallback**. Parallel wird ein FuFirE-Request abgesetzt. Sobald die echten Daten ankommen, werden sie eingeblendet.

```
User gibt Geburtsdaten ein
  → sofort: lokale Berechnung (astrology.ts) → Reveal-Section zeigt Preview
  → parallel: POST bazodiac.space/api/public/chart → echte Daten
  → sobald Response: Reveal-Section updated mit FuFirE-Daten + "Verifiziert"-Badge
```

**Vorteil:** Kein Ladebalken, sofortige Interaktion, FuFirE-Daten veredeln das Ergebnis.

#### Variante B — Nur FuFirE

Lokale Berechnung wird entfernt, Reveal wartet auf API-Response mit Ladeanimation.

**Vorteil:** Keine falschen Daten gezeigt. **Nachteil:** Wartezeit (FuFirE ~2-4s bei Cold Cache).

### 2.3 — Neuer Server-Endpoint: `POST /api/public/chart`

Dieser Endpoint wird in `server.mjs` (Astro-Noctum) hinzugefügt:

```javascript
// ── /api/public/chart — Unauthenticated chart preview ──────────────
const publicChartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again in 15 minutes.' },
});

app.post('/api/public/chart', publicChartLimiter, async (req, res) => {
  const { date, tz, lat, lon } = req.body;
  if (!date || !tz || lat == null || lon == null) {
    return res.status(400).json({ error: 'Missing required fields: date, tz, lat, lon' });
  }

  const body = JSON.stringify({ date, tz, lat, lon });

  try {
    // Parallel FuFirE requests (reuse existing bafeFetch + cache)
    const [baziRes, westernRes, wuxingRes, fusionRes] = await Promise.allSettled([
      bafeFetch(bafeFallbackUrls('/calculate/bazi'), { method: 'POST', body, headers: { 'Content-Type': 'application/json', ...bafeFetchHeaders() } }),
      bafeFetch(bafeFallbackUrls('/calculate/western'), { method: 'POST', body, headers: { 'Content-Type': 'application/json', ...bafeFetchHeaders() } }),
      bafeFetch(bafeFallbackUrls('/calculate/wuxing'), { method: 'POST', body, headers: { 'Content-Type': 'application/json', ...bafeFetchHeaders() } }),
      bafeFetch(bafeFallbackUrls('/calculate/fusion'), { method: 'POST', body, headers: { 'Content-Type': 'application/json', ...bafeFetchHeaders() } }),
    ]);

    // Project only preview fields
    const preview = {
      preview: true,
      sun_sign: westernRes.status === 'fulfilled' ? extractSunSign(westernRes.value) : null,
      moon_sign: westernRes.status === 'fulfilled' ? extractMoonSign(westernRes.value) : null,
      ascendant: westernRes.status === 'fulfilled' ? extractAscendant(westernRes.value) : null,
      bazi_day_pillar: baziRes.status === 'fulfilled' ? extractDayPillar(baziRes.value) : null,
      dominant_element: wuxingRes.status === 'fulfilled' ? extractDominant(wuxingRes.value) : null,
      fusion_top3: fusionRes.status === 'fulfilled' ? extractTop3Sectors(fusionRes.value) : null,
    };

    res.json(preview);
  } catch (err) {
    console.error('[public/chart]', err?.message);
    res.status(502).json({ error: 'Calculation temporarily unavailable' });
  }
});
```

**CORS-Header für Cross-Origin (bazodiac.com → bazodiac.space):**

```javascript
// Nur für /api/public/* Endpoints
app.use('/api/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://bazodiac.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
```

### 2.4 — Neuer Server-Endpoint: `POST /api/public/match-preview`

Für Partnership-Matching ohne Anmeldung:

```javascript
const publicMatchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Rate limit exceeded.' },
});

app.post('/api/public/match-preview', publicMatchLimiter, async (req, res) => {
  const { person_a, person_b } = req.body;
  // Validierung...

  // Beide Fusion-Vektoren parallel berechnen
  const [fusionA, fusionB] = await Promise.all([
    bafeFetch(bafeFallbackUrls('/calculate/fusion'), { method: 'POST', body: JSON.stringify(person_a), ... }),
    bafeFetch(bafeFallbackUrls('/calculate/fusion'), { method: 'POST', body: JSON.stringify(person_b), ... }),
  ]);

  // Cosine Similarity der 12-Sektor-Vektoren
  const compatibility = fusionCompatibility(fusionA.sectors, fusionB.sectors);

  res.json({
    preview: true,
    compatibility_score: compatibility.score,
    strongest_shared_sector: compatibility.strongest_shared,
    tension_axis: compatibility.tension_axis,
    // Basis-Zeichen beider Personen für Kontext
    person_a_sun: extractSunSign(westernA),
    person_b_sun: extractSunSign(westernB),
  });
});
```

### 2.5 — Landingpage-seitige FuFirE-Integration

In `Landingpage/app` wird ein neuer API-Client erstellt:

```typescript
// src/utils/fufire-client.ts
const FUFIRE_API = import.meta.env.VITE_FUFIRE_API_URL || 'https://bazodiac.space';

export interface FuFireChartPreview {
  preview: true;
  sun_sign: string | null;
  moon_sign: string | null;
  ascendant: string | null;
  bazi_day_pillar: { stem: string; branch: string; element: string } | null;
  dominant_element: string | null;
  fusion_top3: Array<{ sector: number; intensity: number }> | null;
}

export async function fetchChartPreview(
  date: string, tz: string, lat: number, lon: number
): Promise<FuFireChartPreview> {
  const res = await fetch(`${FUFIRE_API}/api/public/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, tz, lat, lon }),
  });
  if (!res.ok) throw new Error(`FuFirE ${res.status}`);
  return res.json();
}

export interface FuFireMatchPreview {
  preview: true;
  compatibility_score: number;
  strongest_shared_sector: number;
  tension_axis: { sectors: [number, number]; intensity: number };
  person_a_sun: string;
  person_b_sun: string;
}

export async function fetchMatchPreview(
  personA: { date: string; tz: string; lat: number; lon: number },
  personB: { date: string; tz: string; lat: number; lon: number }
): Promise<FuFireMatchPreview> {
  const res = await fetch(`${FUFIRE_API}/api/public/match-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person_a: personA, person_b: personB }),
  });
  if (!res.ok) throw new Error(`FuFirE ${res.status}`);
  return res.json();
}
```

**Integration in `App.tsx` `handleCalculate`:**

```typescript
// Aktuelle lokale Berechnung bleibt als Instant-Preview
const localResult = calculateFullAstrology(birthDate);
setAstrologyResult(localResult);

// Parallel: FuFirE-Request für echte Daten
fetchChartPreview(birthDate.toISOString(), tz, lat, lon)
  .then(fufire => setFufireResult(fufire))
  .catch(() => { /* Fallback auf lokale Daten, kein Fehler zeigen */ });
```

### 2.6 — Partnerschafts-Matching: Stufen-Modell

```
┌─────────────────────────────────────────────────────┐
│ Stufe 0 — Landingpage (kein Auth, kein API)         │
│ • Lokale Berechnung: Sonnenzeichen-Kompatibilität   │
│ • Sofortig, kein Netzwerk nötig                     │
│ CTA: "Eure echte Fusion berechnen" →                │
├─────────────────────────────────────────────────────┤
│ Stufe 1 — Landingpage + FuFirE (kein Auth)          │
│ • POST /api/public/match-preview                    │
│ • Fusions-Kompatibilitäts-Score (Cosine Similarity) │
│ • Stärkstes gemeinsames Element + Spannungsachse    │
│ CTA: "Registrieren für detaillierte Analyse" →      │
├─────────────────────────────────────────────────────┤
│ Stufe 2 — WebApp (Auth, kein Premium)               │
│ • POST /api/synastry (bestehend, Auth erweitern)    │
│ • Vollständige Aspekt-Liste                         │
│ • Template-basierte Narrative                       │
│ • Visuelle Fusion-Ring-Überlagerung                 │
│ CTA: "Premium für KI-Analyse"                       │
├─────────────────────────────────────────────────────┤
│ Stufe 3 — WebApp (Auth + Premium)                   │
│ • POST /api/synastry mit requirePremium             │
│ • Gemini-KI-Narrative                               │
│ • Transit-Einflüsse auf Beziehung                   │
│ • PartnerMatch-Quiz-Integration                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. Vollständiges Routing & Domain-Mapping

```
bazodiac.com (Landingpage-App)
├── /                   → HeroSection → TwoPathsSection → Input → Reveal → HowItWorks → Closing
├── /?path=character    → Direkt zum Character-Input
├── /?path=partnership  → Direkt zum Partnership-Input
└── (alle CTAs)         → https://bazodiac.space/onboarding?ref=landing&...

bazodiac.space (WebApp Astro-Noctum)
├── /                   → Dashboard (Auth + Profil) | Redirect /onboarding
├── /onboarding         → Registrierung + BirthForm (akzeptiert ?ref, ?prefill, ?birth Parameter)
├── /signatur           → FuRingPage
├── /fu-ring            → FuRingPage
├── /synastry           → SynastryPage (Auth, Premium für Gemini)
├── /wu-xing            → WuXingPage
├── /wissen             → WissenPage (öffentlich)
├── /wissen/:slug       → ArtikelPage (öffentlich)
├── /faq                → FaqPage (öffentlich)
├── /sky                → SkyPage
├── /weekly             → WeeklyInsightsPage
├── /share/:hash        → Öffentliches Chart (bestehend)
├── /api/public/chart   → NEU: Chart-Preview ohne Auth
└── /api/public/match-preview → NEU: Match-Preview ohne Auth
```

---

## 4. FuFirE-Endpoint-Mapping (vollständig)

| Feature | Wer ruft auf | Server-Endpoint | FuFirE-Proxy-Kette | Auth | CORS |
|---------|-------------|-----------------|---------------------|------|------|
| Chart-Preview (Landing) | Landingpage → bazodiac.space | `POST /api/public/chart` (NEU) | → 4× `/calculate/*` parallel | **Nein** | bazodiac.com |
| Match-Preview (Landing) | Landingpage → bazodiac.space | `POST /api/public/match-preview` (NEU) | → 2× `/calculate/fusion` + 2× `/calculate/western` | **Nein** | bazodiac.com |
| Volle Berechnung | WebApp intern | `POST /api/calculate/:endpoint` | → `/calculate/:endpoint` | requireUserAuth | same-origin |
| Volle Synastry | WebApp intern | `POST /api/synastry` (erweitern) | → 2× `/chart` + lokale Aspektmathematik | requireUserAuth + requirePremium | same-origin |
| KI-Interpretation | WebApp intern | `POST /api/interpret` | → Gemini Flash | requireUserAuth | same-origin |
| Tageshoroskop | WebApp intern | `POST /api/experience/daily` | → Gemini + Transit | requireUserAuth | same-origin |

---

## 5. Phasenplan

### Phase 1: Link-Bridge + Redirect-Logik (~3h)

**Landingpage-Seite:**
1. CTA-Buttons in `ClosingSection`, `RevealSection` mit Links zu `bazodiac.space/onboarding` versehen
2. UTM-Parameter + Experiment-Variante als Query-Params mitgeben
3. BirthData als URL-Parameter kodieren (Base64 oder einzelne Params)

**WebApp-Seite:**
4. `OnboardingPage` erweitert: Query-Params `ref`, `birth`, `prefill` auslesen
5. BirthForm vorausfüllen wenn `prefill=1` + `birth` gesetzt
6. Analytics-Event `signup_from_landing` tracken

**Verifikation:** Landingpage CTA klicken → bazodiac.space/onboarding öffnet sich mit vorausgefülltem BirthForm.

### Phase 2: Öffentliche FuFirE-Endpoints (~6h)

**server.mjs:**
1. CORS-Middleware für `/api/public/*` mit `bazodiac.com` Origin
2. `POST /api/public/chart` implementieren (s. 2.3)
3. Extractor-Funktionen: `extractSunSign()`, `extractMoonSign()`, `extractAscendant()`, `extractDayPillar()`, `extractDominant()`, `extractTop3Sectors()`
4. Rate-Limiter: `publicChartLimiter` (5/15min/IP), `publicMatchLimiter` (3/15min/IP)
5. `POST /api/public/match-preview` implementieren (s. 2.4)
6. `fusionCompatibility()` Funktion (Cosine Similarity)

**Verifikation:**
- `curl -X POST https://bazodiac.space/api/public/chart -H "Content-Type: application/json" -d '{"date":"1990-05-15T14:30:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405}'` → 200 mit Preview
- 6. Request innerhalb 15 Min → 429
- Request von anderen Origins → CORS-Fehler

### Phase 3: Landingpage FuFirE-Anbindung (~5h)

**Landingpage-App:**
1. `src/utils/fufire-client.ts` erstellen (s. 2.5)
2. `App.tsx` `handleCalculate` erweitern: lokale Berechnung + parallel FuFirE-Fetch
3. `RevealSection` erweitern: zeigt zuerst lokale Daten, updated bei FuFirE-Response
4. Visueller Indikator: "Astronomisch verifiziert" Badge wenn FuFirE-Daten da sind
5. Error-Handling: FuFirE-Timeout/Fehler → lokale Daten bleiben, kein Fehler sichtbar
6. Partnership-Flow: `fetchMatchPreview()` integrieren wenn `pathType === 'partnership'`

**Verifikation:** Geburtsdaten eingeben → sofort lokale Ergebnisse → nach 1-3s FuFirE-Daten erscheinen mit "Verifiziert"-Badge.

### Phase 4: Synastry-Erweiterung + Stufen-CTAs (~4h)

**server.mjs:**
1. `/api/synastry` erweitern: `fusion_compatibility`-Feld hinzufügen (Cosine Similarity der Fusion-Vektoren)
2. Auth-Gate für Synastry aufteilen: Template-Narrative ohne Premium, Gemini-Narrative mit Premium

**Landingpage:**
3. RevealSection für Partnership: zeigt Compatibility-Score + Teaser
4. CTA-Stufen: "Vollständige Analyse" → bazodiac.space/onboarding, "Premium KI-Analyse" → bazodiac.space/onboarding?premium=1

### Phase 5: Polish, Analytics & Deployment (~4h)

1. `bazodiac.com` Domain einrichten (Vercel/Netlify/Cloudflare Pages für statische Landingpage)
2. `bazodiac.space` CORS-Config verifizieren im Produktionsbetrieb
3. Conversion-Events vereinheitlichen: `landing_visit`, `path_select`, `calc_submit`, `fufire_loaded`, `cta_to_webapp`, `signup_from_landing`
4. Open Graph Images für `bazodiac.com`
5. Lighthouse-Audit: Performance + SEO + Accessibility
6. `LandingHero.tsx` in Astro-Noctum als deprecated markieren (wird durch bazodiac.com ersetzt)

---

## 6. Sicherheits-Überlegungen

| Risiko | Mitigation |
|--------|-----------|
| Abuse der Public-Endpoints (Scraping) | Rate-Limiting 5/15min/IP + CORS auf `bazodiac.com` beschränkt |
| FuFirE-Kosten durch unauthentifizierte Requests | 24h-Cache greift (deterministische Berechnung, gleiche Input = Cache-Hit) |
| Daten-Leakage durch Preview | Preview zeigt nur Basisfelder, keine vollständigen Planetenpositionen oder Häuser |
| CORS-Bypass | Server-seitig Origin prüfen, nicht nur Header |
| BirthData in URL-Parametern | Nur Datum + Ort, keine sensitiven Daten. HTTPS erzwingen. |
| Lokale Berechnung ist inakkurat | Klar als "Schnell-Vorschau" labeln, FuFirE-Daten als "Astronomisch verifiziert" |

---

## 7. Offene Entscheidungen (für dich, Ben)

1. **bazodiac.com Hosting:** Vercel (kostenlos, schnelles CDN), Netlify, oder Cloudflare Pages? Die Landingpage ist eine reine SPA ohne Server.

2. **Hybrid vs. FuFirE-Only:** Soll die lokale Berechnung als Instant-Preview bleiben (Variante A), oder komplett durch FuFirE ersetzt werden (Variante B)? Meine Empfehlung ist Hybrid — sofortige Interaktion + spätere Veredelung.

3. **Preview-Umfang:** Soll der FuFirE-Preview auch eine Mini-Interpretation enthalten (Template-basiert aus den Interpretation-Templates in server.mjs), oder reicht die Datenansicht?

4. **CORS-Whitelist:** Soll `/api/public/*` nur `bazodiac.com` erlauben, oder auch `localhost:*` für Dev? (Dev-Only über Environment-Variable steuerbar.)

5. **LandingHero.tsx Sunset:** Wann wird die bestehende `LandingHero.tsx` in Astro-Noctum entfernt? Sofort, oder erst wenn bazodiac.com verifiziert live ist?

6. **FuFirE-Rebranding:** Die BAFE-Variablen in server.mjs (`BAFE_BASE_URL`, `BafeBaziResponse`, etc.) — soll das Rebranding vor oder nach dieser Integration passieren?

7. **Partnership auf der Landingpage:** Aktuell nimmt `InputSection` ein optionales `partnerDate` entgegen, berechnet aber nur den einen User. Soll der Partnership-Pfad auf der Landingpage schon beide Charts + Match-Score zeigen, oder nur als CTA zu bazodiac.space weiterleiten?

---

## 8. Abhängigkeiten

- **FuFirE-API erreichbar** — Public-Endpoints erhöhen die Last. 24h-Cache mildert das ab, aber Monitoring auf BAFE-Fallback-Chain prüfen.
- **bazodiac.com Domain** — Muss eingerichtet + DNS konfiguriert werden (aktuell canonical in index.html, aber kein Deployment).
- **Railway CORS** — Railway unterstützt custom CORS-Header, aber Express muss sie setzen (nicht Railway-Level).
- **Supabase** — Keine Änderung. Public-Endpoints schreiben nichts.
- **Stripe** — Keine Änderung.

---

## Zusammenfassung

```
bazodiac.com (Landingpage)
    │
    │  Lokale Berechnung (sofort)
    │  + FuFirE /api/public/chart (parallel, verifiziert)
    │
    ├── Character-Pfad → Preview → CTA "Vollständige Analyse"
    │                                    ↓
    │                         bazodiac.space/onboarding?ref=landing&prefill=1
    │
    └── Partnership-Pfad → Match-Preview → CTA "Eure Fusion entdecken"
                                               ↓
                              bazodiac.space/onboarding?ref=landing&path=partnership
                                               ↓
                              /synastry (Auth) → /synastry (Premium: Gemini)
```

**Geschätzter Gesamtaufwand: ~22h** über 5 Phasen.

Kern-Insight: Die Landingpage ist kein Dummy — sie ist eine eigenständige App mit A/B-Testing, GSAP-Animationen und lokalem Astrologie-Modul. Die Integration geschieht über zwei schmale öffentliche API-Endpoints und URL-Parameter-Brücken. Kein Merge der Codebases nötig.
