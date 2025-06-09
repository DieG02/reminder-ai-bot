import { Scenes } from "telegraf";
import { AIContext } from "../../types/app";
import { store } from "../../store";
import { Wizard } from "../../types/constants";

const deleteWizard = new Scenes.WizardScene<AIContext>(
  Wizard.DELETE,
  async (ctx) => {
    await ctx.reply("⚠️ Enter the code of the reminder to delete:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!("text" in ctx.message!)) return ctx.scene.leave();

    let input = ctx.message?.text?.trim().toUpperCase();
    if (input) {
      const success = await store.deleteReminder(input);
      if (success) {
        await ctx.reply(`🗑️ Task with code '${input}' was deleted.`);
      } else {
        await ctx.reply(`❌ Couldn't delete task with code '${input}'.`);
      }
    }
    return ctx.scene.leave();
  }
);

export default deleteWizard;
