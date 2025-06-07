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
  await rescheduleAllReminders(); // Reschedule reminders on every startup

  if (RELEASE === "PRODUCTION") {
    // --- PRODUCTION/DEPLOYMENT MODE (WEBHOOKS) ---
    // In production, WEBHOOK_DOMAIN must be set in your Render/Northflank environment variables.
    if (!WEBHOOK_DOMAIN) {
      console.error(
        "WEBHOOK_DOMAIN environment variable is not set in production mode!"
      );
      process.exit(1); // Exit if critical config is missing
    }

    const app = express();
    app.use(express.json()); // Middleware to parse JSON request bodies

    // Create a secure webhook path
    const telegramWebhookEndpoint = `/bot${bot.secretPathComponent()}`;

    // Telegraf's webhook callback is used here
    app.post(telegramWebhookEndpoint, (req, res) =>
      bot.handleUpdate(req.body, res)
    );

    // Optional: A simple route for health checks or debugging
    app.get("/", (_, res) => res.send("Reminder AI Bot is alive!"));

    app.listen(PORT, async () => {
      console.log(`🚀 Webhook server listening on port ${PORT}`);
      // Set the webhook with Telegram
      try {
        await bot.telegram.setWebhook(
          `${WEBHOOK_DOMAIN}${telegramWebhookEndpoint}`
        );
        console.log(
          `Telegram webhook set to: ${WEBHOOK_DOMAIN}${telegramWebhookEndpoint}`
        );
      } catch (error) {
        console.error("Failed to set Telegram webhook:", error);
        // Important: In production, if webhook setup fails, your bot won't receive updates.
        process.exit(1);
      }
    });
    console.log("🤖 Bot is running in Webhook Mode.");
  } else {
    // --- DEVELOPMENT MODE (LONG POLLING) ---
    // In dev mode, we just launch the bot for long polling.
    // WEBHOOK_DOMAIN is not needed for long polling.
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
