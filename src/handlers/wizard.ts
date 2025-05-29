import { MiddlewareFn } from "telegraf";
import { AIContext } from "../types/app";
import { store } from "../store";

type FlowHandler = (ctx: AIContext, input: string) => Promise<void>;

const flowHandlers: Record<string, FlowHandler> = {
  name: async (ctx, input) => {
    ctx.session!.username = input;
    ctx.session!.waiting = undefined;
    await ctx.reply(`✅ Username set to ${input}`);
  },

  timezone: async (ctx, input) => {
    ctx.session!.timezone = input;
    ctx.session!.waiting = undefined;
    await ctx.reply(`✅ Timezone set to ${input}`);
  },

  // new: async (ctx, input) => {
  //   // example: use session to guide next steps
  //   ctx.session!.newReminderName = input;
  //   ctx.session!.waiting = "reminder_time";
  //   await ctx.reply(
  //     "⏰ What time should I remind you? (e.g., 2025-06-01T15:00)"
  //   );
  // },

  // reminder_time: async (ctx, input) => {
  //   const name = ctx.session!.newReminderName;
  //   const time = new Date(input);

  //   if (isNaN(time.getTime())) {
  //     await ctx.reply(
  //       "⚠️ Invalid date format. Please try again (ISO format like 2025-06-01T15:00)."
  //     );
  //     return;
  //   }

  //   // Save reminder logic here
  //   ctx.session!.waiting = undefined;
  //   await ctx.reply(`✅ Reminder '${name}' set for ${time.toISOString()}`);
  // // },

  // update: async (ctx, input) => {
  //   // Implement update logic here
  //   ctx.session!.waiting = undefined;
  //   await ctx.reply("🛠️ Update flow not implemented yet.");
  // },

  delete: async (ctx, input) => {
    ctx.session!.waiting = undefined;
    input = input.toUpperCase();
    const output = await store.deleteReminder(input);
    if (output) {
      await ctx.reply(`🗑️ Task with code '${input}' was deleted.`);
    } else {
      await ctx.reply(
        `❌ There was an error deleting your task with code '${input}', try again.`
      );
    }
  },

  clear: async (ctx, input) => {
    if (input !== ctx.from!.username) {
      ctx.session!.waiting = undefined;
      await ctx.reply("❌ Username doesn't match. Action cancelled.");
    } else {
      await store.clearUserReminders(ctx.chat!.id);
      ctx.session!.waiting = undefined;
      await ctx.reply("✅ All your reminders have been cleared.");
    }
  },
};

export const wizardMiddleware: MiddlewareFn<AIContext> = async (ctx, next) => {
  ctx.session = ctx.session || {};

  if ("text" in ctx.message! && ctx.session.waiting) {
    const input = ctx.message.text?.trim();
    const waiting = ctx.session.waiting;

    if (input) {
      const handler = flowHandlers[waiting];

      if (handler) {
        // If a handler was found and executed, we assume the flow is handled
        await handler(ctx, input);
        return; // Stop the middleware chain
      }
    }
  }

  // If no wizard flow was handled, continue to the next middleware
  await next();
};
