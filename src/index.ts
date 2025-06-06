import dotenv from "dotenv";
dotenv.config();

import { Telegraf, session } from "telegraf";
// import { message } from "telegraf/filters";
import { rescheduleAllReminders, scheduledJobs } from "./services/cron";
import commandHandlers from "./handlers/commands";
import messageHandlers from "./handlers/messages";
import { AIContext } from "./types/app";

// Initialize bot
export const bot = new Telegraf<AIContext>(process.env.TELEGRAM_BOT_TOKEN!);

// -- Session middleware --
bot.use(session());

// -- Handle ALL Errors --
bot.catch((err: unknown, ctx: AIContext) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  if (ctx.chat) {
    ctx.reply("Oops, something went wrong!");
  }
});

// -- Register the ALL commands handler --
bot.use(commandHandlers);

// --- Message Handler ---
bot.use(messageHandlers);

// --- Bot Startup ---
(async () => {
  console.log("Bot starting...");
  await rescheduleAllReminders();
  await bot.launch();
  console.log("Bot is running!");
})();

// --- Graceful Shutdown ---
process.once("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  bot.stop("SIGINT");
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  bot.stop("SIGTERM");
  process.exit(0);
});
