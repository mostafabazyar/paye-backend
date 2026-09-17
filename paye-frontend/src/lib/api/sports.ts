import { apiClient } from "@/lib/api";

export type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: string | null;
};

export async function fetchSports(): Promise<Sport[]> {
  const res = await apiClient.get("/sports");
  return res?.sports ?? [];
}