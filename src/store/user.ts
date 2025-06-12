import { db } from "./index";
import { PROFILE_COLLECTION } from "../types/constants";
import { UserProfile } from "../types/user";

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
