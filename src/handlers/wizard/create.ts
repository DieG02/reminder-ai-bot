import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";
import { generateShortCode, getScheduleDateTime } from "../../utils";
import { scheduleNotification } from "../../services/cron";
import { store } from "../../store";
import { StoredReminder } from "../../types";

const createWizard = new Scenes.WizardScene<AIContext>(
  Wizard.CREATE,
  async (ctx) => {
    ctx.session.body = {
      date: null,
      time: null,
      task: null,
      relativeDuration: null,
      relativeUnit: null,
    };
    await ctx.reply(`📝 What's the task to remind?`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const task = ctx.message?.text?.trim();
    if (task) {
      ctx.session.body!.task = task;
      await ctx.reply(`⏰ When should I remind you?\n(e.g. DD/MM/YYYY)`);
      return ctx.wizard.next();
    }
    await ctx.reply("⚠️ Please provide a valid reminder name.");
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const date = ctx.message?.text?.trim();
    if (date) {
      ctx.session.body!.date = date;
      await ctx.reply(`⏰ What time should I remind you?\n(e.g. HH:mm)`);
      return ctx.wizard.next();
    }
    await ctx.reply("⚠️ Please provide a valid date.");
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const time = ctx.message?.text?.trim();
    const task = ctx.session.body?.task!;
    const code = generateShortCode();
    const chatId = ctx.chat!.id;
    ctx.session.body!.time = time;

    const scheduleDateTime = getScheduleDateTime(ctx.session.body!);
    console.log(scheduleDateTime);
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
      repeat: null,
      repeatCount: null,
      repeatUntil: null,
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
  }
);

export default createWizard;
