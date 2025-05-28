import { firestore } from "firebase-admin";
import local from "./model";
import { db } from "./index";
import { REMINDERS_COLLECTION } from "../types/constants";
import { FirestoreReminderDoc, ReminderData, StoredReminder } from "../types";

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

export const getUserReminders = async (
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

    // const inlineKeyboard = userReminders.map((r, index) => {
    //   const dateStr = format(r.scheduleDateTime, 'dd/MM/yyyy HH:mm', { locale: enGB });
    //   const groupSuffix = r.isGroupReminder ? ` (Group: ${r.chatId})` : ''; // Improve group display
    //   message += `${index + 1}. ${r.task} on <span class="math-inline">\{dateStr\}</span>{groupSuffix}\n`;
    //   return [{ text: `${index + 1}. ${r.task}`, callback_data: `manage_reminder:select:${r.id}` }];
    // });

    // ctx.reply(message, {
    //   reply_markup: {
    //     inline_keyboard: inlineKeyboard
    //   },
    //   parse_mode: 'HTML' // For group mention links
    // });

    // await bot.telegram.sendMessage(chatId, message);

    // ctx.reply(message, {
    //   reply_markup: {
    //     inline_keyboard: inlineKeyboard
    //   },
    //   parse_mode: 'HTML' // For group mention links
    // });
    return userReminders;
  } catch (error) {
    console.error("Error listing reminders:", error);
    return null;
  }

  return [];
};
