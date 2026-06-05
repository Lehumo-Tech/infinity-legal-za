/**
 * Infinity Legal ZA - IP Geolocation Utility
 * Uses Country.is + GeoJS for IP geolocation with 1-hour cache
 * Used for security: detect unauthorized access from foreign locations
 * Graceful fallback if APIs are down
 */

import { callExternalApi, setCache, getCache, type CountryIsResponse, type GeoJsResponse } from '@/lib/external-apis';

// ============================================
// CONSTANTS
// ============================================

const GEO_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache for geolocation
const COUNTRY_IS_API = 'https://api.country.is';
const GEOJS_API = 'https://get.geojs.io/v1/ip/geo';

// ============================================
// TYPES
// ============================================

export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
  /** Whether this result came from API or fallback */
  source: 'api' | 'fallback';
}

export interface SACheckResult {
  isSouthAfrican: boolean;
  country: string;
  countryCode: string;
  city?: string;
  source: 'api' | 'fallback';
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get geographic location from an IP address.
 * Tries Country.is first, falls back to GeoJS for more detail.
 * Results are cached for 1 hour.
 */
export async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return null;
  }

  const cacheKey = `geo:ip:${ip}`;

  // Check cache
  const cached = getCache<GeoLocation>(cacheKey);
  if (cached) return cached;

  // Try Country.is first (simpler, faster)
  const countryResult = await callExternalApi<CountryIsResponse>(
    `${COUNTRY_IS_API}/${ip}`,
    { timeout: 5000, maxRetries: 1 }
  );

  let countryCode = '';
  let countryName = '';

  if (countryResult.success && countryResult.data) {
    countryCode = countryResult.data.country_iso;
    countryName = countryResult.data.country;
  }

  // Try GeoJS for more detailed info
  const geojsResult = await callExternalApi<GeoJsResponse>(
    `${GEOJS_API}/${ip}`,
    { timeout: 5000, maxRetries: 1 }
  );

  if (geojsResult.success && geojsResult.data) {
    const geo: GeoLocation = {
      ip,
      country: geojsResult.data.country_name || countryName || 'Unknown',
      countryCode: geojsResult.data.country_code || countryCode || 'XX',
      city: geojsResult.data.city,
      region: geojsResult.data.region,
      timezone: geojsResult.data.timezone,
      latitude: geojsResult.data.latitude,
      longitude: geojsResult.data.longitude,
      organization: geojsResult.data.organization,
      source: 'api',
    };
    setCache(cacheKey, geo, GEO_CACHE_TTL);
    return geo;
  }

  // If GeoJS failed but Country.is succeeded
  if (countryCode) {
    const geo: GeoLocation = {
      ip,
      country: countryName || 'Unknown',
      countryCode,
      source: 'api',
    };
    setCache(cacheKey, geo, GEO_CACHE_TTL);
    return geo;
  }

  // Both APIs failed
  console.warn(`[Geolocation] Both APIs failed for IP ${ip}`);
  return null;
}

/**
 * Check if an IP address is from South Africa.
 * Used for security: detect unauthorized access from foreign locations.
 */
export async function isSouthAfricanIP(ip: string): Promise<SACheckResult> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    // Local/unknown IPs - assume SA for development
    return {
      isSouthAfrican: true,
      country: 'Local',
      countryCode: 'ZA',
      source: 'fallback',
    };
  }

  const location = await getLocationFromIP(ip);

  if (!location) {
    // If we can't determine location, don't flag as suspicious
    return {
      isSouthAfrican: true, // Give benefit of doubt
      country: 'Unknown',
      countryCode: 'XX',
      source: 'fallback',
    };
  }

  return {
    isSouthAfrican: location.countryCode === 'ZA',
    country: location.country,
    countryCode: location.countryCode,
    city: location.city,
    source: location.source,
  };
}

/**
 * Get the client IP from request headers.
 * Handles X-Forwarded-For, X-Real-IP, and direct connection.
 */
export function getClientIP(request: { headers: { get: (name: string) => string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For may contain multiple IPs, take the first
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return 'unknown';
}
