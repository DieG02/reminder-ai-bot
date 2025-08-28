import { db } from "./index";
import { PROFILE_COLLECTION } from "../types/constants";
import { UserProfile } from "../types/user";
import { PlanManager } from "../services/plan";
import { Subscription } from "../types/subscription";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Retrieves a user's profile from Firestore.
 *
 * @param userId The ID of the user (typically Telegram ID), which is also the document ID.
 * @returns The UserProfile object if found, otherwise null.
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  // Access the collection and document directly from the Firestore instance (db)
  const docRef = db.collection(PROFILE_COLLECTION).doc(userId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return null;
  }
  const data = snap.data() as UserProfile;
  return data;
};

/**
 * Saves or updates a user's profile in Firestore.
 *
 * @param userId The ID of the user (document ID).
 * @param profile The UserProfile object to save.
 */
export const saveUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  const docRef = db.collection(PROFILE_COLLECTION).doc(userId);
  await docRef.set(profile, { merge: true });
};

/**
 * Create a new user's profile in Firestore.
 *
 * @param userId The ID of the user (telegram user ID).
 * @param profile The initial UserProfile object to create.
 */
export const createUserProfile = async (
  userId: string,
  profile: Omit<UserProfile, "plan" | "trialEndsAt" | "updatedAt" | "createdAt">
): Promise<UserProfile> => {
  const freePlan = PlanManager.getPlanDetails(Subscription.FREE);
  if (!freePlan) {
    throw new Error("Free plan configuration not found!");
  }
  const newUserProfile: UserProfile = {
    ...profile,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    plan: Subscription.FREE,

    planExpiresAt: null,
    trialEndsAt: null,
  };

  await saveUserProfile(userId, newUserProfile);
  return newUserProfile;
};
