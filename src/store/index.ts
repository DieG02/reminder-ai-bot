import * as admin from "firebase-admin";
import {
  addReminder,
  deleteReminder,
  loadReminders,
  updateReminder,
} from "./firebase";
import model from "./model";

// --- Firebase Initialization ---
const serviceAccount = require("../config/firebase-services.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
export const db = admin.firestore();
export const local = model;

export const store = {
  loadReminders,
  updateReminder,
  addReminder,
  deleteReminder,
};
