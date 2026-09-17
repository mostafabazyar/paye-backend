export type NominatimSearchResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    country_code?: string;
  };
};

/**
 * Forward geocode using Nominatim.
 * Returns up to `limit` results.
 * No API key needed; must respect 1 req/sec rate limit.
 */
export async function searchAddress(
  query: string,
  limit = 5
): Promise<NominatimSearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}