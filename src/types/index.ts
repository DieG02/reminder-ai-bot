import { Timestamp } from "firebase-admin/firestore";

export type RepeatType = "daily" | "weekly" | "monthly" | null;
export type TimeUnitsType = "minutes" | "hours" | "days" | "weeks" | null;
export type DateString = string | null;

export enum StatusType {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// Represents the structure of the parsed reminder data from OpenAI
export interface ReminderData {
  status: StatusType;
  reminder: ReminderBody; // TODO: Replace to body
  repeat?: RepeatType;
  repeatCount?: number | null;
  repeatUntil?: DateString;
  missing: string[] | "";
  roadmap?: string[]; // Optional
}

export interface ReminderBody {
  date: string | null; // DD/MM/YYYY
  time: string | null; // HH:mm
  task: string | null;
  relativeDuration: number | null;
  relativeUnit: TimeUnitsType;
}

// Represents the structure of a reminder document in Firestore
export interface FirestoreReminderDoc {
  chatId: number;
  task: string;
  scheduleDateTime: Timestamp; // Stored as Firestore Timestamp
  jobId: string;
  isScheduled: boolean;
  code: string;
  repeat?: RepeatType;
  repeatCount?: number | null;
  repeatUntil?: DateString;
}

// Represents the structure of a reminder used within our application's logic
export interface StoredReminder {
  id: string; // Document ID from Firestore
  chatId: number;
  task: string;
  scheduleDateTime: Date; // JavaScript Date object
  jobId: string;
  isScheduled: boolean;
  code: string;
  repeat?: RepeatType;
  repeatCount?: number | null;
  repeatUntil?: DateString;
}
