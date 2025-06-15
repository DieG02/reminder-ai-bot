import * as admin from "firebase-admin";
import * as firestore from "./firebase";
import * as user from "./user";
import model from "./model";

// --- Firebase Initialization ---

if (!admin.apps.length) {
  const serviceAccountJson = Buffer.from(
    process.env.GOOGLE_SERVICES_BASE64!,
    "base64"
  ).toString("utf8");

  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
export const local = model;

export const store = {
  loadReminders: firestore.loadReminders,
  updateReminder: firestore.updateReminder,
  addReminder: firestore.addReminder,
  deleteReminder: firestore.deleteReminder,
  getUserAgenda: firestore.getUserAgenda,
  getAllUserReminders: firestore.getAllUserReminders,
  clearUserReminders: firestore.clearUserReminders,
  getUserProfile: user.getUserProfile,
  saveUserProfile: user.saveUserProfile,
  createUserProfile: user.createUserProfile,
};
