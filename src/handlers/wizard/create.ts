import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";

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
    await ctx.reply("📝 What's the reminder name?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const input = ctx.message?.text?.trim();
    if (input) {
      ctx.session.body!.task = input;
      await ctx.reply(
        "⏰ What time should I remind you? (e.g. 2025-06-01T15:00)"
      );
      return ctx.wizard.next();
    }
    await ctx.reply("⚠️ Please provide a valid reminder name.");
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const input = ctx.message?.text?.trim();
    const time = new Date(input || "");

    if (isNaN(time.getTime())) {
      await ctx.reply("⚠️ Invalid date format. Try 2025-06-01T15:00");
      return;
    }

    ctx.session.body!.date = time.getDate().toLocaleString();
    ctx.session.body!.time = time.getTime().toLocaleString();
    await ctx.reply(
      `✅ Reminder '${ctx.session.body?.task}' set for ${time.toISOString()}`
    );
    console.log(ctx.session.body);
    return ctx.scene.leave();
  }
);

export default createWizard;
