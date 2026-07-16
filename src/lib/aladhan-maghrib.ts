import 'server-only';

const ALADHAN_URL =
  'https://api.aladhan.com/v1/timingsByCity?city=Karachi&country=Pakistan&method=1';

type AladhanResponse = {
  code?: number;
  data?: {
    timings?: {
      Maghrib?: string;
    };
  };
};

type CacheEntry = {
  value: string;
  fetchedAt: number;
};

// Module-scoped cache of the last successful Maghrib time (persists for the
// life of the server process). Acts as the fallback whenever the API fails.
let lastSuccessful: CacheEntry | null = null;
let inflight: Promise<string | null> | null = null;

const REFRESH_MS = 60 * 60 * 1000; // 1 hour

function normalize(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function fetchFromApi(): Promise<string | null> {
  try {
    const res = await fetch(ALADHAN_URL, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`[aladhan-maghrib] API returned ${res.status}`);
      return null;
    }
    const payload = (await res.json()) as AladhanResponse;
    const raw = payload?.data?.timings?.Maghrib;
    const normalized = normalize(raw);
    if (!normalized) {
      console.error('[aladhan-maghrib] API response missing Maghrib timing');
      return null;
    }
    lastSuccessful = { value: normalized, fetchedAt: Date.now() };
    return normalized;
  } catch (error) {
    console.error('[aladhan-maghrib] API request failed', error);
    return null;
  }
}

/**
 * Returns Karachi's Maghrib time (24h HH:mm) sourced from the Aladhan API.
 *
 * - Refreshes at most once per hour.
 * - If the API fails, returns the last successful value, or the provided
 *   `fallback` (typically the previously stored DB value) so the app never
 *   crashes and existing pages keep rendering.
 */
export async function getMaghribTime(fallback?: string | null): Promise<string | null> {
  const needsRefresh =
    !lastSuccessful || Date.now() - lastSuccessful.fetchedAt > REFRESH_MS;

  if (needsRefresh) {
    if (!inflight) {
      inflight = fetchFromApi().finally(() => {
        inflight = null;
      });
    }
    const fresh = await inflight;
    if (fresh) return fresh;
  } else {
    return lastSuccessful!.value;
  }

  if (lastSuccessful) return lastSuccessful.value;
  const normalizedFallback = normalize(fallback ?? undefined);
  return normalizedFallback;
}
