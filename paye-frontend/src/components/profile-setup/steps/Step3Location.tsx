"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCountries,
  fetchCities,
  fetchNeighborhoods,
} from "@/lib/api/locations";

/** Leaflet must be loaded client-side only */
const LocationMap = dynamic(
  () => import("@/components/profile-setup/LocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-2xl bg-slate-100" />
    ),
  }
);

type Props = {
  countryId: number | null;
  cityId: number | null;
  neighborhoodId: number | null;
  latitude: number | null;
  longitude: number | null;
  onChange: (patch: {
    countryId?: number | null;
    cityId?: number | null;
    neighborhoodId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => void;
};

async function reverseGeocode(lat: number, lon: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("reverse geocode failed");

  const data = await res.json();
  const addr = data?.address ?? {};

  return {
    city:
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      "",
    neighborhood:
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.city_district ||
      addr.hamlet ||
      "",
    countryCode: String(addr.country_code || "").toUpperCase(),
  };
}

function looseMatch(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  const h = haystack.toLowerCase().trim();
  const n = needle.toLowerCase().trim();
  return h.includes(n) || n.includes(h);
}

export function Step3Location({
  countryId,
  cityId,
  neighborhoodId,
  latitude,
  longitude,
  onChange,
}: Props) {
  const locale = useLocale();
  const isPersian = locale === "fa";
  const t = useTranslations("ProfileSetupWizard.step3");

  const [locating, setLocating] = useState(false);
  const [matching, setMatching] = useState(false);
  const [focusZoom, setFocusZoom] = useState<number | undefined>(undefined);


  /* ---------- Queries ---------- */
  const countriesQuery = useQuery({
    queryKey: ["locations", "countries"],
    queryFn: fetchCountries,
    staleTime: 10 * 60_000,
  });

  const citiesQuery = useQuery({
    queryKey: ["locations", "cities", countryId],
    queryFn: () => fetchCities(countryId as number),
    enabled: !!countryId,
    staleTime: 10 * 60_000,
  });

  const hoodsQuery = useQuery({
    queryKey: ["locations", "neighborhoods", cityId],
    queryFn: () => fetchNeighborhoods(cityId as number),
    enabled: !!cityId,
    staleTime: 10 * 60_000,
  });

  // Default to Iran
  useEffect(() => {
    if (!countryId && countriesQuery.data?.length) {
      onChange({ countryId: countriesQuery.data[0].id });
    }
  }, [countryId, countriesQuery.data, onChange]);

  function localized(name: string, nameFa: string | null) {
    return isPersian && nameFa ? nameFa : name;
  }

  /* ---------- Reverse-geocode + match against our tables ---------- */
  const matchSeq = useRef(0);

  async function matchCoords(lat: number, lon: number, opts?: { silent?: boolean }) {
    const seq = ++matchSeq.current;
    setMatching(true);
    try {
      const geo = await reverseGeocode(lat, lon);

      // Ignore stale results if a newer match started
      if (seq !== matchSeq.current) return;

      const countries = countriesQuery.data ?? [];
      const matchedCountry =
        countries.find((c) => c.code.toUpperCase() === geo.countryCode) ||
        countries.find((c) => c.code === "IR");

      if (!matchedCountry) {
        if (!opts?.silent) toast.success(t("locationAddedCoordsOnly"));
        return;
      }

      const cities = await fetchCities(matchedCountry.id);
      const matchedCity = cities.find(
        (c) =>
          looseMatch(c.name, geo.city) ||
          (isPersian && c.nameFa && looseMatch(c.nameFa, geo.city))
      );

      if (seq !== matchSeq.current) return;

      if (!matchedCity) {
        onChange({
          countryId: matchedCountry.id,
          cityId: null,
          neighborhoodId: null,
        });
        if (!opts?.silent) toast.success(t("locationAddedCountryOnly"));
        return;
      }

      const hoods = await fetchNeighborhoods(matchedCity.id);
      const matchedHood = hoods.find(
        (h) =>
          looseMatch(h.name, geo.neighborhood) ||
          (isPersian && h.nameFa && looseMatch(h.nameFa, geo.neighborhood))
      );

      if (seq !== matchSeq.current) return;

      onChange({
        countryId: matchedCountry.id,
        cityId: matchedCity.id,
        neighborhoodId: matchedHood ? matchedHood.id : null,
      });

      if (!opts?.silent) {
        toast.success(
          matchedHood ? t("locationAdded") : t("locationAddedCityOnly")
        );
      }
    } catch {
      if (!opts?.silent) toast.success(t("locationAddedCoordsOnly"));
    } finally {
      if (seq === matchSeq.current) setMatching(false);
    }
  }

  /* ---------- "Use my location" ---------- */
  async function handleUseLocation() {
    if (!navigator.geolocation) {
      toast.error(t("locationUnavailable"));
      return;
    }

    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lon } = pos.coords;
      onChange({ latitude: lat, longitude: lon });
      await matchCoords(lat, lon);
    } catch {
      toast.error(t("locationFailed"));
    } finally {
      setLocating(false);
    }
  }

  /* ---------- User picks a point on the map / drags pin ---------- */
  const pendingMatch = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMapPick(lat: number, lng: number) {
    onChange({ latitude: lat, longitude: lng });

    if (pendingMatch.current) clearTimeout(pendingMatch.current);
    pendingMatch.current = setTimeout(() => {
      void matchCoords(lat, lng, { silent: true });
    }, 600); // debounce: user may be dragging
  }

  const hasCoords = latitude != null && longitude != null;

  /* ---------- Render ---------- */
  return (
    <div className="space-y-4">
      {/* Top button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleUseLocation}
        disabled={locating}
        className="w-full h-12 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        {locating ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="me-2 h-4 w-4" />
        )}
        {locating ? t("locating") : t("useLocation")}
      </Button>

      {/* Map */}
      <LocationMap
        latitude={latitude}
        longitude={longitude}
        onPick={handleMapPick}
        isRtl={isPersian}
      />

      {/* Summary */}
      {hasCoords && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">
            {countryId
              ? localized(
                  countriesQuery.data?.find((c) => c.id === countryId)
                    ?.name ?? "",
                  countriesQuery.data?.find((c) => c.id === countryId)
                    ?.nameFa ?? null
                )
              : "—"}
            {cityId && (
              <>
                {" · "}
                {localized(
                  citiesQuery.data?.find((c) => c.id === cityId)?.name ??
                    "",
                  citiesQuery.data?.find((c) => c.id === cityId)?.nameFa ??
                    null
                )}
              </>
            )}
            {neighborhoodId && (
              <>
                {" · "}
                {localized(
                  hoodsQuery.data?.find((h) => h.id === neighborhoodId)
                    ?.name ?? "",
                  hoodsQuery.data?.find((h) => h.id === neighborhoodId)
                    ?.nameFa ?? null
                )}
              </>
            )}
          </span>
          {matching && (
            <Loader2 className="ms-auto h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
          )}
        </div>
      )}

      {/* Dropdowns — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          value={countryId ? String(countryId) : ""}
          onValueChange={(v) =>
            onChange({
              countryId: Number(v),
              cityId: null,
              neighborhoodId: null,
            })
          }
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder={t("country")} />
          </SelectTrigger>
          <SelectContent>
            {(countriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {localized(c.name, c.nameFa)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={cityId ? String(cityId) : ""}
          onValueChange={(v) =>
            onChange({ cityId: Number(v), neighborhoodId: null })
          }
          disabled={!countryId || citiesQuery.isLoading}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder={t("city")} />
          </SelectTrigger>
          <SelectContent>
            {(citiesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {localized(c.name, c.nameFa)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={neighborhoodId ? String(neighborhoodId) : ""}
          onValueChange={(v) => onChange({ neighborhoodId: Number(v) })}
          disabled={
            !cityId ||
            hoodsQuery.isLoading ||
            (hoodsQuery.data ?? []).length === 0
          }
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue
              placeholder={
                cityId && (hoodsQuery.data ?? []).length === 0
                  ? t("noNeighborhoods")
                  : t("neighborhood")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(hoodsQuery.data ?? []).map((h) => (
              <SelectItem key={h.id} value={String(h.id)}>
                {localized(h.name, h.nameFa)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}