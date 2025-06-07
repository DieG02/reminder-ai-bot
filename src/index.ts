import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Telegraf, session } from "telegraf";
// import { message } from "telegraf/filters";
import { rescheduleAllReminders, scheduledJobs } from "./services/cron";
import commandHandlers from "./handlers/commands";
import messageHandlers from "./handlers/messages";
import { AIContext } from "./types/app";

// -- Environment Variables --
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN!;
const PORT = parseInt(process.env.PORT || "3000");

// Initialize bot with token from env
export const bot = new Telegraf<AIContext>(TOKEN);

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

  if (!!WEBHOOK_DOMAIN) {
    const app = express();
    app.use(express.json());

    await bot.launch({
      webhook: {
        domain: WEBHOOK_DOMAIN,
        hookPath: `/webhook/${process.env.TELEGRAM_BOT_TOKEN}`,
        port: PORT,
      },
    });

    app.get("/", (_, res) => res.send("Reminder AI Bot is alive!"));

    app.listen(PORT, () => {
      console.log(`🚀 Webhook server listening on port ${PORT}`);
    });
  } else {
    // Fallback to polling (local dev, no domain)
    await bot.launch();
    console.log("🤖 Bot is running with long polling");
  }
})();

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  await bot.stop(signal);
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
