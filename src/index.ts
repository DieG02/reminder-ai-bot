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
const RELEASE = process.env.MODE;
const PORT = process.env.PORT || "8080";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

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

  if (RELEASE === "PRODUCTION") {
    // --- PRODUCTION/DEPLOYMENT MODE (WEBHOOKS) ---
    // In production, WEBHOOK_URL must be set in your Render/Northflank environment variables.
    if (!WEBHOOK_URL) {
      console.error(
        "WEBHOOK_URL environment variable is not set in production mode!"
      );
      process.exit(1);
    }

    const app = express();
    app.use(express.json());

    // Create a secure webhook path
    const telegramPath = `/bot${bot.secretPathComponent()}`;
    const webhook = `${WEBHOOK_URL}${telegramPath}`;

    app.use(bot.webhookCallback(telegramPath));
    app.get("/", (_, res) => res.send("Reminder AI Bot is alive!"));

    app.listen(PORT, async () => {
      console.log(`🚀 Webhook server listening on port ${PORT}`);
      try {
        await bot.telegram.setWebhook(webhook);
        console.log(`Telegram webhook set to: ${webhook}`);
      } catch (error) {
        console.error("Failed to set Telegram webhook:", error);
        process.exit(1);
      }
    });
    console.log("🤖 Bot is running in Webhook Mode.");
  } else {
    // --- DEVELOPMENT MODE (LONG POLLING) ---
    // In dev mode, we just launch the bot for long polling.
    // WEBHOOK_URL is not needed for long polling.
    await bot.launch();
    console.log("🤖 Bot is running with long polling (development mode)");
  }
})();

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  for (const jobId in scheduledJobs) {
    scheduledJobs[jobId].stop?.();
  }
  await bot.stop(signal); // Ensure bot stops gracefully
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
