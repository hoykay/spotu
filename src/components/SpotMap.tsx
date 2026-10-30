"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

type SpotMapProps = {
  longitude?: number;
  latitude?: number;
  label?: string;
  onSearchArea?: (
    longitude: number,
    latitude: number,
    label: string
  ) => void;
};

export default function SpotMap({
  longitude = -74.0007,
  latitude = 40.7233,
  label = "SoHo",
  onSearchArea,
}: SpotMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapMoved, setMapMoved] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState(label);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      console.error("Mapbox token is missing.");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [longitude, latitude],
      zoom: 15,
    });

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => {
  map.resize();
});

resizeObserver.observe(mapContainer.current);

    map.on("load", () => {
      map.resize();

      map.jumpTo({
        center: [longitude, latitude],
        zoom: 15,
      });
    });

    map.on("error", (event) => {
      console.error("Mapbox error:", event.error);
    });
map.on("movestart", (event) => {
  const originalEvent = (event as { originalEvent?: Event }).originalEvent;

  if (originalEvent) {
    setMapMoved(true);
  }
});
map.on("moveend", async () => {
  const center = map.getCenter();

  try {
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${center.lng}&latitude=${center.lat}&types=neighborhood,locality,place,district&access_token=${token}`
    );

    const data = await response.json();

    const result = data.features?.[0];

    const newLabel =
      result?.properties?.name_preferred ||
      result?.properties?.name ||
      result?.properties?.place_formatted;

    if (newLabel) {
      setDetectedLabel(newLabel);
    }

    setMapMoved(false);
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    setMapMoved(false);
  }
});

    return () => {
  resizeObserver.disconnect();
  map.remove();
  mapRef.current = null;
};
  }, []);

  // Move the existing map whenever the selected location changes.
  useEffect(() => {
    if (!mapRef.current) return;

    setMapMoved(false);
    setDetectedLabel(label);

    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 1400,
    });
  }, [longitude, latitude]);

  return (
    <div className="relative h-full min-h-[520px] w-full overflow-hidden xl:min-h-[760px]">
      <div ref={mapContainer} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-[#2f7df6]/20 bg-[#2f7df6]/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2f7df6] shadow-lg ring-4 ring-white/70">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
        </div>

        {!mapMoved && (
  <div className="mx-auto mt-2 w-fit rounded-lg bg-white px-3 py-1 text-xs font-bold text-[#172341] shadow-md">
    {detectedLabel.toUpperCase()}
  </div>
)}
      </div>

      <button
  type="button"
  onClick={() => {
    const map = mapRef.current;

    if (!map || !onSearchArea) return;

    const center = map.getCenter();

    onSearchArea(center.lng, center.lat, detectedLabel);
  }}
  className="absolute left-6 top-6 z-10 rounded-xl bg-white px-4 py-3 font-semibold text-[#172341] shadow-md transition hover:text-[#1769ff]"
>
  Search this area
</button>
    </div>
  );
}