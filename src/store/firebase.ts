import dayjs from "../lib/dayjs";
import local from "./model";
import { db } from "./index";
import { firestore } from "firebase-admin";
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
        ...data,
        id: doc.id,
        scheduleDateTime: dayjs(data.scheduleDateTime.toDate()),
        jobId: data.jobId || "",
        isScheduled: false,
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
            reminder.scheduleDateTime.toDate()
          ),
          jobId: reminder.jobId,
          isScheduled: reminder.isScheduled,
          code: reminder.code,
        },
        { merge: true }
      );
    local.add(reminder);
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
  reminder: Omit<StoredReminder, "id" | "jobId" | "isScheduled">
): Promise<string> => {
  try {
    const docRef = await db.collection(REMINDERS_COLLECTION).add({
      chatId: reminder.chatId,
      task: reminder.task,
      scheduleDateTime: firestore.Timestamp.fromDate(
        reminder.scheduleDateTime.toDate()
      ),
      jobId: "",
      isScheduled: false,
      code: reminder.code,
      repeat: reminder.repeat,
      repeatCount: reminder.repeatCount,
      repeatUntil: reminder.repeatUntil,
    });
    console.log(`Added new reminder with ID: ${docRef.id} to Firestore.`);
    local.add({ ...reminder, id: docRef.id, jobId: "", isScheduled: false });
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
    local.remove(doc.id);
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
 * Get all reminders for today, from 00:00 to 23:59hs
 */
export const getUserAgenda = async (
  chatId: number
): Promise<StoredReminder[] | null> => {
  try {
    const nowInTimeZone = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Rome",
    });

    // Build start and end of day
    const startDate = dayjs(nowInTimeZone).startOf("day").toDate();
    const endDate = dayjs(nowInTimeZone).endOf("day").toDate();

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
        ...data,
        id: doc.id,
        scheduleDateTime: dayjs(data.scheduleDateTime.toDate()),
      };
    });
    return agenda;
  } catch (error) {
    console.error("Error getting agenda of today:", error);
    return null;
  }
};

/**
 * Get all reminders from a user by chatId.
 */
export const getAllUserReminders = async (
  chatId: number,
  limit: number = 25
): Promise<StoredReminder[] | null> => {
  try {
    const now = new Date();
    let query = db
      .collection(REMINDERS_COLLECTION)
      .where("chatId", "==", chatId)
      .where("isScheduled", "==", true)
      .where("scheduleDateTime", ">", firestore.Timestamp.fromDate(now))
      .orderBy("scheduleDateTime", "asc");

    if (limit && typeof limit === "number") {
      query.limit(limit);
    }

    const snapshot = await query.get();
    const userReminders: StoredReminder[] = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreReminderDoc;
      return {
        ...data,
        id: doc.id,
        scheduleDateTime: dayjs(data.scheduleDateTime.toDate()),
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
