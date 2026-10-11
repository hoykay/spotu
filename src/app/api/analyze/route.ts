import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
const { longitude, latitude, selectedConcept } = await request.json();

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Longitude and latitude are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.QLOO_API_KEY;
    const baseUrl =
      process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Qloo API key is missing." },
        { status: 500 }
      );
    }

    const url = new URL("/v2/insights", baseUrl);

    url.searchParams.set("filter.type", "urn:entity:place");
    url.searchParams.set(
      "filter.location",
      `POINT(${longitude} ${latitude})`
    );
    url.searchParams.set("filter.location.radius", "1500");
    url.searchParams.set("take", "20");

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Qloo error:", data);

      return NextResponse.json(
        {
          error: "Qloo request failed.",
          details: data,
        },
        { status: response.status }
      );
    }

    const entities = Array.isArray(data?.results?.entities)
      ? data.results.entities
      : [];

    const tagCounts = new Map<
      string,
      { name: string; count: number }
    >();

    for (const entity of entities) {
      const tags = Array.isArray(entity?.tags) ? entity.tags : [];
      const seenInEntity = new Set<string>();

      for (const tag of tags) {
        const name = tag?.name;
        const type = tag?.type || "";

        if (!name) continue;

        const usefulTag =
          type.includes("ambience") ||
          type.includes("neighborhood_characteristic") ||
          type.includes("decor") ||
          type.includes("culinary_style") ||
          type.includes("interests") ||
          type.includes("category");

        if (!usefulTag) continue;

        const key = name.toLowerCase();

        if (seenInEntity.has(key)) continue;
        seenInEntity.add(key);

        const existing = tagCounts.get(key);

        if (existing) {
          existing.count += 1;
        } else {
          tagCounts.set(key, {
            name,
            count: 1,
          });
        }
      }
    }

    const neighborhoodDna = Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
const topSignals = neighborhoodDna.slice(0, 5);

const averageSignalStrength =
  topSignals.length > 0 && entities.length > 0
    ? topSignals.reduce(
        (total, signal) => total + signal.count / entities.length,
        0
      ) / topSignals.length
    : 0;

const culturalFitIndex = Math.round(
  Math.min(100, averageSignalStrength * 100)
);
const conceptProfiles = [
  {
    name: "Restaurant",
    signals: ["social", "lively", "central", "bustling", "casual", "trendy"],
    categories: ["restaurant", "dining", "food"],
  },
  {
    name: "Café",
    signals: ["walkable", "casual", "social", "trendy", "modern", "central"],
    categories: ["cafe", "coffee", "bakery"],
  },
  {
    name: "Bar / Wine",
    signals: ["lively", "social", "bustling", "trendy", "central"],
    categories: ["bar", "wine", "cocktail", "pub"],
  },
  {
    name: "Retail",
    signals: ["walkable", "central", "trendy", "modern", "bustling"],
    categories: ["retail", "shop", "store", "shopping"],
  },
  {
    name: "Wellness",
    signals: ["walkable", "modern", "casual", "social"],
    categories: ["wellness", "spa", "fitness", "gym", "health"],
  },
  {
    name: "Entertainment",
    signals: ["lively", "social", "bustling", "trendy"],
    categories: ["entertainment", "music", "theater", "cinema", "club"],
  },
  {
    name: "Art & Culture",
    signals: ["historic", "trendy", "modern", "social", "walkable"],
    categories: ["art", "gallery", "museum", "culture"],
  },
  {
    name: "Lifestyle",
    signals: ["trendy", "modern", "walkable", "social", "central"],
    categories: ["lifestyle", "design", "fashion"],
  },
];
const opportunities = conceptProfiles
  .map((concept) => {
    const signalStrengths = concept.signals.map((signal) => {
      const match = tagCounts.get(signal);

      return entities.length > 0
        ? (match?.count ?? 0) / entities.length
        : 0;
    });

    const culturalMatch =
      signalStrengths.length > 0
        ? Math.round(
            (signalStrengths.reduce((sum, value) => sum + value, 0) /
              signalStrengths.length) *
              100
          )
        : 0;

    let nearbyMatches = 0;

    for (const entity of entities) {
      const tags = Array.isArray(entity?.tags) ? entity.tags : [];

    const entityMatchesConcept = tags.some(
  (tag: { name?: string; type?: string }) => {
        const searchableText = `${tag?.name || ""} ${tag?.type || ""}`.toLowerCase();

        return concept.categories.some((category) =>
          searchableText.includes(category)
        );
      });

      if (entityMatchesConcept) {
        nearbyMatches += 1;
      }
    }

    const saturation =
      entities.length > 0
        ? Math.round((nearbyMatches / entities.length) * 100)
        : 0;

    const whiteSpace = Math.max(0, 100 - saturation);

    const opportunityScore = Math.round(
      culturalMatch * 0.65 + whiteSpace * 0.35
    );

    const strongestSignals = concept.signals
      .map((signal) => ({
        name: signal,
        strength:
          entities.length > 0
            ? Math.round(
                ((tagCounts.get(signal)?.count ?? 0) / entities.length) *
                  100
              )
            : 0,
      }))
      .filter((signal) => signal.strength > 0)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);

    return {
      name: concept.name,
      opportunityScore,
      culturalMatch,
      whiteSpace,
      nearbyMatches,
      strongestSignals,
    };
  })
  .sort((a, b) => b.opportunityScore - a.opportunityScore);
  const selectedOpportunity =
  opportunities.find(
    (opportunity) => opportunity.name === selectedConcept
  ) ?? null;
  return NextResponse.json({
  success: true,
  placeCount: entities.length,
  neighborhoodDna,
  culturalFitIndex,
  opportunities,
  selectedOpportunity,
});
  } catch (error) {
    console.error("SpotU analyze error:", error);

    return NextResponse.json(
      { error: "SpotU analysis failed." },
      { status: 500 }
    );
  }
}