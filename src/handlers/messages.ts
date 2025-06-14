import { Composer } from "telegraf";
import { store } from "../store";
import { extract } from "../config/openai";
import { ContentType } from "../config/context";
import { scheduleNotification } from "../services/cron";
import { AIContext } from "../types/app";
import { generateShortCode, getScheduleDateTime } from "../utils";
import { ReminderData, StatusType, StoredReminder } from "../types";
import { UserProfile } from "../types/user";

const composer = new Composer<AIContext>();

composer.on("text", async (ctx) => {
  ctx.session = ctx.session || {};
  const chatId = ctx.chat.id;
  const messageText = ctx.message.text;
  const profile: UserProfile = ctx.state.manager.profile;

  const content = await extract(messageText, ContentType.REMINDER);
  console.log(content);
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

    const scheduleDateTime = getScheduleDateTime(
      data.reminder,
      profile.timezone
    );
    console.log(scheduleDateTime?.toDate());
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
      scheduleNotification(newReminder);

      const dateString: string = scheduleDateTime
        .tz("Europe/Rome")
        .format("DD/MM/YYYY");
      const timeString: string = scheduleDateTime
        .tz("Europe/Rome")
        .format("HH:mm");

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
