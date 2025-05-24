import dotenv from "dotenv";
dotenv.config();

import { Telegraf } from "telegraf";
import { getReminder } from "./openai";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const chatID = ctx.message.chat.id;

  const data = await getReminder(userMessage);
  console.log(data);

  data.map((task: any) => {
    const { reminder, status, missing, roadmap } = task;
    console.log(task);
    return ctx.reply(
      `✅ Got it! I'll remind you to ${reminder.task} at ${reminder.time} on ${reminder.date}.`
    );
  });
});

bot.launch();
console.log("Bot launched successfully!");
