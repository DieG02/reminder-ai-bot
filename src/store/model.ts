import { StoredReminder } from "../types";

// --- Global State ---

class ReminderManager {
  // Using a Map for efficient lookups and deletions by ID
  private _reminders: Map<string, StoredReminder> = new Map();

  get all(): Map<string, StoredReminder> {
    return this._reminders;
  }

  get length(): number {
    // Use Map's size property
    return this._reminders.size;
  }

  reset(reminders: StoredReminder[]) {
    this._reminders.clear();
    reminders.forEach((r) => this._reminders.set(r.id, r));
  }

  clear() {
    this._reminders.clear();
  }

  remove(id: string): boolean {
    return this._reminders.delete(id);
  }

  add(r: StoredReminder) {
    // Add or update if already exists (Map behavior)
    this._reminders.set(r.id, r);
  }

  getById(id: string): StoredReminder | undefined {
    return this._reminders.get(id);
  }

  toArray(): StoredReminder[] {
    return Array.from(this._reminders.values());
  }
}

export default new ReminderManager();
