import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { store } from "../../store";
import { Wizard } from "../../types/constants";

const clearWizard = new Scenes.WizardScene<AIContext>(
  Wizard.CLEAR,
  async (ctx) => {
    await ctx.reply(
      `⚠️ Type "${ctx.manager.profile?.username}" to confirm clearing all reminders:`
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();
    const input = ctx.message?.text?.trim();
    const profile = ctx.manager.profile!;
    if (input !== profile.username) {
      await ctx.reply("❌ Username doesn't match. Action cancelled.");
    } else {
      await store.clearUserReminders(profile.id);
      await ctx.reply("✅ All your reminders have been cleared.");
    }
    return ctx.scene.leave();
  }
);

export default clearWizard;
