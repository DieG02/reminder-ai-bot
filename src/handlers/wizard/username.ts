import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { Wizard } from "../../types/constants";

const usernameWizard = new Scenes.WizardScene<AIContext>(
  Wizard.USERNAME,
  async (ctx) => {
    await ctx.reply("👤 What's your username?");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    const input = ctx.message?.text?.trim();
    if (input) {
      ctx.state.manager.syncProfile({ username: input });
      await ctx.reply(`✅ Username set to ${input}`);
    }
    return ctx.scene.leave();
  }
);

export default usernameWizard;
