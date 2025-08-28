import dayjs from "../lib/dayjs";
import { Dayjs } from "dayjs";
import { StoredReminder } from "../types";
import { scheduledJobs } from "../services/cron";

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

  /**
   * Clears all existing reminders and then populates the manager with a new set of reminders.
   * @param reminders An array of StoredReminder objects to set.
   */
  reset(reminders: StoredReminder[]) {
    this._reminders.clear();
    reminders.forEach((r) => this._reminders.set(r.id, r));
  }

  /**
   * Removes all reminders from the manager
   */
  clear() {
    this._reminders.clear();
  }

  /**
   * Removes a specific reminder by its ID
   * @param id The ID of the reminder to remove
   * @returns `true` if the reminder was successfully removed, `false` otherwise
   */
  remove(id: string): boolean {
    const reminder = this.getById(id);
    const jobId = reminder?.jobId;
    if (jobId && scheduledJobs[jobId]) {
      scheduledJobs[jobId].stop();
      delete scheduledJobs[jobId];
      console.log(`Stopped and deleted cron job for reminder ID: ${id}`);
    }
    return this._reminders.delete(id);
  }

  /**
   * Adds a new reminder or updates an existing one if its ID already exists
   * @param r The StoredReminder object to add or update
   */
  add(r: StoredReminder) {
    // Add or update if already exists (Map behavior)
    this._reminders.set(r.id, r);
  }

  /**
   * Retrieves a reminder by its ID
   * @param id The ID of the reminder to retrieve
   * @returns The StoredReminder object if found, otherwise `undefined`
   */
  getById(id: string): StoredReminder | undefined {
    return this._reminders.get(id);
  }

  /**
   * Converts all stored reminders into an array
   * @returns An array containing all StoredReminder objects
   */
  toArray(): StoredReminder[] {
    return Array.from(this._reminders.values());
  }

  /**
   * Filters reminders based on a scheduleDateTime falling within a specified period
   *
   * @param start A Day.js object representing the start of the period (inclusive)
   * @param end A Day.js object representing the end of the period (inclusive)
   * @param userId A number representing the userId / chatId
   * @returns An array of StoredReminder objects that fall within the given period
   */
  filter(start: Dayjs, end: Dayjs, userId: string): StoredReminder[] {
    const filteredReminders: StoredReminder[] = [];

    if (start.isAfter(end)) {
      console.warn(
        "Filter period start is after end. Swapping dates for consistent filtering."
      );
      [start, end] = [end, start];
    }

    for (const reminder of this._reminders.values()) {
      if (reminder.chatId !== userId) continue;
      const scheduleDate = dayjs(reminder.scheduleDateTime);

      // Check if the scheduleDate is between the start and end, inclusive of both boundaries
      // '[]' means inclusive of start and end
      if (scheduleDate.isBetween(start, end, null, "[]")) {
        filteredReminders.push(reminder);
      }
    }

    return filteredReminders;
  }
}

export default new ReminderManager();
