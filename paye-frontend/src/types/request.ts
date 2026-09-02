export interface PayeRequest {
  id: string;

  fromUserId: string;
  toUserId: string;

  sportId: string;

  message?: string;

  status:
    | "pending"
    | "accepted"
    | "rejected";

  createdAt: string;
}