import * as admin from "firebase-admin";
import { reminders } from "./manager";
import { REMINDERS_COLLECTION } from "./types/constants";
import { FirestoreReminderDoc, StoredReminder } from "./types";

// --- Firebase Initialization ---
const serviceAccount = require("./firebase-services.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// --- Persistence Logic with Firestore ---
/**
 * Loads all outstanding reminders from Firestore that are not yet sent.
 */
export const loadReminders = async (): Promise<void> => {
  try {
    // Only load reminders that are not yet sent (isScheduled might be false if bot restarted before sending)
    // and whose scheduleDateTime is not in the past (already processed/sent).
    const now = new Date();
    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("scheduleDateTime", ">", admin.firestore.Timestamp.fromDate(now))
      .get();

    const expiredSnapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("scheduleDateTime", "<=", admin.firestore.Timestamp.fromDate(now))
      .get();

    for (const doc of expiredSnapshot.docs) {
      await doc.ref.delete();
    }

    const docs = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreReminderDoc;
      return {
        id: doc.id,
        chatId: data.chatId,
        task: data.task,
        scheduleDateTime: data.scheduleDateTime.toDate(),
        jobId: data.jobId || "",
        isScheduled: false,
      } as StoredReminder;
    });
    reminders.reset(docs);
    console.log(
      `Loaded ${reminders.length} potential active reminders from Firestore.`
    );
  } catch (error) {
    console.error("Error loading reminders from Firestore:", error);
    reminders.clear();
  }
};

/**
 * Saves or updates a reminder document in Firestore.
 * This is used to update an existing reminder's status (e.g., isScheduled, jobId).
 */
export const updateReminder = async (
  reminder: StoredReminder
): Promise<void> => {
  if (!reminder.id) {
    console.error("Cannot update reminder in Firestore: ID is missing.");
    return;
  }
  try {
    await db
      .collection(REMINDERS_COLLECTION)
      .doc(reminder.id)
      .set(
        {
          chatId: reminder.chatId,
          task: reminder.task,
          scheduleDateTime: admin.firestore.Timestamp.fromDate(
            reminder.scheduleDateTime
          ),
          jobId: reminder.jobId,
          isScheduled: reminder.isScheduled,
        },
        { merge: true }
      );
    // console.log(`Updated reminder ${reminder.id} in Firestore.`);
  } catch (error) {
    console.error(
      `Error updating reminder ${reminder.id} in Firestore:`,
      error
    );
  }
};

/**
 * Adds a new reminder document to Firestore and returns its generated ID.
 */
export const addReminder = async (
  newReminderData: Omit<StoredReminder, "id" | "jobId" | "isScheduled">
): Promise<string> => {
  try {
    const docRef = await db.collection(REMINDERS_COLLECTION).add({
      chatId: newReminderData.chatId,
      task: newReminderData.task,
      scheduleDateTime: admin.firestore.Timestamp.fromDate(
        newReminderData.scheduleDateTime
      ),
      jobId: "",
      isScheduled: false,
    });
    console.log(`Added new reminder with ID: ${docRef.id} to Firestore.`);
    return docRef.id;
  } catch (error) {
    console.error("Error adding reminder to Firestore:", error);
    throw error;
  }
};

/**
 * Deletes a reminder document from Firestore.
 */
export const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    await db.collection(REMINDERS_COLLECTION).doc(reminderId).delete();
    console.log(`Deleted reminder ${reminderId} from Firestore.`);
  } catch (error) {
    console.error(
      `Error deleting reminder ${reminderId} from Firestore:`,
      error
    );
  }
};
