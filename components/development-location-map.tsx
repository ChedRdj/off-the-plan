"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface Props {
  lat: number;
  lng: number;
  name: string;
  suburb: string | null;
  state: string | null;
}

export function DevelopmentLocationMap({ lat, lng, name, suburb, state }: Props) {
  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom: 13.5,
  });

  return (
    <div className="relative w-full h-[420px] overflow-hidden">
      <Map
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />

        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="flex flex-col items-center">
            {/* Label */}
            <div className="bg-orange text-white font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 shadow-lg whitespace-nowrap">
              {name}
            </div>
            {/* Pin stem */}
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange" />
            {/* Dot */}
            <div className="w-2 h-2 rounded-full bg-orange -mt-0.5 shadow" />
          </div>
        </Marker>
      </Map>

      {/* Suburb badge overlay */}
      {suburb && (
        <div className="absolute bottom-4 left-4 bg-navy/90 backdrop-blur-sm px-4 py-2 pointer-events-none">
          <p className="font-mono text-label-sm uppercase tracking-widest text-ink-light/50 leading-none mb-0.5">Location</p>
          <p className="font-mono text-label-lg text-ink-light leading-none">
            {suburb}{state ? `, ${state}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
