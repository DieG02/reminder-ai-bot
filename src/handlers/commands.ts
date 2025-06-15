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
  const profile = ctx.manager.profile;

  await ctx.reply(
    `👋 Welcome, *${profile.username}*\\!\n\n` +
      `I'm here to help you stay organized with smart reminders\\.\n\n` +
      `✨ *Getting started is easy:*\n` +
      `• /username \\- Set your username\n` +
      `• /timezone \\- Set your timezone\n` +
      `• /all \\- View all your reminders\n` +
      `📖 For full instructions, use /help\n` +
      `ℹ️ To know more about your account, use /info\n\n`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("help", async (ctx: AIContext) => {
  await ctx.reply(
    `👋 *Hi there\\!* I'm your *Reminder Bot*\\. Here's how I can help you:\n\n` +
      `🚀 *Main Commands:*\n` +
      `/create \\- Create a new reminder\n` +
      `/update \\- Update a reminder\n` +
      `/delete \\- Delete a reminder\n` +
      `/clear \\- Delete all your reminders\n` +
      `/next \\- Show your next reminder\n` +
      `/agenda \\- Show all reminders for today\n` +
      `/all \\- Show all your reminders\n\n` +
      `🔧 *Account Settings:*\n` +
      `/start \\- Start the bot\n` +
      `/username \\- Set your username\n` +
      `/timezone \\- Set your timezone\n` +
      // `/plan \\- Get your current subscription\n` +
      `/account \\- See your account details\n\n` +
      `ℹ️ *Information & Support:*\n` +
      `/help \\- Learn how the bot works\n` +
      `/info \\- Get your account settings\n\n`,
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("info", async (ctx: AIContext) => {
  await ctx.reply(
    `📌  *About Your Reminder Bot:*\n` +
      `I'm designed to help you never miss a beat\\!\n` +
      `Version: 1\\.2\\.0\n` +
      "Developer: [DieG02](https://github.com/DieG02/)\n\n",
    // [Privacy Policy](https://your-privacy-policy-link.com) | [Terms of Service](https://your-terms-link.com)
    { parse_mode: "MarkdownV2" }
  );
});

composer.command("next", async (ctx: AIContext) => {
  const { id: userId, timezone }: UserProfile = ctx.manager.profile;

  const response = await store.getAllUserReminders(userId, 1);
  if (!response?.length) return ctx.reply("You have no pending reminders.");
  const next = response[0];

  let message = `*Here is your next reminder:*\n\n`;
  const scheduleDate = dayjs(next.scheduleDateTime).tz(timezone);
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
  const { id: userId, timezone } = ctx.manager.profile;

  const agenda = await store.getUserAgenda(userId);
  if (!agenda?.length) {
    return ctx.reply("You have no pending reminders for today.");
  }

  let message = `*Here is your agenda for today:*\n\n`;

  agenda.map((reminder, i) => {
    const scheduleDate = dayjs(reminder.scheduleDateTime).tz(timezone);
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
  const { id: userId, timezone }: UserProfile = ctx.manager.profile;
  if (!userId) {
    return ctx.reply("Could not identify you. Please try again.");
  }

  const userReminders = await store.getAllUserReminders(userId);
  if (!userReminders || userReminders?.length == 0) {
    return ctx.reply("You have no pending reminders.");
  }

  let message = `*Here are your pending reminders:*\n\n`;

  userReminders.map((reminder, i) => {
    const scheduleDate = dayjs(reminder.scheduleDateTime).tz(timezone);
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

composer.command("account", async (ctx: AIContext) => {
  const profile: UserProfile = ctx.manager.profile;
  ctx.reply(
    `👤 *Your Profile:*\n` +
      `User ID: \`${profile.id}\`\n` +
      `Username: \`${profile.username}\`\n` +
      `Timezone: \`${profile.timezone}\`\n` +
      `Joined: ${escapeMarkdownV2(
        profile.createdAt?.toDate().toLocaleDateString()!
      )}\n\n` +
      // `Last Activity: Just now` +
      `✨ *Your Plan Usage \\- ${profile.plan}*\n` +
      // `•  \\(Trial ends: ${profile.trialEndsAt}\\)\n` +
      `1\\. Maximum Reminders: 5/50\n` +
      `2\\. Custom Timezones: ✅\n` +
      `3\\. Advanced Notifications: ❌\n\n`,
    { parse_mode: "MarkdownV2" }
  );
});

export default composer;
