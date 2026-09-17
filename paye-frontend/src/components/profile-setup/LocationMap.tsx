"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const PIN_ICON = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [35.6892, 51.389]; // Tehran
const DEFAULT_ZOOM = 11;

type Props = {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  isRtl?: boolean;
  focusZoom?: number;
};

function Recenter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (zoom != null) {
      map.setView([lat, lng], zoom, { animate: true });
    } else {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickCapture({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMap({
  latitude,
  longitude,
  onPick,
  isRtl,
  focusZoom,
}: Props) {
  const center: LatLngExpression = useMemo(() => {
    if (latitude != null && longitude != null) {
      return [latitude, longitude];
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200"
      dir="ltr"
    >
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: 280, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <ClickCapture onPick={onPick} />

        {hasPin && (
          <>
            <Recenter lat={latitude!} lng={longitude!} zoom={focusZoom} />
            <Marker
              position={[latitude!, longitude!]}
              icon={PIN_ICON}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as L.Marker;
                  const pos = marker.getLatLng();
                  onPick(pos.lat, pos.lng);
                },
              }}
            />
          </>
        )}
      </MapContainer>

      <div
        className="pointer-events-none absolute left-3 top-3 z-[400] rounded-full bg-white/95 px-3 py-1 text-xs text-slate-700 shadow-sm"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {isRtl
          ? "برای جابجایی، پین را بکش یا روی نقشه کلیک کن"
          : "Drag the pin or click the map to adjust"}
      </div>
    </div>
  );
}