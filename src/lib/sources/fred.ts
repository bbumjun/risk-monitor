const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

export interface FredObservation {
  date: string;
  value: number;
}

export async function fetchFredSeries(
  seriesId: string,
  options?: { limit?: number }
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY?.trim();
  if (!apiKey) {
    console.error("[fred] FRED_API_KEY not found in environment");
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
      const body = await response.text().catch(() => "(unreadable)");
      console.error(`[fred] API error for ${seriesId}: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`);
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
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[fred] FAILED series ${seriesId}: ${errMsg}`);
    return [];
  }
}

export async function fetchLatestFred(
  seriesId: string
): Promise<FredObservation | null> {
  const observations = await fetchFredSeries(seriesId, { limit: 1 });
  return observations.length > 0 ? observations[0] : null;
}
