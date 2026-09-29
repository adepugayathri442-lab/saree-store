import { Saree } from "@/types/saree";
import { getSareeById } from "@/data/sarees";
import { fetchSareeByIdFromDb } from "@/lib/supabase/sarees";

export const RECENTLY_VIEWED_STORAGE_KEY = "saisrujana_recently_viewed_v1";
export const RECENTLY_VIEWED_CACHE_KEY = "saisrujana_recently_viewed_cache_v1";
export const MAX_RECENTLY_VIEWED = 6;

let cachedRawIds: string | null = null;
let cachedIds: string[] = [];

/**
 * Returns a stable snapshot of recently viewed saree IDs from localStorage.
 */
export function getRecentlyViewedIdsSnapshot(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "[]";
    if (raw !== cachedRawIds) {
      cachedRawIds = raw;
      const parsed = JSON.parse(raw);
      cachedIds = Array.isArray(parsed) ? parsed : [];
    }
    return cachedIds;
  } catch {
    return cachedIds;
  }
}

const emptyServerIds: string[] = [];
export function getServerRecentlyViewedSnapshot(): string[] {
  return emptyServerIds;
}

/**
 * Subscribes to storage events and custom recently viewed change events.
 */
export function subscribeRecentlyViewed(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("saisrujana_recently_viewed_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("saisrujana_recently_viewed_change", callback);
  };
}

/**
 * Tracks a viewed saree:
 * - Prepends saree ID to localStorage saisrujana_recently_viewed_v1.
 * - Removes duplicates.
 * - Caps at 8 items.
 * - Saves saree object in companion cache for fast instant rendering.
 */
export function trackRecentlyViewed(saree: Saree): void {
  if (typeof window === "undefined" || !saree || !saree.id) {
    return;
  }

  try {
    // 1. Update IDs list
    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "[]";
    let currentIds: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      currentIds = Array.isArray(parsed) ? parsed : [];
    } catch {
      currentIds = [];
    }

    // Filter out duplicates (checking both id and sku)
    const filteredIds = currentIds.filter(
      (id) => id !== saree.id && (saree.sku ? id !== saree.sku : true)
    );

    // Keep most recently viewed first, maximum of 8
    const updatedIds = [saree.id, ...filteredIds].slice(0, MAX_RECENTLY_VIEWED);
    const updatedIdsRaw = JSON.stringify(updatedIds);

    cachedRawIds = updatedIdsRaw;
    cachedIds = updatedIds;
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, updatedIdsRaw);

    // 2. Update Companion Saree Cache
    try {
      const rawCache = localStorage.getItem(RECENTLY_VIEWED_CACHE_KEY) || "{}";
      const cache: Record<string, Saree> = JSON.parse(rawCache);
      cache[saree.id] = saree;
      if (saree.sku) {
        cache[saree.sku] = saree;
      }

      // Evict items no longer in updatedIds
      const activeKeys = new Set(updatedIds);
      Object.keys(cache).forEach((key) => {
        if (!activeKeys.has(key) && cache[key] && !activeKeys.has(cache[key].sku)) {
          delete cache[key];
        }
      });

      localStorage.setItem(RECENTLY_VIEWED_CACHE_KEY, JSON.stringify(cache));
    } catch (cacheErr) {
      console.warn("Companion saree cache warning:", cacheErr);
    }

    // Notify listeners
    window.dispatchEvent(new Event("saisrujana_recently_viewed_change"));
  } catch (err) {
    console.error("Failed to track recently viewed saree:", err);
  }
}

/**
 * Clears all recently viewed items.
 */
export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    cachedRawIds = "[]";
    cachedIds = [];
    localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    localStorage.removeItem(RECENTLY_VIEWED_CACHE_KEY);
    window.dispatchEvent(new Event("saisrujana_recently_viewed_change"));
  } catch (err) {
    console.error("Failed to clear recently viewed sarees:", err);
  }
}

/**
 * Resolves an array of saree IDs into full Saree objects:
 * 1. Checks companion localStorage cache.
 * 2. Checks local catalogue data.
 * 3. Falls back to Supabase lookup.
 * 4. Safely ignores deleted or unavailable IDs.
 * 5. Returns items in exact recency order.
 */
export async function resolveRecentlyViewedSarees(ids: string[]): Promise<Saree[]> {
  if (!ids || ids.length === 0) return [];

  const cacheMap = new Map<string, Saree>();

  // Read companion cache if in browser
  if (typeof window !== "undefined") {
    try {
      const rawCache = localStorage.getItem(RECENTLY_VIEWED_CACHE_KEY);
      if (rawCache) {
        const parsed: Record<string, Saree> = JSON.parse(rawCache);
        Object.entries(parsed).forEach(([key, saree]) => {
          cacheMap.set(key, saree);
          if (saree.sku) cacheMap.set(saree.sku, saree);
        });
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  const resolvedMap = new Map<string, Saree>();
  const missingIds: string[] = [];

  for (const id of ids) {
    if (cacheMap.has(id)) {
      resolvedMap.set(id, cacheMap.get(id)!);
    } else {
      const localSaree = getSareeById(id);
      if (localSaree) {
        resolvedMap.set(id, localSaree);
      } else {
        missingIds.push(id);
      }
    }
  }

  // If any IDs are missing, attempt Supabase lookup safely
  if (missingIds.length > 0) {
    try {
      for (const missingId of missingIds) {
        const dbSaree = await fetchSareeByIdFromDb(missingId);
        if (dbSaree) {
          resolvedMap.set(missingId, dbSaree);
        }
      }
    } catch {
      // Safe fallback if network unavailable
    }
  }

  // Preserve the exact order of the IDs array
  const orderedSarees: Saree[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const saree = resolvedMap.get(id);
    if (saree && !seen.has(saree.id)) {
      seen.add(saree.id);
      orderedSarees.push(saree);
    }
  }

  return orderedSarees;
}
