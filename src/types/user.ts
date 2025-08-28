import { Timestamp } from "firebase-admin/firestore";
import { Subscription } from "./subscription";

export interface UserProfile {
  id: string; // from firestore
  username: string;
  timezone: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  plan: Subscription; // Add this field to track the user's active plan
  planExpiresAt: Timestamp | null; // Optional: For paid plans, when does it expire?
  trialEndsAt: Timestamp | null;

  googleAuth?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Timestamp;
  };
}
