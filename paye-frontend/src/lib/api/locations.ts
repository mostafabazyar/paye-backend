import { apiClient } from "@/lib/api";

export type Country = {
  id: number;
  code: string;
  name: string;
  nameFa: string | null;
};

export type City = {
  id: number;
  name: string;
  nameFa: string | null;
};

export type Neighborhood = {
  id: number;
  name: string;
  nameFa: string | null;
};

export async function fetchCountries(): Promise<Country[]> {
  const res = await apiClient.get("/locations/countries");
  return res?.countries ?? [];
}

export async function fetchCities(countryId: number): Promise<City[]> {
  const res = await apiClient.get(`/locations/cities?countryId=${countryId}`);
  return res?.cities ?? [];
}

export async function fetchNeighborhoods(cityId: number): Promise<Neighborhood[]> {
  const res = await apiClient.get(`/locations/neighborhoods?cityId=${cityId}`);
  return res?.neighborhoods ?? [];
}