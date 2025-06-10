import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";

const timezoneWizard = new Scenes.WizardScene<AIContext>(
  Wizard.TIMEZONE,
  async (ctx) => {
    await ctx.reply("🌍 What's your timezone?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const input = ctx.message?.text?.trim();
    if (input) {
      ctx.session.timezone = input;
      await ctx.reply(`✅ Timezone set to ${input}`);
    }
    return ctx.scene.leave();
  }
);

export default timezoneWizard;
