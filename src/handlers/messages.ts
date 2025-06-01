import { Composer } from "telegraf";
import { local, store } from "../store";
import { extractReminder } from "../services/openai";
import { scheduleNotification } from "../services/cron";
import { wizardMiddleware } from "./wizard";
import { AIContext } from "../types/app";
import { generateShortCode, getScheduleDateTime } from "../utils";
import { ReminderData, StatusType, StoredReminder } from "../types";

const composer = new Composer<AIContext>();

composer.on("text", wizardMiddleware, async (ctx) => {
  ctx.session = ctx.session || {};
  const chatId = ctx.chat.id;
  const messageText = ctx.message.text;

  const content = await extractReminder(messageText, false);
  content.map(async (data: ReminderData) => {
    const { task } = data.reminder;
    const code = generateShortCode();

    // TODO: For now, we handle PENDING & REJECTED together
    if (data.status !== StatusType.COMPLETED || !task) {
      await ctx.reply(
        "I'm not sure what reminder you're asking for. Try again?"
      );
      return;
    }

    const scheduleDateTime = getScheduleDateTime(data.reminder);
    if (!scheduleDateTime) {
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
      code,
      repeat: data.repeat,
      repeatCount: data.repeatCount,
      repeatUntil: data.repeatUntil,
    };

    try {
      const docId = await store.addReminder(newReminder);
      newReminder.id = docId;
      local.add(newReminder);
      scheduleNotification(newReminder);

      const dateString: string = scheduleDateTime.format("DD/MM/YYYY");
      const timeString: string = scheduleDateTime.format("HH:mm");

      const message = `Got it\\! I'll remind you to "${task}" on ${dateString} at ${timeString}\n*Reminder Code:* \`${code}\``;
      await ctx.reply(message, {
        parse_mode: "MarkdownV2",
      });
    } catch (err) {
      console.error("Failed to save or schedule reminder:", err);
      await ctx.reply("Sorry, I couldn't save your reminder.");
    }
  });
});

export default composer;
