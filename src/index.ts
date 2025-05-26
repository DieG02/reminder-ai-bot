import dotenv from "dotenv";
dotenv.config();

import { Telegraf } from "telegraf";
import { parse } from "date-fns";
import { enGB } from "date-fns/locale";
import { reminders } from "./manager";
import { addReminder } from "./firebase";
import { extractReminder } from "./openai";
import {
  scheduleNotification,
  rescheduleAllReminders,
  scheduledJobs,
} from "./cron";
import { ReminderData, StoredReminder } from "./types";

// Initialize bot
export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// --- Message Handler ---
bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;

  const messageText = ctx.message.text;
  const content = await extractReminder(messageText);
  console.log(content);
  content.map(async (data: ReminderData) => {
    console.log({ data });
    if (
      data.status === "COMPLETED" &&
      data.reminder?.date &&
      data.reminder?.time &&
      data.reminder?.task
    ) {
      const { date, time, task } = data.reminder;
      const dateTimeString = `${date} ${time}`;
      const scheduleDateTime = parse(
        dateTimeString,
        "dd/MM/yyyy HH:mm",
        new Date(),
        {
          locale: enGB,
        }
      );

      if (isNaN(scheduleDateTime.getTime())) {
        await ctx.reply(
          "I couldn't understand the date/time for the reminder. Please try again."
        );
        return;
      }

      const newReminder: StoredReminder = {
        id: "",
        chatId,
        task,
        scheduleDateTime,
        jobId: "",
        isScheduled: false,
      };

      try {
        const docId = await addReminder(newReminder);
        newReminder.id = docId;
        reminders.add(newReminder);
        scheduleNotification(newReminder);

        await ctx.reply(
          `Got it! I'll remind you to "${task}" on ${date} at ${time}.`
        );
      } catch (err) {
        console.error("Failed to save or schedule reminder:", err);
        await ctx.reply("Sorry, I couldn't save your reminder.");
      }
    } else {
      await ctx.reply(
        "I'm not sure what reminder you're asking for. Try again?"
      );
    }
  });
});

// --- Bot Startup ---
(async () => {
  console.log("Bot starting...");
  await rescheduleAllReminders();
  await bot.launch();
  console.log("Bot is running!");
})();

// --- Graceful Shutdown ---
process.once("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  bot.stop("SIGINT");
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  bot.stop("SIGTERM");
  process.exit(0);
});
