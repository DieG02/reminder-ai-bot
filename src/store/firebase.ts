import { firestore } from "firebase-admin";
import local from "./model";
import { db } from "./index";
import { REMINDERS_COLLECTION } from "../types/constants";
import { FirestoreReminderDoc, StoredReminder } from "../types";

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
      .where("scheduleDateTime", ">", firestore.Timestamp.fromDate(now))
      .get();

    const expiredSnapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("scheduleDateTime", "<=", firestore.Timestamp.fromDate(now))
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
        code: data.code,
      } as StoredReminder;
    });
    local.reset(docs);
    console.log(
      `Loaded ${local.length} potential active reminders from Firestore.`
    );
  } catch (error) {
    console.error("Error loading reminders from Firestore:", error);
    local.clear();
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
          scheduleDateTime: firestore.Timestamp.fromDate(
            reminder.scheduleDateTime
          ),
          jobId: reminder.jobId,
          isScheduled: reminder.isScheduled,
          code: reminder.code,
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
      scheduleDateTime: firestore.Timestamp.fromDate(
        newReminderData.scheduleDateTime
      ),
      jobId: "",
      isScheduled: false,
      code: newReminderData.code,
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
export const deleteReminder = async (
  reminderCode: string
): Promise<boolean> => {
  try {
    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("code", "==", reminderCode)
      .limit(1) // limit to 1 for performance
      .get();

    if (snapshot.empty) {
      console.warn(`No reminder found with code ${reminderCode}`);
      return false;
    }

    const doc = snapshot.docs[0];
    await doc.ref.delete();

    console.log(`Deleted reminder ${reminderCode} from Firestore.`);
    return true;
  } catch (error) {
    console.error(
      `Error deleting reminder ${reminderCode} from Firestore:`,
      error
    );
    return false;
  }
};

/**
 * Get only the next schedule reminder from a user by chatId.
 */
export const getNextUserReminder = async (
  chatId: number
): Promise<StoredReminder | null> => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("chatId", "==", chatId)
      .where("isScheduled", "==", true) // Only show active ones
      .where("scheduleDateTime", ">", firestore.Timestamp.fromDate(now))
      .orderBy("scheduleDateTime", "asc")
      .limit(1) // <--- This is the key change!
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as FirestoreReminderDoc;

    const nextReminder: StoredReminder = {
      id: doc.id,
      chatId: data.chatId,
      task: data.task,
      scheduleDateTime: data.scheduleDateTime.toDate(),
      jobId: data.jobId,
      isScheduled: data.isScheduled,
      code: data.code,
    };

    return nextReminder;
  } catch (error) {
    console.error("Error getting next reminder:", error);
    return null;
  }
};

/**
 * Get all reminders of today, from 00:00 to 23:59hs
 */
export const getUserAgenda = async (
  chatId: number
): Promise<StoredReminder[] | null> => {
  try {
    const now = new Date();
    const startDate = new Date(
      now.toLocaleString("en-GB", { timeZone: "Europe/Rome" })
    );
    const endDate = new Date(
      now.toLocaleString("en-GB", { timeZone: "Europe/Rome" })
    );
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("chatId", "==", chatId)
      .where("isScheduled", "==", true) // Only show active ones
      .where("scheduleDateTime", ">=", firestore.Timestamp.fromDate(startDate))
      .where("scheduleDateTime", "<=", firestore.Timestamp.fromDate(endDate))
      .orderBy("scheduleDateTime", "asc")
      .get();

    if (snapshot.empty) {
      return null;
    }

    const agenda: StoredReminder[] = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreReminderDoc;
      return {
        id: doc.id,
        chatId: data.chatId,
        // creatorId: data.creatorId,
        // isGroupReminder: data.isGroupReminder || false,
        // targetUsers: data.targetUsers || [],
        task: data.task,
        scheduleDateTime: data.scheduleDateTime.toDate(),
        jobId: data.jobId,
        isScheduled: data.isScheduled,
        code: data.code,
      };
    });
    return agenda;
  } catch (error) {
    console.error("Error getting next reminder:", error);
    return null;
  }
};

/**
 * Get all reminders from a user by chatId.
 */
export const getAllUserReminders = async (
  chatId: number
): Promise<StoredReminder[] | null> => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("chatId", "==", chatId)
      .where("isScheduled", "==", true) // Only show active ones
      .where("scheduleDateTime", ">", firestore.Timestamp.fromDate(now))
      .orderBy("scheduleDateTime", "asc")
      .get();

    const userReminders: StoredReminder[] = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreReminderDoc;
      return {
        id: doc.id,
        chatId: data.chatId,
        // creatorId: data.creatorId,
        // isGroupReminder: data.isGroupReminder || false,
        // targetUsers: data.targetUsers || [],
        task: data.task,
        scheduleDateTime: data.scheduleDateTime.toDate(),
        jobId: data.jobId,
        isScheduled: data.isScheduled,
        code: data.code,
      };
    });
    return userReminders;
  } catch (error) {
    console.error("Error listing reminders:", error);
    return null;
  }
};

/**
 * Deletes all reminders for a specific chatId.
 */
export const clearUserReminders = async (
  chatId: number | string
): Promise<void> => {
  try {
    const snapshot = await db
      .collection(REMINDERS_COLLECTION)
      .where("chatId", "==", chatId)
      .get();

    if (snapshot.empty) {
      console.log(`No reminders found for chatId: ${chatId}`);
      return;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} reminders for chatId: ${chatId}`);
  } catch (error) {
    console.error(`Failed to delete reminders for chatId ${chatId}:`, error);
  }
};
