"use client";

import { useEffect, useState } from "react";
import SpotMap from "@/components/SpotMap";
import {
  Utensils,
  Coffee,
  Wine,
  ShoppingBag,
  HeartPulse,
  Music2,
  Palette,
  Sparkles,
} from "lucide-react";

const concepts = [
  { icon: Utensils, label: "Restaurant" },
  { icon: Coffee, label: "Café" },
  { icon: Wine, label: "Bar / Wine" },
  { icon: ShoppingBag, label: "Retail" },
  { icon: HeartPulse, label: "Wellness" },
  { icon: Music2, label: "Entertainment" },
  { icon: Palette, label: "Art & Culture" },
  { icon: Sparkles, label: "Lifestyle" },
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
  locationImage?: string | null;
  imagePlaceName?: string | null;
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
const [locationImage, setLocationImage] = useState<string | null>(null);
const [imagePlaceName, setImagePlaceName] = useState<string | null>(null);
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

setLocationImage(data.locationImage ?? null);
setImagePlaceName(data.imagePlaceName ?? null);

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
        locationImage,
imagePlaceName,
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
function removeSavedAnalysis(id: string) {
  setSavedAnalyses((current) => {
    const updated = current.filter((saved) => saved.id !== id);

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
        <div className="flex items-center gap-2.5">
  <div className="relative flex h-9 w-8 items-center justify-center">
    <svg
      viewBox="0 0 32 40"
      className="h-9 w-8"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 1C8.82 1 3 6.82 3 14c0 9.5 13 24 13 24s13-14.5 13-24C29 6.82 23.18 1 16 1Z"
        fill="#1769FF"
      />
      <path
        d="M16 8.5l1.8 4.1 4.2 1.9-4.2 1.8L16 20.5l-1.8-4.2-4.2-1.8 4.2-1.9L16 8.5Z"
        fill="white"
      />
    </svg>
  </div>

  <span className="text-[22px] font-semibold tracking-[-0.035em] text-[#0a1535]">
    SpotU
  </span>
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
      <section className="mx-4 mb-4 mt-2 grid grid-cols-1 gap-4 xl:grid-cols-[330px_minmax(600px,1fr)_390px]">
        {/* LEFT */}
        <aside className="border-b border-[#e6edf7] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_58%)] p-6 xl:border-b-0 xl:border-r xl:p-8">

          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1769ff]">
  Qloo-powered Opportunity Agent
</div>

<h1 className="mt-3 max-w-[320px] text-[48px] font-bold leading-[0.98] tracking-[-0.04em] text-[#0a1535]">
  Find the right business for the{" "}
  <span className="text-[#1769ff]">right place.</span>
</h1>

<p className="mt-5 max-w-[320px] text-[16px] leading-7 text-[#5f6f89]">
  Use Qloo-powered cultural intelligence to understand a neighborhood,
  compare business ideas, and see which concepts stand out.
</p>

          {/* Location */}
          <div className="mt-7 flex items-center gap-2 rounded-2xl border border-[#d9e4f2] bg-white p-2 shadow-[0_8px_30px_rgba(23,105,255,0.08)]">
  <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#1769ff]">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    </div>

    <input
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Search a neighborhood or address"
      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#172341] outline-none placeholder:text-[#97a4b8]"
    />
  </div>

  <button
    onClick={searchLocation}
    disabled={searching}
    className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#1769ff] px-5 text-sm font-semibold text-white transition hover:bg-[#0f5de8] disabled:opacity-50"
  >
    {searching ? "Searching..." : "Analyze"}
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
              <img
  src="https://images.qloo.com/i/FCE8B172-4795-43E4-B222-3B550DC05FD9-420x-auto.jpg"
  alt="SoHo"
  className="h-[62px] w-[82px] shrink-0 rounded-lg object-cover"
/>
              <div className="flex-1">
                <p className="font-semibold">SoHo</p>
                <p className="mt-1 text-sm text-[#667590]">New York, NY</p>
              </div>
              <span className="text-xl text-[#73819b]">›</span>
            </button>

            <button className="flex w-full items-center gap-4 rounded-xl border border-[#e1e6ee] bg-white p-3 text-left transition hover:border-[#abcaff] hover:shadow-sm">
              <img
  src="https://images.qloo.com/i/0C9F87C9-6DF4-462E-B527-E2C53D2CC6D0-420x-auto.jpg"
  alt="Lower East Side – Beauty & Essex"
  className="h-[62px] w-[82px] rounded-lg object-cover"
/>
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
                  <concept.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{concept.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER MAP */}
<div className="relative min-h-[520px] bg-[#eef4fb] p-4 xl:min-h-[760px]">
  <div className="absolute inset-4 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(35,70,120,0.12)]">
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
</div>
        

        {/* RIGHT */}
        <aside className="border-t border-[#e6edf7] bg-[#f5f9ff] p-4 xl:border-l xl:border-t-0">
  <div className="h-full rounded-[28px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(35,70,120,0.08)]">
            <div className="flex items-start justify-between">
              <div>
  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1769ff]">
    <span className="h-2 w-2 rounded-full bg-[#1769ff]" />
    Location intelligence
  </div>

  <h2 className="mt-3 text-[36px] font-bold leading-tight tracking-[-0.04em] text-[#0a1535]">
    {locationLabel}
  </h2>

  <p className="mt-2 max-w-[340px] text-sm leading-6 text-[#65738d]">
    Cultural signals, nearby context, and business opportunities for this area.
  </p>
                {locationImage && (
  <div className="mt-5 overflow-hidden rounded-2xl border border-[#e5edf7] bg-[#f8fbff]">
    <img
      src={locationImage}
      alt={imagePlaceName || locationLabel}
      className="h-44 w-full object-cover"
    />

    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8390a6]">
          Nearby Qloo place
        </div>

        <div className="mt-1 text-sm font-semibold text-[#172341]">
          {imagePlaceName || locationLabel}
        </div>
      </div>

      <div className="rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[#1769ff]">
        Qloo
      </div>
    </div>
  </div>
)}
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
  <svg
  viewBox="0 0 24 24"
  className="h-5 w-5"
  fill={isCurrentAnalysisSaved ? "currentColor" : "none"}
  stroke="currentColor"
  strokeWidth={2}
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
  />
</svg>
</button>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <h3 className="text-lg font-bold">Neighborhood DNA</h3>

              <div className="flex items-center gap-2 text-xs text-[#78859d]">
                <span>Powered by</span>
                <span className="text-base font-bold text-[#1769ff]">Qloo</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
  {dna.slice(0, 8).map((item, index) => (
    <div
      key={item.name}
      className={`rounded-full border px-3 py-2 text-sm font-medium ${
        index < 3
          ? "border-[#cfe0ff] bg-[#eef5ff] text-[#1769ff]"
          : "border-[#e3e9f2] bg-[#f8fafc] text-[#5f6f89]"
      }`}
    >
      {item.name}
    </div>
  ))}
</div>
<button
  type="button"
  onClick={() => setShowOpportunities(true)}
  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1769ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ce0] active:scale-[0.99]"
>
  View Agent Recommendations
  <span className="text-lg">→</span>
</button>
<div className="mt-6">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-bold text-[#172341]">
      Top opportunities
    </h3>

    <span className="text-xs font-medium text-[#8290a7]">
      Ranked by SpotU
    </span>
  </div>

  <div className="mt-3 space-y-2">
    {opportunities.slice(0, 3).map((opportunity, index) => (
      <div
        key={opportunity.name}
        className="flex items-center justify-between rounded-2xl border border-[#dce8fa] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] px-4 py-3 shadow-[0_6px_18px_rgba(23,105,255,0.05)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef5ff] text-xs font-bold text-[#1769ff]">
            {index + 1}
          </div>

          <div>
            <div className="text-sm font-semibold text-[#172341]">
              {opportunity.name}
            </div>

            <div className="mt-0.5 text-xs text-[#8290a7]">
              Cultural Match {opportunity.culturalMatch}
            </div>
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-sm font-bold text-[#1769ff]">
          {opportunity.opportunityScore}
        </div>
      </div>
    ))}
  </div>
</div>

             
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
        className={`rounded-xl border p-4 transition ${
  index === 0
    ? "border-[#b9d2ff] bg-[#f8fbff] shadow-[0_10px_30px_rgba(23,105,255,0.08)]"
    : "border-[#e3e8f0] bg-white"
}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#2f7df6]">
  {index === 0 ? "SpotU recommendation" : `#${index + 1}`}
</div>

            <div className="mt-1 text-xl font-bold text-[#172341]">
              {opportunity.name}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-[#172341]">
              {opportunity.opportunityScore}
            </div>

            <div className="text-xs text-[#8290a7]">
              opportunity score
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-base">
          <div className="rounded-lg bg-[#f6f8fb] p-4">
  <div className="text-sm text-[#8290a7]">Cultural Match</div>
  <div className="mt-2 text-lg font-bold text-[#172341]">
    {opportunity.culturalMatch}
  </div>
</div>

          <div className="rounded-lg bg-[#f6f8fb] p-4">
            <div className="text-[#8290a7]">Market Gap Signal</div>
            <div className="mt-2 font-bold text-[#172341]">
              {opportunity.whiteSpace}
            </div>
          </div>
        </div>

        {opportunity.strongestSignals.length > 0 && (
          <div className="mt-4">
  <div className="text-sm font-semibold text-[#65738d]">
    Strongest signals
  </div>

  <div className="mt-2 flex flex-wrap gap-2">
    {opportunity.strongestSignals.map((signal) => (
      <span
        key={signal.name}
        className="rounded-full border border-[#dbe7ff] bg-[#f4f8ff] px-3 py-1.5 text-sm font-medium text-[#1769ff]"
      >
        {signal.name}
      </span>
    ))}
  </div>
</div>
        )}
        <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm leading-5 text-[#65738d]">
  <span className="font-semibold text-[#172341]">
    {index === 0 ? "Why SpotU recommends this:" : "Why it fits:"}
  </span>{" "}
  Strong{" "}
  {opportunity.strongestSignals
    .slice(0, 2)
    .map((signal) => signal.name)
    .join(" and ")}{" "}
  signals suggest strong cultural alignment, while a Market Gap Signal of{" "}
  {opportunity.whiteSpace} indicates relative underrepresentation among nearby places.
</div>
{index === 0 && (
  <div className="mt-4 rounded-xl border border-[#dbe7ff] bg-white p-4">
    <div className="text-sm font-semibold text-[#172341]">
      How SpotU decided
    </div>

    <div className="mt-3 space-y-2 text-base leading-6 text-[#65738d]">
      <div>✓ Read this location&apos;s Qloo cultural signals</div>

      <div>
        ✓ Identified strongest signals:{" "}
        {opportunity.strongestSignals
          .slice(0, 3)
          .map((signal) => signal.name)
          .join(" · ")}
      </div>

      <div>
        ✓ Evaluated {opportunities.length} business concepts
      </div>

      <div>
        ✓ Compared Cultural Match with relative Market Gap Signal
      </div>

      <div className="font-semibold text-[#172341]">
        ✓ Recommended {opportunity.name} — opportunity score{" "}
        {opportunity.opportunityScore}
      </div>
    </div>
  </div>
)}
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
  <section className="mx-4 mb-4 mt-2 rounded-[28px] border border-[#e5edf7] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] p-8 shadow-[0_12px_40px_rgba(35,70,120,0.06)]">
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2f7df6]">
        Compare locations
      </div>

      <h1 className="mt-2 text-[40px] font-bold tracking-[-0.04em] text-[#0a1535]">
  Compare locations side by side.
</h1>
<p className="mt-3 max-w-2xl text-base leading-7 text-[#65738d]">
  See how the same business concept performs across different neighborhoods.
  </p>
  <div className="mt-7 flex max-w-2xl overflow-hidden rounded-2xl border border-[#dbe7ff] bg-white p-1.5 shadow-[0_8px_24px_rgba(23,105,255,0.08)]">
  <input
    value={compareAddress}
    onChange={(e) => setCompareAddress(e.target.value)}
    placeholder="Search another location to compare"
    className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[#97a4b8]"
  />

  <button
    onClick={compareLocation}
    disabled={comparing}
    className="rounded-xl bg-[#1769ff] px-6 text-sm font-semibold text-white transition hover:bg-[#0f5de8]"
  >
    {comparing ? "..." : "Compare"}
  </button>
</div>
<div className="mt-6">
  <div className="flex items-center justify-between">
    <div className="text-sm font-semibold text-[#172341]">
      Choose a concept
    </div>
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    {concepts.map((concept) => {
      const selected = concept.label === selectedConcept;

      return (
        <button
          key={concept.label}
          type="button"
          onClick={() => setSelectedConcept(concept.label)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            selected
              ? "border-[#1769ff] bg-[#eef5ff] text-[#1769ff]"
              : "border-[#e1e7f0] bg-white text-[#5f6f89] hover:border-[#b9d2ff]"
          }`}
        >
          <concept.icon className="h-4 w-4" strokeWidth={1.8} />
          {concept.label}
        </button>
      );
    })}
  </div>
</div>
    </div>
  {comparisonAnalysis &&
  selectedOpportunity &&
  comparisonAnalysis.selectedOpportunity && (
  <div className="mx-auto mt-6 max-w-3xl rounded-[24px] border border-[#b9d2ff] bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_100%)] px-6 py-5 shadow-[0_10px_30px_rgba(23,105,255,0.08)]">
    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1769ff]">
      SpotU comparison
    </div>

    <div className="mt-2 text-xl font-bold text-[#172341]">
  {selectedOpportunity.opportunityScore ===
  comparisonAnalysis.selectedOpportunity.opportunityScore
    ? `Tie: ${locationLabel} and ${comparisonAnalysis.label}`
    : `Better fit: ${
        selectedOpportunity.opportunityScore >
        comparisonAnalysis.selectedOpportunity.opportunityScore
          ? locationLabel
          : comparisonAnalysis.label
      }`}
</div>

    <p className="mt-2 text-sm leading-6 text-[#65738d]">
  {Math.abs(
    selectedOpportunity.opportunityScore -
      comparisonAnalysis.selectedOpportunity.opportunityScore
  )}{" "}
  points stronger for {selectedConcept}. Strongest supporting signals:{" "}
  {(
    selectedOpportunity.opportunityScore >=
    comparisonAnalysis.selectedOpportunity.opportunityScore
      ? selectedOpportunity.strongestSignals
      : comparisonAnalysis.selectedOpportunity.strongestSignals
  )
    .slice(0, 3)
    .map((signal) => signal.name)
    .join(" · ")}
  .
</p>
  </div>
)}
    <div className="relative mt-8 grid gap-5 lg:grid-cols-2">
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dbe7ff] bg-white text-sm font-bold text-[#1769ff] shadow-[0_8px_24px_rgba(23,105,255,0.12)] lg:flex">
  VS
</div>
      {/* LOCATION A */}
      <div
  className={`self-start rounded-[24px] p-6 shadow-[0_12px_30px_rgba(35,70,120,0.08)] ${
    selectedOpportunity &&
    comparisonAnalysis?.selectedOpportunity &&
    selectedOpportunity.opportunityScore >
      comparisonAnalysis.selectedOpportunity.opportunityScore
      ? "border border-[#b9d2ff] bg-[linear-gradient(135deg,#ffffff_0%,#f6faff_100%)]"
      : "border border-white bg-white"
  }`}
>
        <div className="flex items-center justify-between">
  <div className="text-xs font-semibold uppercase tracking-wide text-[#8290a7]">
    Location A
  </div>

  {selectedOpportunity &&
    comparisonAnalysis?.selectedOpportunity &&
    selectedOpportunity.opportunityScore >
      comparisonAnalysis.selectedOpportunity.opportunityScore && (
      <div className="rounded-full bg-[#1769ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        Best fit
      </div>
    )}
</div>

        <div className="mt-2 flex items-center justify-between gap-4">
  <div>
    <div className="text-2xl font-bold text-[#172341]">
      {locationLabel}
    </div>

    <div className="mt-1 text-sm text-[#8290a7]">
      {selectedConcept}
    </div>
  </div>

  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-[#eaf2ff]">
    <div className="text-2xl font-bold text-[#1769ff]">
      {selectedOpportunity?.opportunityScore ?? "—"}
    </div>

    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8290a7]">
      Score
    </div>
  </div>
</div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-xs text-[#8290a7]">
              Cultural Fit
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-[#172341]">
  {comparisonAnalysis?.culturalFitIndex ?? "—"}
</div>
          </div>

          <div className="rounded-lg bg-[#f6f8fb] p-3">
            <div className="text-xs text-[#8290a7]">
              {selectedConcept} Opportunity
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-[#1769ff]">
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
      <div
  className={`rounded-[24px] p-6 shadow-[0_12px_30px_rgba(35,70,120,0.08)] ${
    selectedOpportunity &&
    comparisonAnalysis?.selectedOpportunity &&
    comparisonAnalysis.selectedOpportunity.opportunityScore >
      selectedOpportunity.opportunityScore
      ? "border border-[#b9d2ff] bg-[linear-gradient(135deg,#ffffff_0%,#f6faff_100%)]"
      : "border border-white bg-white"
  }`}
>
        <div className="flex items-center justify-between">
  <div className="text-xs font-semibold uppercase tracking-wide text-[#8290a7]">
    Location B
  </div>

  {selectedOpportunity &&
    comparisonAnalysis?.selectedOpportunity &&
    comparisonAnalysis.selectedOpportunity.opportunityScore >
      selectedOpportunity.opportunityScore && (
      <div className="rounded-full bg-[#1769ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        Best fit
      </div>
    )}
</div>

        {comparisonAnalysis ? (
          <>
          
            <div className="mt-5 flex items-center justify-between gap-4">
  <div>
    <div className="text-2xl font-bold text-[#172341]">
      {comparisonAnalysis.label}
    </div>

    <div className="mt-1 text-sm text-[#8290a7]">
      {selectedConcept}
    </div>
  </div>

  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-[#eaf2ff]">
    <div className="text-2xl font-bold text-[#1769ff]">
      {comparisonAnalysis.selectedOpportunity?.opportunityScore ?? "—"}
    </div>

    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8290a7]">
      Score
    </div>
  </div>
</div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#dce8fa] bg-[#f7fbff] p-4">
                <div className="text-xs text-[#8290a7]">
                  Cultural Fit
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-[#172341]">
  {culturalFitIndex ?? "—"}
</div>
              </div>

              <div className="rounded-lg bg-[#f6f8fb] p-3">
                <div className="text-xs text-[#8290a7]">
                  {selectedConcept} Opportunity
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-[#1769ff]">
  {comparisonAnalysis.selectedOpportunity?.opportunityScore ?? "—"}
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
  <section className="mx-4 mb-4 mt-2 rounded-[28px] border border-[#e5edf7] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] p-8 shadow-[0_12px_40px_rgba(35,70,120,0.06)]">
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
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {savedAnalyses.map((saved) => (
          <div
            key={saved.id}
            className="rounded-[24px] border border-white bg-white p-5 shadow-[0_12px_30px_rgba(35,70,120,0.08)]"
          >
            {saved.locationImage && (
  <div className="mb-5 overflow-hidden rounded-2xl">
    <img
      src={saved.locationImage}
      alt={saved.imagePlaceName || saved.label}
      className="h-44 w-full object-cover"
    />
  </div>
)}
            <div className="flex items-start justify-between gap-5">
  <div>
    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1769ff]">
      {saved.selectedConcept}
    </div>

    <div className="mt-1 text-2xl font-bold tracking-tight text-[#172341]">
      {saved.label}
    </div>

    {saved.imagePlaceName && (
      <div className="mt-1 text-xs text-[#8290a7]">
        Nearby Qloo place · {saved.imagePlaceName}
      </div>
    )}
  </div>

  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-[#eaf2ff]">
    <div className="text-2xl font-bold text-[#1769ff]">
      {saved.selectedOpportunity?.opportunityScore ?? "—"}
    </div>

    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8290a7]">
      Score
    </div>
  </div>
</div>

            <div className="mt-5 grid grid-cols-2 gap-3">
  <div className="rounded-2xl border border-[#dce8fa] bg-[#f7fbff] p-4">
    <div className="text-xs font-medium text-[#72819a]">
      Cultural Fit
    </div>

    <div className="mt-2 text-2xl font-bold tracking-tight text-[#172341]">
      {saved.culturalFitIndex ?? "—"}
    </div>
  </div>

  <div className="rounded-2xl border border-[#dce8fa] bg-[#f7fbff] p-4">
    <div className="text-xs font-medium text-[#72819a]">
      Market Gap
    </div>

    <div className="mt-2 text-2xl font-bold tracking-tight text-[#1769ff]">
      {saved.selectedOpportunity?.whiteSpace ?? "—"}
    </div>
  </div>
</div>

            <div className="mt-5">
  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8290a7]">
    Strongest signals
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    {saved.neighborhoodDna.slice(0, 6).map((item, index) => (
      <span
        key={item.name}
        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
          index < 3
            ? "border-[#cfe0ff] bg-[#eef5ff] text-[#1769ff]"
            : "border-[#e3e9f2] bg-[#f8fafc] text-[#5f6f89]"
        }`}
      >
        {item.name}
      </span>
    ))}
  </div>
</div>
<div className="mt-5 flex items-center justify-between border-t border-[#edf1f6] pt-4">
  <button
    type="button"
    onClick={() => removeSavedAnalysis(saved.id)}
    className="flex items-center gap-2 text-xs font-semibold text-[#ef4444] transition hover:text-[#dc2626]"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-[#ef4444] text-[#ef4444]"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
      />
    </svg>

    Unsave
  </button>

  <div className="text-xs text-[#97a4b8]">
    {new Date(saved.savedAt).toLocaleDateString()}
  </div>
</div>
          </div>
        ))}
      </div>
    )}
  </section>
)}
{activeTab === "about" && (
  <section className="mx-4 mb-4 mt-2 rounded-[28px] border border-[#e5edf7] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5ff_100%)] px-6 py-10 shadow-[0_12px_40px_rgba(35,70,120,0.06)] md:px-10">
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

      <div className="mt-10 grid gap-5 md:grid-cols-3">
  {/* CULTURAL FIT */}
  <div className="group rounded-[24px] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(35,70,120,0.07)]">
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1769ff]">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"
          />
        </svg>
      </div>

      <span className="text-xs font-bold tracking-[0.15em] text-[#b0bbca]">
        01
      </span>
    </div>

    <h3 className="mt-6 text-xl font-bold text-[#172341]">
      Cultural Fit Index
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#65738d]">
      Measures how strongly the overall cultural identity of a location stands
      out based on nearby Qloo signals.
    </p>

    <div className="mt-6 flex items-end gap-1">
      <div className="h-3 w-3 rounded-sm bg-[#dce8ff]" />
      <div className="h-5 w-3 rounded-sm bg-[#c7dbff]" />
      <div className="h-7 w-3 rounded-sm bg-[#9fc1ff]" />
      <div className="h-9 w-3 rounded-sm bg-[#6d9fff]" />
      <div className="h-11 w-3 rounded-sm bg-[#1769ff]" />
    </div>
  </div>

  {/* CULTURAL MATCH */}
  <div className="group rounded-[24px] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(35,70,120,0.07)]">
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1769ff]">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      </div>

      <span className="text-xs font-bold tracking-[0.15em] text-[#b0bbca]">
        02
      </span>
    </div>

    <h3 className="mt-6 text-xl font-bold text-[#172341]">
      Cultural Match
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#65738d]">
      Shows how closely a selected business concept aligns with the cultural
      characteristics of that location.
    </p>

    <div className="mt-7">
      <div className="h-2 overflow-hidden rounded-full bg-[#edf2f8]">
        <div className="h-full w-4/5 rounded-full bg-[#1769ff]" />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-[#9aa6b8]">
        <span>Low match</span>
        <span>Strong match</span>
      </div>
    </div>
  </div>

  {/* MARKET GAP */}
  <div className="group rounded-[24px] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(35,70,120,0.07)]">
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#1769ff]">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 18V9m5 9V5m5 13v-7m5 7V3"
          />
        </svg>
      </div>

      <span className="text-xs font-bold tracking-[0.15em] text-[#b0bbca]">
        03
      </span>
    </div>

    <h3 className="mt-6 text-xl font-bold text-[#172341]">
      Market Gap Signal
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#65738d]">
      Shows relative underrepresentation of a concept among nearby places,
      helping SpotU identify where more room may exist.
    </p>

    <div className="mt-6 grid grid-cols-5 gap-2">
      <div className="h-10 rounded-lg bg-[#dce8ff]" />
      <div className="h-10 rounded-lg bg-[#dce8ff]" />
      <div className="h-10 rounded-lg border-2 border-dashed border-[#9fc1ff] bg-white" />
      <div className="h-10 rounded-lg bg-[#dce8ff]" />
      <div className="h-10 rounded-lg bg-[#dce8ff]" />
    </div>

    <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#1769ff]">
      Relative gap
    </div>
  </div>
</div>

      <div className="mt-10 rounded-[28px] border border-[#dbe7ff] bg-white p-7 shadow-[0_12px_30px_rgba(35,70,120,0.07)]">
  <div className="flex items-center justify-between gap-4">
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1769ff]">
        Powered by Qloo
      </div>

      <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#172341]">
        From location to recommendation.
      </h3>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65738d]">
        SpotU turns Qloo cultural signals into a clear business opportunity decision.
      </p>
    </div>
  </div>

  <div className="mt-7 grid gap-4 md:grid-cols-4">
    <div className="rounded-2xl bg-[#f7fbff] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-sm font-bold text-[#1769ff]">
        1
      </div>
      <div className="mt-4 text-sm font-bold text-[#172341]">
        Choose a location
      </div>
      <div className="mt-1 text-xs leading-5 text-[#8290a7]">
        Search a neighborhood, city, or place.
      </div>
    </div>

    <div className="rounded-2xl bg-[#f7fbff] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-sm font-bold text-[#1769ff]">
        2
      </div>
      <div className="mt-4 text-sm font-bold text-[#172341]">
        Read Qloo signals
      </div>
      <div className="mt-1 text-xs leading-5 text-[#8290a7]">
        Nearby places reveal the area&apos;s cultural identity.
      </div>
    </div>

    <div className="rounded-2xl bg-[#f7fbff] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2ff] text-sm font-bold text-[#1769ff]">
        3
      </div>
      <div className="mt-4 text-sm font-bold text-[#172341]">
        Score concepts
      </div>
      <div className="mt-1 text-xs leading-5 text-[#8290a7]">
        SpotU compares cultural match and market gap.
      </div>
    </div>

    <div className="rounded-2xl bg-[#f7fbff] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769ff] text-sm font-bold text-white">
        4
      </div>
      <div className="mt-4 text-sm font-bold text-[#172341]">
        Recommend what fits
      </div>
      <div className="mt-1 text-xs leading-5 text-[#8290a7]">
        Concepts are ranked with supporting signals.
      </div>
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