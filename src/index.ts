import dotenv from "dotenv";
dotenv.config();

import { Telegraf, session } from "telegraf";
import { rescheduleAllReminders, scheduledJobs } from "./services/cron";
import commandHandlers from "./handlers/commands";
import wizardHandlers from "./handlers/wizard";
import messageHandlers from "./handlers/messages";
import { AIContext } from "./types/app";

// --- Environment Variables ---
const RELEASE = process.env.MODE;
const PORT = process.env.PORT;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Initialize bot with token from env
export const bot = new Telegraf<AIContext>(TOKEN);

// --- Session middleware ---
bot.use(session());

// --- Handle ALL Errors ---
bot.catch((err: unknown, ctx: AIContext) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  if (ctx.chat) {
    ctx.reply("Oops, something went wrong!");
  }
});

// --- Command Handler ---
bot.use(commandHandlers);

// -- Wizard Handler ---
bot.use(wizardHandlers);

// --- Message Handler ---
bot.use(messageHandlers);

// --- Bot Startup ---
(async () => {
  console.log("Bot starting...");
  await rescheduleAllReminders();

  if (RELEASE === "PRODUCTION") {
    // --- PRODUCTION MODE (WEBHOOKS) ---
    if (!WEBHOOK_URL) {
      console.error(
        "WEBHOOK_URL environment variable is not set in production mode!"
      );
      process.exit(1);
    }

    try {
      await bot.launch({
        webhook: {
          domain: WEBHOOK_URL,
          port: PORT ? parseInt(PORT) : 8080,
        },
      });
      console.log(`🚀 Webhook server listening on port ${PORT}`);
      console.log(`Telegram webhook set to: ${WEBHOOK_URL}`);
      console.log("🤖 Bot is running in Webhook Mode.");
    } catch (error) {
      console.error("Error starting bot in webhook mode:", error);
      process.exit(1);
    }
  } else {
    // --- DEVELOPMENT MODE (LONG POLLING) ---
    try {
      await bot.launch();
      console.log("🤖 Bot is running with long polling (development mode)");
    } catch (error) {
      console.error("Error starting bot in long polling mode:", error);
      process.exit(1);
    }
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
