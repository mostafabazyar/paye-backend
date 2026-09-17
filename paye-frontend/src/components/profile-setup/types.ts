export type WizardData = {
  // step 1
  gender: "male" | "female" | "other" | "";

  // step 2
  name: string;
  birthDate: string; // "YYYY-MM-DD" Gregorian

  // step 3
  countryId: number | null;
  cityId: number | null;
  neighborhoodId: number | null;
  latitude: number | null;
  longitude: number | null;

  // step 4
  interestedIn: "MEN" | "WOMEN" | "EVERYONE" | "";

  // step 5
  sportSlugs: string[];

  // step 6
  preferredSessionTypes: (
    | "ONE_ON_ONE"
    | "ONE_ON_MANY"
    | "MANY_ON_MANY"
  )[];

  // step 7
  bio: string;
};

export const emptyWizardData: WizardData = {
  gender: "",
  name: "",
  birthDate: "",
  countryId: null,
  cityId: null,
  neighborhoodId: null,
  latitude: null,
  longitude: null,
  interestedIn: "",
  sportSlugs: [],
  preferredSessionTypes: [],
  bio: "",
};

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;