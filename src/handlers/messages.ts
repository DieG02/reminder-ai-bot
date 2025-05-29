import { Composer } from "telegraf";
import { parse } from "date-fns";
import { enGB } from "date-fns/locale";
import { local, store } from "../store";
import { extractReminder } from "../services/openai";
import { scheduleNotification } from "../services/cron";
import { wizardMiddleware } from "./wizard";
import { generateShortCode } from "../utils";
import { AIContext } from "../types/app";
import { ReminderData, StoredReminder } from "../types";

const composer = new Composer<AIContext>();

composer.on("text", wizardMiddleware, async (ctx) => {
  ctx.session = ctx.session || {};
  const chatId = ctx.chat.id;
  const messageText = ctx.message.text;

  const content = await extractReminder(messageText, true);
  content.map(async (data: ReminderData) => {
    if (
      data.status === "COMPLETED" &&
      data.reminder?.date &&
      data.reminder?.time &&
      data.reminder?.task
    ) {
      const { date, time, task } = data.reminder;
      const scheduleDateTime = parse(
        `${date} ${time}`,
        "dd/MM/yyyy HH:mm",
        new Date(),
        { locale: enGB }
      );

      if (isNaN(scheduleDateTime.getTime())) {
        await ctx.reply(
          "I couldn't understand the date/time for the reminder. Please try again."
        );
        return;
      }

      const code = generateShortCode();
      const newReminder: StoredReminder = {
        id: "",
        chatId,
        task,
        scheduleDateTime,
        jobId: "",
        isScheduled: false,
        code,
      };

      try {
        const docId = await store.addReminder(newReminder);
        newReminder.id = docId;
        local.add(newReminder);
        scheduleNotification(newReminder);

        const message = `Got it! I'll remind you to "${task}" on ${date} at ${time}
        *Reminder Code:* \`${code}\``;
        await ctx.reply(message, { parse_mode: "MarkdownV2" });
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

export default composer;
