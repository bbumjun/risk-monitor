const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

export interface FredObservation {
  date: string;
  value: number;
}

export async function fetchFredSeries(
  seriesId: string,
  options?: { limit?: number }
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn("FRED_API_KEY not found in environment");
    return [];
  }

  const limit = options?.limit ?? 30;
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", limit.toString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`FRED API error for ${seriesId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const observations = data.observations as Array<{
      date: string;
      value: string;
    }>;

    return observations
      .filter((obs) => obs.value !== ".")
      .map((obs) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }));
  } catch (error) {
    console.warn(`Failed to fetch FRED series ${seriesId}:`, error);
    return [];
  }
}

export async function fetchLatestFred(
  seriesId: string
): Promise<FredObservation | null> {
  const observations = await fetchFredSeries(seriesId, { limit: 1 });
  return observations.length > 0 ? observations[0] : null;
}
