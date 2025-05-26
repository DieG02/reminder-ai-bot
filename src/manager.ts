import { StoredReminder } from "./types";

// --- Global State ---
// This 'reminders' array will now only hold reminders that are loaded at startup
// and are yet to be processed/sent. Once a reminder is sent, it's deleted from Firestore
// and removed from this in-memory array.

class ReminderManager {
  private _reminders: StoredReminder[] = [];

  get all() {
    return this._reminders;
  }

  get length() {
    return this._reminders.length;
  }

  reset(reminders: StoredReminder[]) {
    this._reminders = reminders;
  }

  clear() {
    this._reminders = [];
  }

  remove(id: string) {
    this._reminders = this._reminders.filter((r) => r.id !== id);
  }

  add(r: StoredReminder) {
    this._reminders.push(r);
  }

  toArray() {
    return [...this._reminders];
  }
}

export const reminders = new ReminderManager();
