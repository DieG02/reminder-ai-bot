import dayjs from "../lib/dayjs";
import { Composer } from "telegraf";
import { store } from "../store";
import { AIContext } from "../types/app";
import { escapeMarkdownV2 } from "../utils";
import { PlanManager } from "../services/plan";
import { UserProfile } from "../types/user";

// Create a single Composer instance to hold all commands
const composer = new Composer<AIContext>();

composer.command("start", async (ctx: AIContext) => {
  // `middleware` handles the new/old users
  const profile = ctx.state.manager.profile;

  await ctx.reply(
    `👋 Welcome, *${profile?.username}*\\!\n\n` +
      `I'm here to help you stay organized with smart reminders\\.\n\n` +
      `✨ *Getting started is easy:*\n` +
      `• /name \\- Set your username\n` +
      `• /timezone \\- Set your timezone\n` +
      `• /all \\- View all your reminders\n\n` +
      `📖 For full instructions, use /info`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("help", async (ctx: AIContext) => {
  await ctx.reply(
    `*Available commands:*\n\n` +
      `/start \\- Start the bot\n` +
      `/help \\- Show help message\n` +
      `/info \\- Learn how the bot works\n\n` +
      `/name \\- Set your username\n` +
      // `/timezone \\- Set your timezone\n\n` +
      `/next \\- Show your next reminder\n` +
      `/agenda \\- Show all reminders for today\n` +
      `/all \\- Show all your reminders\n` +
      // `/update \\- Update a reminder\n` +
      `/delete \\- Delete a reminder\n` +
      `/clear \\- Delete all reminders`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("info", async (ctx: AIContext) => {
  await ctx.reply(
    `📌 *Bot Workflow & Features*\n\n` +
      `1\\. *Set Up Your Profile*\n` +
      `Use /name to define your username\n\n` +
      // `or set your local time using /timezone\\.\n\n` +
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

composer.command("next", async (ctx: AIContext) => {
  const chatId = ctx.chat!.id;
  const profile: UserProfile = ctx.state.manager.profile;

  const response = await store.getAllUserReminders(chatId, 1);
  if (!response?.length) return ctx.reply("You have no pending reminders.");
  const next = response[0];

  let message = `*Here is your next reminder:*\n\n`;
  const scheduleDate = dayjs(next.scheduleDateTime).tz(profile.timezone);
  const formattedDate = scheduleDate.format("MMM DD, YYYY - HH:mm");

  message += `*Code:* \`${next.code}\`\n`;
  message += `*Time:* ${escapeMarkdownV2(formattedDate)}\n`;
  message += `*Task:* ${escapeMarkdownV2(next.task)}\n\n`;

  try {
    await ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Failed to send MarkdownV2 message:", error);
    await ctx.reply(
      "Error displaying reminders. Here they are in plain text:\n\n" +
        `${next.task} at ${next.scheduleDateTime.toLocaleString()}`
    );
  }
});

composer.command("agenda", async (ctx: AIContext) => {
  const chatId = ctx.chat!.id;
  const profile: UserProfile = ctx.state.manager.profile;

  const agenda = await store.getUserAgenda(chatId);
  if (!agenda?.length) {
    return ctx.reply("You have no pending reminders for today.");
  }

  let message = `*Here is your agenda for today:*\n\n`;

  agenda.map((reminder, i) => {
    const scheduleDate = dayjs(reminder.scheduleDateTime).tz(profile.timezone);
    const formattedDate = scheduleDate.format("MMM DD, YYYY - HH:mm");

    message += `*${i + 1}\\. Code:* \`${reminder.code}\`\n`;
    message += `*Time:* ${escapeMarkdownV2(formattedDate)}\n`;
    message += `*Task:* ${escapeMarkdownV2(reminder.task)}\n\n`;
  });

  try {
    await ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Failed to send MarkdownV2 message:", error);
    await ctx.reply(
      "Error displaying reminders. Here they are in plain text:\n\n" +
        agenda
          .map((r) => `${r.task} at ${r.scheduleDateTime.toLocaleString()}`)
          .join("\n")
    );
  }
});

composer.command("all", async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat.id;
  const profile: UserProfile = ctx.state.manager.profile;
  if (!userId) {
    return ctx.reply("Could not identify you. Please try again.");
  }

  const userReminders = await store.getAllUserReminders(chatId);
  if (!userReminders || userReminders?.length == 0) {
    return ctx.reply("You have no pending reminders.");
  }

  let message = `*Here are your pending reminders:*\n\n`;

  userReminders.map((reminder, i) => {
    const scheduleDate = dayjs(reminder.scheduleDateTime).tz(profile.timezone);
    const formattedDate = scheduleDate.format("MMM DD, YYYY - HH:mm");

    message += `*${i + 1}\\. Code:* \`${reminder.code}\`\n`;
    message += `*Time:* ${escapeMarkdownV2(formattedDate)}\n`;
    message += `*Task:* ${escapeMarkdownV2(reminder.task)}\n\n`;
  });

  try {
    await ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Failed to send MarkdownV2 message:", error);
    await ctx.reply(
      "Error displaying reminders. Here they are in plain text:\n\n" +
        userReminders
          .map((r) => `${r.task} at ${r.scheduleDateTime.toLocaleString()}`)
          .join("\n")
    );
  }
});

composer.command("status", async (ctx: AIContext) => {
  const planManager = ctx.state.manager as PlanManager;
  const profile = planManager.profile;

  if (!profile) return ctx.reply("No profile found");
  return ctx.reply(`Your current plan is: ${profile.plan}`);
});

export default composer;
