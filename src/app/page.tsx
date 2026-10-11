"use client";

import { useEffect, useState } from "react";
import SpotMap from "@/components/SpotMap";

const concepts = [
  { icon: "🍴", label: "Restaurant" },
  { icon: "☕", label: "Café" },
  { icon: "🍷", label: "Bar / Wine" },
  { icon: "🛍", label: "Retail" },
  { icon: "◒", label: "Wellness" },
  { icon: "♫", label: "Entertainment" },
  { icon: "▧", label: "Art & Culture" },
  { icon: "✦", label: "Lifestyle" },
];

type DnaItem = {
  name: string;
  count: number;
};
type Opportunity = {
  name: string;
  opportunityScore: number;
  culturalMatch: number;
  whiteSpace: number;
  nearbyMatches: number;
  strongestSignals: {
    name: string;
    strength: number;
  }[];
};
type ComparisonAnalysis = {
  label: string;
  address: string;
  longitude: number;
  latitude: number;
  neighborhoodDna: DnaItem[];
  culturalFitIndex: number | null;
  selectedOpportunity: Opportunity | null;
};
type SavedAnalysis = {
  id: string;
  label: string;
  address: string;
  selectedConcept: string;
  neighborhoodDna: DnaItem[];
  culturalFitIndex: number | null;
  selectedOpportunity: Opportunity | null;
  savedAt: string;
};
export default function Home() {
  const [selectedConcept, setSelectedConcept] = useState("Restaurant");
  const [address, setAddress] = useState("520 Broadway, SoHo, New York");
const [longitude, setLongitude] = useState(-74.0007);
const [latitude, setLatitude] = useState(40.7233);
const [dna, setDna] = useState<DnaItem[]>([]);
const [culturalFitIndex, setCulturalFitIndex] = useState<number | null>(null);
const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
const [showOpportunities, setShowOpportunities] = useState(false);
const [selectedOpportunity, setSelectedOpportunity] =
  useState<Opportunity | null>(null);
const [analyzing, setAnalyzing] = useState(false);
const [analysisError, setAnalysisError] = useState<string | null>(null);
const [activeTab, setActiveTab] =
  useState<"analyze" | "compare" | "saved" | "about">("analyze");
const [locationLabel, setLocationLabel] = useState("SoHo");
const [searching, setSearching] = useState(false);
const [comparisonAnalysis, setComparisonAnalysis] =
  useState<ComparisonAnalysis | null>(null);
const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

const [compareAddress, setCompareAddress] = useState("");
const [comparing, setComparing] = useState(false);
async function analyzeLocation(lng: number, lat: number) {
  setAnalyzing(true);
  setAnalysisError(null);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    body: JSON.stringify({
  longitude: lng,
  latitude: lat,
  selectedConcept,
}),
    });

    const data = await response.json();

  if (!response.ok) {
  setAnalysisError(
    "We couldn't analyze this location right now. Please try again."
  );

  setDna([]);
  setCulturalFitIndex(null);
  setOpportunities([]);
  setSelectedOpportunity(null);

  return;
}
const incomingDna = Array.isArray(data?.neighborhoodDna)
  ? data.neighborhoodDna
  : [];

if (
  (typeof data?.placeCount === "number" && data.placeCount === 0) ||
  incomingDna.length === 0
) {
  setAnalysisError(
    "We couldn't find enough cultural data for this location. Try a nearby neighborhood or broader area."
  );

  setDna([]);
  setCulturalFitIndex(null);
  setOpportunities([]);
  setSelectedOpportunity(null);

  return;
}
setAnalysisError(null);

    setDna(
      Array.isArray(data?.neighborhoodDna)
        ? data.neighborhoodDna
        : []
    );
    
    setCulturalFitIndex(
  typeof data?.culturalFitIndex === "number"
    ? data.culturalFitIndex
    : null
);
setOpportunities(
  Array.isArray(data?.opportunities)
    ? data.opportunities
    : []
);


setSelectedOpportunity(
  data?.selectedOpportunity ?? null
);
  } catch (error) {
    console.error("Neighborhood DNA error:", error);

setAnalysisError(
  "We couldn't analyze this location right now. Please try again."
);

    setDna([]);
  } finally {
    setAnalyzing(false);
  }
}

useEffect(() => {
  void analyzeLocation(longitude, latitude);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [longitude, latitude, selectedConcept]);
useEffect(() => {
  const stored = localStorage.getItem("spotu-saved-analyses");

  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      setSavedAnalyses(parsed);
    }
  } catch (error) {
    console.error("Could not load saved SpotU analyses:", error);
  }
}, []);

async function searchLocation() {
  if (!address.trim()) return;

  setSearching(true);

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
        address
      )}&limit=1&access_token=${token}`
    );

    const data = await response.json();

    if (!response.ok) {
  setAnalysisError(
    "We couldn't analyze this location right now. Please try again."
  );

  setDna([]);
  setCulturalFitIndex(null);
  setOpportunities([]);
  setSelectedOpportunity(null);

  return;
}

setAnalysisError(null);

    if (!data.features?.length) {
      alert("Location not found. Try another address or neighborhood.");
      return;
    }

    const result = data.features[0];
    const resultText = [
  result.properties?.name,
  result.properties?.name_preferred,
  result.properties?.full_address,
  result.properties?.place_formatted,
]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

const queryWords = address
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter((word) => word.length >= 3);

const looksRelated = queryWords.some((word) =>
  resultText.includes(word)
);

if (!looksRelated) {
  alert("Location not found. Try another address or neighborhood.");
  return;
}
    const coordinates = result.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      alert("SpotU could not read this location.");
      return;
    }

    const [lng, lat] = coordinates;

    setLongitude(lng);
    setLatitude(lat);

    setLocationLabel(
      result.properties?.name_preferred ||
        result.properties?.name ||
        result.properties?.full_address ||
        address
    );

    setShowOpportunities(false);
  } catch (error) {
    console.error("Location search error:", error);
    alert("Something went wrong while searching.");
  } finally {
    setSearching(false);
  }
}

async function compareLocation() {
  if (!compareAddress.trim()) return;

  setComparing(true);

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const geocodeResponse = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
        compareAddress
      )}&limit=1&access_token=${token}`
    );

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.features?.length) {
      alert("Comparison location not found.");
      return;
    }

    const result = geocodeData.features[0];
    const coordinates = result.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      alert("SpotU could not read the comparison location.");
      return;
    }

    const [lng, lat] = coordinates;

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        longitude: lng,
        latitude: lat,
        selectedConcept,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Comparison analysis failed");
    }


    const label =
      result.properties?.name_preferred ||
      result.properties?.name ||
      result.properties?.full_address ||
      compareAddress;

    setComparisonAnalysis({
      label,
      address: compareAddress,
      longitude: lng,
      latitude: lat,
      neighborhoodDna: Array.isArray(data?.neighborhoodDna)
        ? data.neighborhoodDna
        : [],
      culturalFitIndex:
        typeof data?.culturalFitIndex === "number"
          ? data.culturalFitIndex
          : null,
      selectedOpportunity: data?.selectedOpportunity ?? null,
    });
  } catch (error) {
    console.error("Comparison error:", error);
    alert("Something went wrong while comparing this location.");
  } finally {
    setComparing(false);
  }
}
function saveCurrentAnalysis() {
  const currentAddressKey = address.trim().toLowerCase();

  setSavedAnalyses((current) => {
    const isAlreadySaved = current.some(
      (saved) =>
        saved.address.trim().toLowerCase() === currentAddressKey &&
        saved.selectedConcept === selectedConcept
    );

    let updated: SavedAnalysis[];

    if (isAlreadySaved) {
      updated = current.filter(
        (saved) =>
          !(
            saved.address.trim().toLowerCase() === currentAddressKey &&
            saved.selectedConcept === selectedConcept
          )
      );
    } else {
      const newSavedAnalysis: SavedAnalysis = {
        id: `${Date.now()}`,
        label: locationLabel,
        address,
        selectedConcept,
        neighborhoodDna: dna,
        culturalFitIndex,
        selectedOpportunity,
        savedAt: new Date().toISOString(),
      };

      updated = [
        newSavedAnalysis,
        ...current,
      ];
    }

    localStorage.setItem(
      "spotu-saved-analyses",
      JSON.stringify(updated)
    );

    return updated;
  });
}
const isCurrentAnalysisSaved = savedAnalyses.some(
  (saved) =>
    saved.address.trim().toLowerCase() ===
      address.trim().toLowerCase() &&
    saved.selectedConcept === selectedConcept
);
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#0b1739]">
      {/* Header */}
      <header className="mx-4 mt-3 flex h-[64px] items-center justify-between rounded-2xl border border-slate-100 bg-white px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] text-lg font-bold text-white">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SpotU</span>
        </div>

        <nav className="flex items-center gap-10 text-sm font-medium text-[#52617c]">
          <button
  onClick={() => setActiveTab("analyze")}
  className={`relative font-semibold transition ${
    activeTab === "analyze"
      ? "text-[#1769ff]"
      : "text-[#53627e] hover:text-[#1769ff]"
  }`}
>
  Analyze

  {activeTab === "analyze" && !showOpportunities && (
    <span className="absolute -bottom-[22px] left-0 h-[3px] w-full rounded-full bg-[#1769ff]" />
  )}
</button>
          <button
  onClick={() => setActiveTab("compare")}
  className={`relative font-semibold transition ${
    activeTab === "compare"
      ? "text-[#1769ff]"
      : "text-[#53627e] hover:text-[#1769ff]"
  }`}
>
  Compare

  {activeTab === "compare" && (
    <span className="absolute -bottom-[22px] left-0 h-[3px] w-full rounded-full bg-[#1769ff]" />
  )}
</button>
          <button
  onClick={() => setActiveTab("saved")}
  className={`relative font-semibold transition ${
    activeTab === "saved"
      ? "text-[#1769ff]"
      : "text-[#53627e] hover:text-[#1769ff]"
  }`}
>
  Saved

  {activeTab === "saved" && (
    <span className="absolute -bottom-[22px] left-0 h-[3px] w-full rounded-full bg-[#1769ff]" />
  )}
</button>
          <button
  onClick={() => {
    setShowOpportunities(false);
    setActiveTab("about");
  }}
  className={`relative font-semibold transition ${
    activeTab === "about"
      ? "text-[#1769ff]"
      : "text-[#53627e] hover:text-[#1769ff]"
  }`}
>
  About

  {activeTab === "about" && (
    <span className="absolute -bottom-[22px] left-0 h-[3px] w-full rounded-full bg-[#1769ff]" />
  )}
</button>
        </nav>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4ff] text-sm font-semibold text-[#1769ff]">
          AY
        </div>
      </header>

      {/* Main 3-column layout */}
      {activeTab === "analyze" && (
      <section className="mx-4 mb-4 mt-2 grid min-h-[calc(100vh-95px)] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-sm xl:grid-cols-[350px_minmax(520px,1fr)_430px]">
        {/* LEFT */}
        <aside className="border-b border-slate-100 p-6 xl:border-b-0 xl:border-r xl:p-8">

          <h1 className="max-w-[260px] font-serif text-[48px] font-semibold leading-[0.98] tracking-tight text-[#0a1535]">
            What belongs here?
          </h1>

          <p className="mt-5 max-w-[285px] text-[17px] leading-7 text-[#53627e]">
            Find the strongest business opportunity for any space using cultural
            intelligence from Qloo.
          </p>

          {/* Location */}
          <div className="mt-7 flex overflow-hidden rounded-xl border border-[#dfe6f0] bg-white shadow-sm">
            <div className="flex flex-1 items-center gap-3 px-4">
              <span className="text-lg text-[#62728e]">●</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-transparent text-sm text-[#172341] outline-none"
              />
            </div>

          <button
  onClick={searchLocation}
  disabled={searching}
  className="m-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2f7df6] text-2xl text-white transition hover:bg-[#1769ff] disabled:opacity-50"
>
  {searching ? "…" : "→"}
</button>
          </div>
{analysisError && (
  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
    {analysisError}
  </div>
)}
          <p className="mt-5 text-sm text-[#667590]">Or try an example</p>

          {/* Examples */}
          <div className="mt-3 space-y-3">
            <button className="flex w-full items-center gap-4 rounded-xl border border-[#e1e6ee] bg-white p-3 text-left transition hover:border-[#abcaff] hover:shadow-sm">
              <div className="h-[62px] w-[82px] rounded-lg bg-gradient-to-br from-[#e6c8ad] via-[#f2dbc7] to-[#b47d58]" />
              <div className="flex-1">
                <p className="font-semibold">SoHo</p>
                <p className="mt-1 text-sm text-[#667590]">New York, NY</p>
              </div>
              <span className="text-xl text-[#73819b]">›</span>
            </button>

            <button className="flex w-full items-center gap-4 rounded-xl border border-[#e1e6ee] bg-white p-3 text-left transition hover:border-[#abcaff] hover:shadow-sm">
              <div className="h-[62px] w-[82px] rounded-lg bg-gradient-to-br from-[#c7775d] via-[#e8b08e] to-[#726b61]" />
              <div className="flex-1">
                <p className="font-semibold">Lower East Side</p>
                <p className="mt-1 text-sm text-[#667590]">New York, NY</p>
              </div>
              <span className="text-xl text-[#73819b]">›</span>
            </button>
          </div>

          <div className="my-6 h-px bg-[#e7ebf1]" />

          <p className="mb-3 text-sm text-[#667590]">Popular concepts</p>

          <div className="grid grid-cols-2 gap-2">
            {concepts.map((concept) => {
              const selected = concept.label === selectedConcept;

              return (
                <button
                  key={concept.label}
                  onClick={() => setSelectedConcept(concept.label)}
                  className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm transition ${
                    selected
                      ? "border-[#4389ff] bg-[#f3f7ff] text-[#1769ff]"
                      : "border-[#e2e7ef] bg-white text-[#31415f] hover:border-[#b9c9df]"
                  }`}
                >
                  <span>{concept.icon}</span>
                  <span>{concept.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER MAP */}
        <div className="relative min-h-[520px] overflow-hidden xl:min-h-[760px]">
<SpotMap
  longitude={longitude}
  latitude={latitude}
  label={locationLabel}
  onSearchArea={async (lng, lat, label) => {
    setLongitude(lng);
    setLatitude(lat);
    setLocationLabel(label);
    setAddress(label);
    setShowOpportunities(false);

    await analyzeLocation(lng, lat);
  }}
/>
</div>
        

        {/* RIGHT */}
        <aside className="border-t border-slate-100 bg-[#fbfcfe] p-6 xl:border-l xl:border-t-0 xl:p-8">
          <div className="rounded-2xl border border-[#e7ebf2] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-[38px] font-semibold leading-tight tracking-tight">
                  {locationLabel}
                </h2>
                <p className="mt-2 leading-6 text-[#65738d]">
                Search complete. Analyze this location to discover its cultural signals and strongest business opportunities.
                </p>
              </div>

              <button
  type="button"
  onClick={saveCurrentAnalysis}
  aria-label={
    isCurrentAnalysisSaved
      ? "Analysis saved"
      : "Save analysis"
  }
  className="mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl transition"
  style={{
    color: isCurrentAnalysisSaved ? "#ef4444" : "#8290a7",
    borderColor: isCurrentAnalysisSaved ? "#fecaca" : "#e3e8f0",
    backgroundColor: isCurrentAnalysisSaved ? "#fef2f2" : "#ffffff",
  }}
>
  {isCurrentAnalysisSaved ? "♥" : "♡"}
</button>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <h3 className="text-lg font-bold">Neighborhood DNA</h3>

              <div className="flex items-center gap-2 text-xs text-[#78859d]">
                <span>Powered by</span>
                <span className="text-base font-bold text-[#1769ff]">Qloo</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {dna.map((item) => (
  <div
    key={item.name}
    className="..."
  >
    {item.name}
  </div>
))}
            </div>

            <div className="mt-6 rounded-xl border border-[#e3e8f0] p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Cultural Fit Index</h3>
                <span className="text-xs text-[#8290a7]">ⓘ</span>
              </div>

              <div className="mt-5 grid grid-cols-[135px_1fr] items-center gap-5">
                <div className="relative flex h-[128px] w-[128px] items-center justify-center rounded-full bg-[conic-gradient(#347df6_0deg,#347df6_331deg,#dbe8ff_331deg)]">
                  <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-4xl font-bold">{culturalFitIndex ?? "—"}</span>
                    <span className="text-xs text-[#748198]">out of 100</span>
                  </div>
                </div>

                <p className="border-l border-[#dfe5ed] pl-5 text-sm leading-6 text-[#53627d]">
                  Strong and distinct cultural identity, with high affinity for
                  dining, design, shopping and lifestyle experiences.
                </p>
              </div>
            </div>

            <button
  type="button"
  onClick={() => setShowOpportunities(true)}
  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1769ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ce0] active:scale-[0.99]"
>
  Analyze opportunities
  <span className="text-lg">→</span>
</button>
          {selectedOpportunity && (
  <div className="mt-4 rounded-xl border border-[#dbe7ff] bg-[#f7faff] p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-[#2f7df6]">
      Your selected concept
    </div>

    <div className="mt-2 flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-bold text-[#172341]">
          {selectedOpportunity.name}
        </div>

        <div className="mt-1 text-xs text-[#65738d]">
          How this idea fits the selected location
        </div>
      </div>

      <div className="text-right">
        <div className="text-3xl font-bold text-[#172341]">
          {selectedOpportunity.opportunityScore}
        </div>

        <div className="text-[10px] text-[#8290a7]">
          opportunity score
        </div>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-lg bg-white p-3">
        <div className="text-[#8290a7]">Cultural Match</div>
        <div className="mt-1 font-bold text-[#172341]">
          {selectedOpportunity.culturalMatch}
        </div>
      </div>

      <div className="rounded-lg bg-white p-3">
        <div className="text-[#8290a7]">Market Gap Signal</div>
        <div className="mt-1 font-bold text-[#172341]">
          {selectedOpportunity.whiteSpace}
        </div>
      </div>
    </div>
  </div>
)}
          {showOpportunities && (
  <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f4f7fb] px-6 pb-6 pt-28 lg:px-12 xl:px-24 2xl:px-40">
<div className="fixed left-0 right-0 top-0 z-50 flex h-20 items-center justify-end border-b border-[#e3e8f0] bg-[#f4f7fb] px-6 lg:px-12 xl:px-24 2xl:px-40">

  <button
    type="button"
    onClick={() => setShowOpportunities(false)}
    aria-label="Close results"
    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e3e8f0] bg-white text-lg text-[#53627e] shadow-sm transition hover:border-[#1769ff] hover:text-[#1769ff]"
  >
    ×
  </button>
</div>

<div className="mb-6">
  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1769ff]">
    Location analysis
  </div>

  <div className="mt-2 flex items-end justify-between gap-4">
    <div>
      <h1 className="font-serif text-[38px] font-semibold tracking-tight text-[#0a1535]">
        Top opportunities for {locationLabel}
      </h1>

      <p className="mt-2 text-sm text-[#65738d]">
        Ranked using Qloo cultural intelligence and local market signals.
      </p>
    </div>

    <span className="shrink-0 text-xs font-semibold text-[#1769ff]">
      Powered by Qloo
    </span>
  </div>
</div>


    {opportunities.slice(0, 3).map((opportunity, index) => (
      <div
        key={opportunity.name}
        className="rounded-xl border border-[#e3e8f0] bg-white p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#2f7df6]">
              #{index + 1}
            </div>

            <div className="mt-1 text-base font-bold text-[#172341]">
              {opportunity.name}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-[#172341]">
              {opportunity.opportunityScore}
            </div>

            <div className="text-[10px] text-[#8290a7]">
              opportunity score
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-[#8290a7]">Cultural Match</div>
            <div className="mt-1 font-bold text-[#172341]">
              {opportunity.culturalMatch}
            </div>
          </div>

          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-[#8290a7]">Market Gap Signal</div>
            <div className="mt-1 font-bold text-[#172341]">
              {opportunity.whiteSpace}
            </div>
          </div>
        </div>

        {opportunity.strongestSignals.length > 0 && (
          <div className="mt-3 text-xs text-[#65738d]">
            Strongest signals:{" "}
            {opportunity.strongestSignals
              .map((signal) => signal.name)
              .join(" · ")}
          </div>
        )}
        <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#65738d]">
  <span className="font-semibold text-[#172341]">
    Why it fits:
  </span>{" "}
  Strong{" "}
  {opportunity.strongestSignals
    .slice(0, 2)
    .map((signal) => signal.name)
    .join(" and ")}{" "}
  signals suggest strong cultural alignment, while a Market Gap Signal of{" "}
  {opportunity.whiteSpace} indicates relative underrepresentation among nearby places.
</div>
      </div>
    ))}
  </div>
)}

            <p className="mt-3 text-center text-xs leading-5 text-[#8591a5]">
              SpotU will use Qloo to analyze this location and suggest the best
              business concepts.
            </p>
          </div>
        </aside>
      </section>
      )}
      {activeTab === "compare" && (
  <section className="mx-4 mb-4 mt-2 rounded-2xl bg-white p-8 shadow-sm">
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2f7df6]">
        Compare locations
      </div>

      <h1 className="mt-2 font-serif text-4xl font-semibold text-[#0a1535]">
        Where does {selectedConcept} fit better?
      </h1>

      <p className="mt-2 text-sm text-[#65738d]">
        Compare cultural fit and opportunity signals across two locations.
      </p>
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      {/* LOCATION A */}
      <div className="rounded-xl border border-[#dfe5ed] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8290a7]">
          Location A
        </div>

        <div className="mt-2 text-2xl font-bold text-[#172341]">
          {locationLabel}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-xs text-[#8290a7]">
              Cultural Fit
            </div>
            <div className="mt-1 text-xl font-bold text-[#172341]">
              {culturalFitIndex ?? "—"}
            </div>
          </div>

          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-xs text-[#8290a7]">
              {selectedConcept} Opportunity
            </div>
            <div className="mt-1 text-xl font-bold text-[#172341]">
              {selectedOpportunity?.opportunityScore ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {dna.slice(0, 6).map((item) => (
            <span
              key={item.name}
              className="rounded-full bg-[#f2f6fc] px-3 py-1 text-xs text-[#53627e]"
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* LOCATION B */}
      <div className="rounded-xl border border-[#dfe5ed] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8290a7]">
          Location B
        </div>

        <div className="mt-3 flex overflow-hidden rounded-xl border border-[#dfe6f0] bg-white">
          <input
            value={compareAddress}
            onChange={(e) => setCompareAddress(e.target.value)}
            placeholder="Search another location"
            className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
          />

          <button
            onClick={compareLocation}
            disabled={comparing}
            className="bg-[#2f7df6] px-5 text-sm font-semibold text-white"
          >
            {comparing ? "..." : "Compare"}
          </button>
        </div>

        {comparisonAnalysis ? (
          <>
            <div className="mt-5 text-2xl font-bold text-[#172341]">
              {comparisonAnalysis.label}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#f6f8fb] p-3">
                <div className="text-xs text-[#8290a7]">
                  Cultural Fit
                </div>
                <div className="mt-1 text-xl font-bold text-[#172341]">
                  {comparisonAnalysis.culturalFitIndex ?? "—"}
                </div>
              </div>

              <div className="rounded-lg bg-[#f6f8fb] p-3">
                <div className="text-xs text-[#8290a7]">
                  {selectedConcept} Opportunity
                </div>
                <div className="mt-1 text-xl font-bold text-[#172341]">
                  {comparisonAnalysis.selectedOpportunity?.opportunityScore ??
                    "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {comparisonAnalysis.neighborhoodDna
                .slice(0, 6)
                .map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full bg-[#f2f6fc] px-3 py-1 text-xs text-[#53627e]"
                  >
                    {item.name}
                  </span>
                ))}
            </div>
          </>
        ) : (
          <div className="mt-6 text-sm text-[#8290a7]">
            Search a second location to compare it with {locationLabel}.
          </div>
        )}
      </div>
    </div>
  </section>
)}
{activeTab === "saved" && (
  <section className="mx-4 mb-4 mt-2 rounded-2xl bg-white p-8 shadow-sm">
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2f7df6]">
        Saved analyses
      </div>

      <h1 className="mt-2 font-serif text-4xl font-semibold text-[#0a1535]">
        Your saved SpotU insights
      </h1>

      <p className="mt-2 text-sm text-[#65738d]">
        Revisit the locations and concepts you’ve saved.
      </p>
    </div>

    {savedAnalyses.length === 0 ? (
      <div className="mt-8 rounded-xl border border-dashed border-[#dfe5ed] p-8 text-center text-sm text-[#8290a7]">
        No saved analyses yet. Use the ♡ button on an analysis to save one.
      </div>
    ) : (
      <div className="mt-8 grid gap-4">
        {savedAnalyses.map((saved) => (
          <div
            key={saved.id}
            className="rounded-xl border border-[#dfe5ed] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#8290a7]">
                  {saved.selectedConcept}
                </div>

                <div className="mt-1 text-2xl font-bold text-[#172341]">
                  {saved.label}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#8290a7]">
                  Opportunity Score
                </div>

                <div className="mt-1 text-2xl font-bold text-[#172341]">
                  {saved.selectedOpportunity?.opportunityScore ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#f6f8fb] p-3">
                <div className="text-xs text-[#8290a7]">
                  Cultural Fit
                </div>
                <div className="mt-1 font-bold text-[#172341]">
                  {saved.culturalFitIndex ?? "—"}
                </div>
              </div>

              <div className="rounded-lg bg-[#f6f8fb] p-3">
                <div className="text-xs text-[#8290a7]">
                  Whitespace Signal
                </div>
                <div className="mt-1 font-bold text-[#172341]">
                  {saved.selectedOpportunity?.whiteSpace ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {saved.neighborhoodDna.slice(0, 6).map((item) => (
                <span
                  key={item.name}
                  className="rounded-full bg-[#f2f6fc] px-3 py-1 text-xs text-[#53627e]"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}
{activeTab === "about" && (
  <section className="mx-4 mb-4 mt-2 rounded-2xl bg-white px-6 py-10 shadow-sm md:px-10">
    <div className="mx-auto max-w-5xl">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1769ff]">
        About SpotU
      </div>

      <h1 className="mt-3 max-w-3xl font-serif text-[44px] font-semibold leading-tight tracking-tight text-[#0a1535]">
        Find what belongs in a location.
      </h1>

      <p className="mt-5 max-w-3xl text-[17px] leading-7 text-[#65738d]">
        SpotU helps founders, operators, and property decision-makers understand
        which business concepts fit a location using cultural intelligence
        powered by Qloo.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e3e8f0] bg-[#f8fafc] p-6">
          <div className="text-sm font-bold text-[#172341]">
            Cultural Fit
          </div>
          <p className="mt-3 text-sm leading-6 text-[#65738d]">
            Measures how strongly the overall cultural identity of a location
            stands out based on nearby Qloo signals.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e3e8f0] bg-[#f8fafc] p-6">
          <div className="text-sm font-bold text-[#172341]">
            Cultural Match
          </div>
          <p className="mt-3 text-sm leading-6 text-[#65738d]">
            Shows how closely a selected business concept aligns with the
            cultural characteristics of that location.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e3e8f0] bg-[#f8fafc] p-6">
          <div className="text-sm font-bold text-[#172341]">
            Market Gap Signal
          </div>
          <p className="mt-3 text-sm leading-6 text-[#65738d]">
            Indicates relative underrepresentation of a concept among nearby
            places. A higher signal can suggest more room in the local market.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-[#dbe7ff] bg-[#f4f8ff] p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1769ff]">
              Powered by Qloo
            </div>

            <h2 className="mt-2 text-xl font-bold text-[#172341]">
              Cultural intelligence, not just location data.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#65738d]">
              SpotU uses Qloo-powered cultural signals to understand the
              character of an area, compare concepts, and rank potential
              opportunities.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs leading-5 text-[#8290a7]">
        Market Gap Signal represents relative underrepresentation in SpotU's
        analysis. It does not represent commercial vacancy, available real
        estate, or guaranteed business demand.
      </p>
    </div>
  </section>
)}
    </main>
  );
}