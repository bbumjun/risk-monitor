const CNN_FEAR_GREED_URL =
  "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";

export interface FearGreedData {
  score: number;
  rating: string;
  timestamp: string;
  previous: {
    oneWeekAgo: number;
    oneMonthAgo: number;
    oneYearAgo: number;
  };
}

export async function fetchFearAndGreed(): Promise<FearGreedData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(CNN_FEAR_GREED_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CNN Fear & Greed API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.fear_and_greed) {
      console.warn("Invalid CNN Fear & Greed response structure");
      return null;
    }

    const current = data.fear_and_greed;
    const historical = data.fear_and_greed_historical;

    return {
      score: parseFloat(current.score),
      rating: current.rating,
      timestamp: current.timestamp
        ? new Date(parseInt(current.timestamp)).toISOString()
        : new Date().toISOString(),
      previous: {
        oneWeekAgo: historical?.one_week_ago
          ? parseFloat(historical.one_week_ago)
          : 0,
        oneMonthAgo: historical?.one_month_ago
          ? parseFloat(historical.one_month_ago)
          : 0,
        oneYearAgo: historical?.one_year_ago
          ? parseFloat(historical.one_year_ago)
          : 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("CNN Fear & Greed request timed out");
    } else {
      console.warn("Failed to fetch CNN Fear & Greed:", error);
    }
    return null;
  }
}
