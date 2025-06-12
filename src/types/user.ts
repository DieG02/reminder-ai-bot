import { Timestamp } from "firebase-admin/firestore";
import { Subscription } from "./subscription";

export interface UserProfile {
  id: string; // from firestore
  userId: string; // from telegram
  username: string;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  plan: Subscription; // Add this field to track the user's active plan
  planExpiresAt?: Timestamp; // Optional: For paid plans, when does it expire?
  trialEndsAt?: Timestamp;

  googleAuth: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Timestamp;
  };
}
