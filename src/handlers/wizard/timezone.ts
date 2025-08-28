import { Markup, Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";
import { searchTimezones } from "../../utils";

const timezoneWizard = new Scenes.WizardScene<AIContext>(
  Wizard.TIMEZONE,
  async (ctx) => {
    await ctx.reply("🌍 Please insert your country or city name below:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    // TODO: Fix couldn't readt prop 'message' (they sent a sticker or something else)
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const input = ctx.message?.text?.trim();
    const matches = searchTimezones(input);

    if (matches.length === 0) {
      await ctx.reply("❌ No matching timezones found. Try again.");
      return; // Stay in same step
    }

    // Store matches temporarily in session to pick later
    ctx.session.timezoneMatches = matches.map((tz) => tz.name);

    await ctx.reply(
      "🔍 Select your timezone:",
      Markup.keyboard(matches.map((tz) => tz.name))
        .oneTime()
        .resize()
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const selected = ctx.message.text.trim();
    if (ctx.session.timezoneMatches?.includes(selected)) {
      ctx.manager.syncProfile({ timezone: selected });
      await ctx.reply(
        `✅ Timezone set to ${selected}`,
        Markup.removeKeyboard()
      );
      return ctx.scene.leave();
    }

    await ctx.reply("❌ Please choose a timezone from the list shown.");
    return; // Stay in current step
  }
);

export default timezoneWizard;
