import { Composer } from "telegraf";
import { store } from "../store";
import { AIContext } from "../types/app";
import { escapeMarkdownV2 } from "../utils";
import { createCalendarEvent } from "../services/calendar";

// Create a single Composer instance to hold all commands
const composer = new Composer<AIContext>();

composer.command("start", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.count = 0;
  ctx.session.username = ctx.session.username || ctx.from?.username;
  await ctx.reply(
    `👋 Welcome, *${ctx.session.username}*\\!\n\n` +
      `I'm here to help you stay organized with smart reminders\\.\n\n` +
      `✨ *Getting started is easy:*\n` +
      `• /name \\- Set your username\n` +
      `• /timezone \\- Set your timezone\n` +
      `• /all \\- View all your reminders\n\n` +
      `📖 For full instructions, use /info`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("help", async (ctx) => {
  await ctx.reply(
    `*Available commands:*\n\n` +
      `/start \\- Start the bot\n` +
      `/help \\- Show help message\n` +
      `/info \\- Learn how the bot works\n\n` +
      `/name \\- Set your username\n` +
      `/timezone \\- Set your timezone\n\n` +
      `/next \\- Show your next reminder\n` +
      `/all \\- Show all your reminders\n` +
      `/update \\- Update a reminder\n` +
      `/delete \\- Delete a reminder\n` +
      `/clear \\- Delete all reminders`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("info", async (ctx) => {
  await ctx.reply(
    `📌 *Bot Workflow & Features*\n\n` +
      `1\\. *Set Up Your Profile*\n` +
      `Use /name to define your username or set your local time using /timezone\\.\n\n` +
      `2\\. *Create Reminders*\n` +
      `You can create reminders by sending a message like:\n` +
      `"Remind me to call John tomorrow at 3 PM"\n\n` +
      `3\\. *Manage Reminders*\n` +
      `/next \\- View your next upcoming reminder\n` +
      `/all \\- View all saved reminders\n` +
      `/update \\- Modify a reminder\n` +
      `/delete \\- Remove a specific reminder\n` +
      `/clear \\- Delete all reminders at once\n\n` +
      `🧠 The bot understands natural language\\! Try writing reminders in your own words\\.`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("name", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "name";
  await ctx.reply("What is your username?");
});

composer.command("timezone", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "timezone";
  await ctx.reply("What is your timezone?");
});

// `/new - Create a new reminder`
// composer.command("new", async (ctx: AIContext) => {
//   ctx.session = ctx.session || {};
//   ctx.session.waiting = "name";
//   await ctx.reply("What is your name?");
// });

composer.command("calendar", async (ctx: AIContext) => {
  // --- Example Usage ---
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const event = {
    summary: "Node.js Calendar Test Meeting",
    location: "Remote via Google Meet",
    description: "A test meeting scheduled from a Node.js application.",
    start: {
      dateTime: now.toISOString(),
      timeZone: "Europe/Rome", // Important: use IANA Time Zone Database format
    },
    end: {
      dateTime: oneHourLater.toISOString(),
      timeZone: "Europe/Rome",
    },
    // attendees: [
    //   { email: "diegob0505@gmail.com" }, // Replace with actual emails
    //   { email: "attendee2@example.com", optional: true },
    // ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
    // For Google Meet integration:
    conferenceData: {
      createRequest: {
        requestId: "your-unique-request-id-" + Date.now(), // Must be unique per event
        conferenceSolutionKey: {
          type: "hangoutsMeet", // Or 'eventHangout' for older type, 'addOn' for custom solutions
        },
      },
    },
  };

  try {
    await createCalendarEvent(event);
  } catch (error) {
    console.error("Failed to schedule event.");
  }
});

composer.command("next", async (ctx: AIContext) => {
  const chatId = ctx.chat!.id;

  // Get reminders for the current user/chat
  const next = await store.getNextUserReminder(chatId);
  if (!next) {
    return ctx.reply("You have no pending reminders.");
  }

  let message = `*Here is your next reminder:*\n\n`;
  const scheduleDate = next.scheduleDateTime;
  const formattedDate = scheduleDate.toLocaleString("en-GB");

  message += `*Code:* \`${next.code}\`\n`;
  message += `*Time:* ${formattedDate}\n`;
  message += `*Task:* ${escapeMarkdownV2(next.task)}\n\n`;

  try {
    await ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Failed to send MarkdownV2 message:", error);
    // Fallback to plain text if MarkdownV2 parsing fails
    await ctx.reply(
      "Error displaying reminders. Here they are in plain text:\n\n" +
        `${next.task} at ${next.scheduleDateTime.toLocaleString()}`
    );
  }
});

composer.command("all", async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat.id;
  if (!userId) {
    return ctx.reply("Could not identify you. Please try again.");
  }

  // Get reminders for the current user/chat
  const userReminders = await store.getUserReminders(chatId);
  if (!userReminders || userReminders?.length == 0) {
    return ctx.reply("You have no pending reminders.");
  }

  let message = `*Here are your pending reminders:*\n\n`;

  userReminders.map((reminder, i) => {
    const scheduleDate = reminder.scheduleDateTime;
    const formattedDate = scheduleDate.toLocaleString("en-GB");

    message += `*${i + 1}\\. Code:* \`${reminder.code}\`\n`;
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

// composer.command("update", async (ctx: AIContext) => {
//   ctx.session = ctx.session || {};
//   ctx.session.waiting = "update";
//   await ctx.reply(
//     "Enter the reminder code. Tip: use /all to get all your reminders."
//   );
// });

composer.command("delete", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "delete";
  await ctx.reply(
    "Enter the reminder code, you can use /all to get the list of all your pending reminders."
  );
});

composer.command("clear", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "clear";
  await ctx.reply(`To confirm, type "${ctx.from?.username}" in the box below:`);
});

export default composer;
