import { CronJob } from "cron";
import { loadReminders, updateReminder, deleteReminder } from "./firebase";
import { reminders } from "./model";
import { StoredReminder } from "./types";
import { bot } from "./index";
import { NEXT_SCHEDULE_WINDOW } from "./types/constants";

export let scheduledJobs: { [key: string]: CronJob } = {};

function isPast(date: string | Date) {
  return new Date(date) < new Date();
}

export const scheduleNotification = (reminder: StoredReminder): void => {
  const jobId = `reminder-${reminder.id}`;
  const targetTime = new Date(reminder.scheduleDateTime).getTime();
  const now = Date.now();
  const delay = targetTime - now;

  if (isPast(reminder.scheduleDateTime)) {
    console.log(
      `Reminder for "${reminder.task}" at ${reminder.scheduleDateTime} is in the past.`
    );
    deleteReminder(reminder.id);
    return;
  }

  const scheduleFinalTimeout = () => {
    const finalDelay = targetTime - Date.now();
    const finalTimeout = setTimeout(async () => {
      try {
        console.log(
          `Sending reminder for "${reminder.task}" to chat ${reminder.chatId}`
        );
        await bot.telegram.sendMessage(
          reminder.chatId,
          `Hey ${bot.context.session?.username}! 🔔 Reminder: ${reminder.task}`
        );
        await deleteReminder(reminder.id);
        reminders.remove(reminder.id);
        delete scheduledJobs[jobId];
      } catch (error) {
        console.error(`Failed to send reminder for "${reminder.task}":`, error);
        reminder.isScheduled = false;
        await updateReminder(reminder);
      }
    }, finalDelay);

    const fakeJob = {
      stop: () => clearTimeout(finalTimeout),
    } as CronJob;

    scheduledJobs[jobId] = fakeJob;
  };

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
    scheduleFinalTimeout();
  }

  reminder.jobId = jobId;
  reminder.isScheduled = true;
  updateReminder(reminder);

  console.log(`Scheduled "${reminder.task}" at ${reminder.scheduleDateTime}`);
};

export const rescheduleAllReminders = async (): Promise<void> => {
  await loadReminders();

  for (const reminder of reminders.toArray()) {
    if (isPast(reminder.scheduleDateTime)) {
      console.log(`Deleting expired reminder "${reminder.task}"`);
      await deleteReminder(reminder.id);
      reminders.remove(reminder.id);
    } else if (!reminder.isScheduled) {
      console.log(`Rescheduling reminder "${reminder.task}"`);
      scheduleNotification(reminder);
    }
  }
};
