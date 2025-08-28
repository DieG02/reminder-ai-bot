import { Markup, Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { extract } from "../../config/openai";
import { ContentType } from "../../config/context";

type TaskType = "FIXED" | "FLEXIBLE" | "UNSCHEDULED";

interface TaskItem {
  name: string;
  type: TaskType;
  time?: string;
  duration?: number;
  suggestedTime?: string;
  confirmed?: boolean;
  skipped?: boolean;
}

export const escape = (text: string): string => {
  return text.replace(/[_[\]()~`>#+\-=|{}.!]/g, "\\$&");
};

const timetableWizard = new Scenes.WizardScene(
  Wizard.TIMETABLE,

  // Step 0: Init
  async (ctx: any) => {
    ctx.session.taskIndex = 0;
    await ctx.reply("📅 Let's plan your day step-by-step!");
    return ctx.wizard.selectStep(1);
  },

  // Step 1: Show current task with options
  async (ctx: any) => {
    if (!ctx.session.tasks?.length) {
      const content = await extract(ctx.message.text, ContentType.TASK);
      console.log(content);
      ctx.session.tasks = content;
    }
    const task = ctx.session.tasks?.[ctx.session.taskIndex];
    if (!task) return ctx.wizard.steps[3](ctx); // No more tasks

    let message = "";
    let buttons: InlineKeyboardButton[] = [];

    switch (task.type) {
      case "FIXED":
        message = `📌 *${task.name}* at *${task.time}*\nDo you want to keep it?`;
        buttons = [
          Markup.button.callback("✅ Confirm", "confirm"),
          Markup.button.callback("❌ Skip", "skip"),
        ];
        break;

      case "FLEXIBLE":
        task.suggestedTime = task.suggestedTime || "16:00";
        message = `📘 *${task.name}* — ${task.duration}min\nSuggested time: *${task.suggestedTime}*`;
        buttons = [
          Markup.button.callback("✅ Confirm", "confirm"),
          Markup.button.callback("⏰ Change", "change_time"),
          Markup.button.callback("❌ Skip", "skip"),
        ];
        break;

      case "UNSCHEDULED":
        task.duration = task.duration || 45;
        message = `🌀 *${task.name}*\nNo time set. Duration: ${task.duration}min\nSchedule it?`;
        buttons = [
          Markup.button.callback("✅ Confirm", "confirm"),
          Markup.button.callback("❌ Skip", "skip"),
        ];
        break;
    }

    await ctx.reply(escape(message), {
      parse_mode: "MarkdownV2",
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    });

    return ctx.wizard.selectStep(2); // Wait for user's choice
  },

  // Step 2: Handle user's choice (confirm / skip / change time / set time)
  async (ctx: any) => {
    if (!ctx.callbackQuery) return;

    const action = ctx.callbackQuery.data;
    console.log(action, ctx.session.taskIndex);
    const task = ctx.session.tasks?.[ctx.session.taskIndex];
    await ctx.answerCbQuery();

    if (!task) return ctx.wizard.selectStep(3);

    // Handle each action
    if (action === "confirm") {
      task.confirmed = true;
      task.time = task.time || task.suggestedTime;
      ctx.session.taskIndex += 1;
      return ctx.wizard.steps[1](ctx);
    }

    if (action === "skip") {
      task.skipped = true;
      ctx.session.taskIndex += 1;
      return ctx.wizard.steps[1](ctx);
    }

    if (action === "change_time") {
      await ctx.editMessageText(
        `🕓 Choose new time for *${escape(task.name)}*`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: Markup.inlineKeyboard(
            ["14:00", "15:00", "16:00"].map((t) =>
              Markup.button.callback(t, `set_time:${t}`)
            )
          ).reply_markup,
        }
      );
      return; // Stay in same step to wait for time input
    }

    if (action.startsWith("set_time:")) {
      const newTime = action.split(":")[1];
      task.time = newTime;
      task.confirmed = true;
      await ctx.answerCbQuery(`Time set to ${newTime}`);
      ctx.session.taskIndex += 1;
      return ctx.wizard.steps[1](ctx);
    }
  },

  // Step 3: Final summary
  async (ctx: any) => {
    const confirmed = ctx.session.tasks.filter((t: TaskItem) => t.confirmed);
    const skipped = ctx.session.tasks.filter((t: TaskItem) => t.skipped);

    const summary = [
      "✅ Confirmed Tasks:",
      ...confirmed.map(
        (t: TaskItem) => `• ${t.name} at ${t.time || "any time"}`
      ),
      "\n❌ Skipped Tasks:",
      ...skipped.map((t: TaskItem) => `• ${t.name}`),
    ].join("\n");

    await ctx.replyWithMarkdownV2(`📋 *Summary*\n\n${escape(summary)}`);
    return ctx.scene.leave();
  }
);

export default timetableWizard;
