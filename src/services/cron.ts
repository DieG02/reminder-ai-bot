import { CronJob } from "cron";
import { bot } from "../index";
import { local, store } from "../store";
import { StoredReminder } from "../types";
import { NEXT_SCHEDULE_WINDOW } from "../types/constants";

export let scheduledJobs: { [key: string]: CronJob } = {};

const isPast = (date: string | Date) => {
  return new Date(date) < new Date();
};

const deliverReminder = async (reminder: StoredReminder, jobId: string) => {
  try {
    console.log(
      `Sending reminder for "${reminder.task}" to chat ${reminder.chatId}`
    );
    await bot.telegram.sendMessage(
      reminder.chatId,
      `🔔 Reminder: ${reminder.task}`
    );
    await store.deleteReminder(reminder.id);
    local.remove(reminder.id);
    delete scheduledJobs[jobId];
  } catch (error) {
    console.error(`Failed to send reminder for "${reminder.task}":`, error);
    reminder.isScheduled = false;
    await store.updateReminder(reminder);
  }
};

export const scheduleNotification = (reminder: StoredReminder): void => {
  const jobId = `reminder-${reminder.id}`;
  const targetTime = new Date(reminder.scheduleDateTime).getTime();
  const now = Date.now();
  const delay = targetTime - now;

  if (isPast(reminder.scheduleDateTime)) {
    console.log(
      `Reminder for "${reminder.task}" at ${reminder.scheduleDateTime} is in the past.`
    );
    store.deleteReminder(reminder.id);
    return;
  }

  if (delay > NEXT_SCHEDULE_WINDOW) {
    // Schedule an intermediate timeout that will schedule the real one later
    const intermediateTimeout = setTimeout(() => {
      console.log(
        `Intermediate timeout reached for reminder "${reminder.task}"`
      );
      scheduleNotification(reminder); // Retry closer to actual time
    }, NEXT_SCHEDULE_WINDOW);

    const fakeJob = {
      stop: () => clearTimeout(intermediateTimeout),
    } as CronJob;

    scheduledJobs[jobId] = fakeJob;
  } else {
    const finalDelay = targetTime - Date.now();
    const finalTimeout = setTimeout(
      async () => deliverReminder(reminder, jobId),
      finalDelay
    );

    const fakeJob = {
      stop: () => clearTimeout(finalTimeout),
    } as CronJob;

    scheduledJobs[jobId] = fakeJob;
  }

  reminder.jobId = jobId;
  reminder.isScheduled = true;
  store.updateReminder(reminder);
  console.log(`Scheduled "${reminder.task}" at ${reminder.scheduleDateTime}`);
};

export const rescheduleAllReminders = async (): Promise<void> => {
  await store.loadReminders();

  for (const reminder of local.toArray()) {
    if (isPast(reminder.scheduleDateTime)) {
      console.log(`Deleting expired reminder "${reminder.task}"`);
      await store.deleteReminder(reminder.id);
      local.remove(reminder.id);
    } else if (!reminder.isScheduled) {
      console.log(`Rescheduling reminder "${reminder.task}"`);
      scheduleNotification(reminder);
    }
  }
};
