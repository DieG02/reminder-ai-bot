import { Timestamp } from "firebase-admin/firestore";

// Represents the structure of the parsed reminder data from OpenAI
export interface ReminderData {
  status: string;
  reminder: {
    date: string | null; // DD/MM/YYYY
    time: string | null; // HH:mm
    task: string | null;
  };
  missing: string[] | "";
  roadmap?: string[]; // Optional
}

// Represents the structure of a reminder document in Firestore
export interface FirestoreReminderDoc {
  chatId: number;
  task: string;
  scheduleDateTime: Timestamp; // Stored as Firestore Timestamp
  jobId: string;
  isScheduled: boolean;
}

// Represents the structure of a reminder used within our application's logic
export interface StoredReminder {
  id: string; // Document ID from Firestore
  chatId: number;
  task: string;
  scheduleDateTime: Date; // JavaScript Date object
  jobId: string;
  isScheduled: boolean;
}
