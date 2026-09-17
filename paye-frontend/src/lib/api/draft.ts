import { apiClient } from "@/lib/api";

type SaveDraftPayload = {
  lastStep: number;
  gender?: string;
  name?: string;
  birthDate?: string;
  countryId?: number | null;
  cityId?: number | null;
  neighborhoodId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  interestedIn?: string;
  sportSlugs?: string[];
  sessionTypes?: string[];
  bio?: string;
};

/**
 * Fire-and-forget: never blocks the wizard, never throws visibly.
 */
export async function saveDraftStep(payload: SaveDraftPayload): Promise<void> {
  try {
    await apiClient.post("/draft/step", payload);
  } catch (err) {
    console.warn("Draft save failed (non-fatal):", err);
  }
}

export async function abandonDraft(): Promise<void> {
  try {
    await apiClient.post("/draft/abandon", {});
  } catch (err) {
    console.warn("Draft abandon failed (non-fatal):", err);
  }
}