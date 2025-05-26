import { CronJob } from "cron";
import { loadReminders, updateReminder, deleteReminder } from "./firebase";
import { reminders } from "./manager";
import { StoredReminder } from "./types";
import { bot } from ".";

export let scheduledJobs: { [key: string]: CronJob } = {};

function isPast(date: string | Date) {
  return new Date(date) < new Date();
}

export const scheduleNotification = (reminder: StoredReminder): void => {
  const jobId = `reminder-${reminder.id}`;
  const scheduleDate = new Date(reminder.scheduleDateTime);

  if (isPast(scheduleDate)) {
    console.log(
      `Reminder for "${reminder.task}" at ${reminder.scheduleDateTime} is in the past.`
    );
    deleteReminder(reminder.id);
    return;
  }

  const delay = scheduleDate.getTime() - Date.now();

  const timeout = setTimeout(async () => {
    console.log(
      `Sending reminder for "${reminder.task}" to chat ${reminder.chatId}`
    );
    try {
      console.log(reminder.chatId, `🔔 Reminder: ${reminder.task}`);
      await bot.telegram.sendMessage(
        reminder.chatId,
        `🔔 Reminder: ${reminder.task}`
      );
      // await bot.sendMessage(reminder.chatId, `🔔 Reminder: ${reminder.task}`);
      await deleteReminder(reminder.id);
      reminders.remove(reminder.id);
      delete scheduledJobs[jobId];
    } catch (error) {
      console.error(`Failed to send reminder for "${reminder.task}":`, error);
      reminder.isScheduled = false;
      await updateReminder(reminder);
    }
  }, delay);

  const fakeJob = {
    stop: () => clearTimeout(timeout),
  } as CronJob;

  scheduledJobs[jobId] = fakeJob;
  reminder.jobId = jobId;
  reminder.isScheduled = true;
  updateReminder(reminder);

  console.log(`Scheduled "${reminder.task}" at ${reminder.scheduleDateTime}`);
};

export const rescheduleAllReminders = async (): Promise<void> => {
  await loadReminders();
  reminders.toArray().forEach((reminder) => {
    if (!reminder.isScheduled && !isPast(reminder.scheduleDateTime)) {
      scheduleNotification(reminder);
    } else if (isPast(reminder.scheduleDateTime)) {
      deleteReminder(reminder.id);
    }
  });
};
