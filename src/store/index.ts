import * as admin from "firebase-admin";
import * as firestore from "./firebase";
import model from "./model";

// --- Firebase Initialization ---
const serviceAccount = require(process.env.GOOGLE_CREDENTIALS_PATH!);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
export const db = admin.firestore();
export const local = model;

export const store = {
  loadReminders: firestore.loadReminders,
  updateReminder: firestore.updateReminder,
  addReminder: firestore.addReminder,
  deleteReminder: firestore.deleteReminder,
  getNextUserReminder: firestore.getNextUserReminder,
  getUserReminders: firestore.getUserReminders,
  clearUserReminders: firestore.clearUserReminders,
};
