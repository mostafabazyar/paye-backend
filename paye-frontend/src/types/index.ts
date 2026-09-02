export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  interestedIn?: 'MEN' | 'WOMEN' | 'EVERYONE';
  preferredSports?: string[];
  preferredSessionTypes?: string[];
  bio?: string;
  photos: string[];
  avgRating: number;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export type Gender =
  | "male"
  | "female"
  | "prefer_not_to_say";

export interface Sport {
  id: string;
  name: string;
}

export interface UserSport {
  sportId: string;
  level: "beginner" | "intermediate" | "professional";
}

export interface PayeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  sportId: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
}

export interface Session {
  id: string;
  requestId: string;
  startedAt: string;
  endedAt?: string;
}
