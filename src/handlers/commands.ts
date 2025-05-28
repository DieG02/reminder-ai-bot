import { Composer } from "telegraf";
import { AIContext } from "../types/app";
import { getUserReminders } from "../store/firebase";
import { StoredReminder } from "../types";

// Create a single Composer instance to hold all commands
const composer = new Composer<AIContext>();

// Now, in your command or text handlers, you can access ctx.session
composer.command("start", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.count = 0;
  ctx.session.username = ctx.from?.username;
  await ctx.reply(
    `Welcome ${ctx.session.username}! Your session count is ${ctx.session.count}.`
  );
});

composer.command("name", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "name";
  await ctx.reply("What is your name?");
});

composer.command("help", async (ctx) => {
  await ctx.reply(
    "Available commands:\n/start - Start the bot\n/help - Show this help message\n/mycommand - Do something specific"
  );
});

composer.command("all", async (ctx) => {
  await ctx.reply("You executed /all!");
});

// composer.command("myreminders", async (ctx) => {
//   const userId = ctx.from.id;
//   const chatId = ctx.chat.id;

//   const response = await getUserReminders(chatId);
//   if (!response)
//     let message = ""
//     response?.map(({ }: StoredReminder) => {
//       message += element
//     })
//     ctx.reply(`User ID: ${userId} | Chat ID: ${chatId}`);
// });

composer.command("showreminders", async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat.id;
  if (!userId) {
    return ctx.reply("Could not identify you. Please try again.");
  }

  // Get reminders for the current user/chat
  const userReminders = await getUserReminders(chatId);
  if (!userReminders) {
    return ctx.reply("You have no pending reminders.");
  }

  // Helper function to escape MarkdownV2 special characters
  const escapeMarkdownV2 = (text: string): string => {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
  };

  let message = `*Here are your pending reminders:*\n\n`; // Start with a bold title

  userReminders.forEach((reminder, index) => {
    // Convert Firestore Timestamp to Date object, then format
    const scheduleDate = reminder.scheduleDateTime; // Convert Timestamp to Date
    const formattedDate = scheduleDate.toLocaleString("en-US");

    message += `*${index + 1}\\. Code:* ${reminder.code || "AABBCC"}\n`;
    message += `*Time:* ${escapeMarkdownV2(formattedDate)}\n`;
    message += `*Task:* ${escapeMarkdownV2(reminder.task)}\n\n`;
  });

  try {
    await ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Failed to send MarkdownV2 message:", error);
    // Fallback to plain text if MarkdownV2 parsing fails
    await ctx.reply(
      "Error displaying reminders. Here they are in plain text:\n\n" +
        userReminders
          .map((r) => `${r.task} at ${r.scheduleDateTime.toLocaleString()}`)
          .join("\n")
    );
  }
});

// composer.command("sendreminders", async (ctx) => {
// const remindersToSend = ctx.reminders.toArray();
// if (remindersToSend.length > 0) {
//     await ctx.reply(`I have ${remindersToSend.length} reminders to send.`);
//     // Simulate sending a reminder and then removing it
//     for (const r of remindersToSend) {
//         await ctx.reply(`Sending reminder: "${r.message}" (ID: ${r.id})`);
//         // In a real app, you'd send it to a user and then delete from Firestore
//         ctx.reminders.remove(r.id);
//     }
//     await ctx.reply('All available reminders processed!');
// } else {
//     await ctx.reply('No reminders currently loaded.');
// }
// });

export default composer;
