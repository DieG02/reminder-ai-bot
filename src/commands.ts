import { Context, Composer } from "telegraf";
import { FirestoreReminderDoc, StoredReminder } from "./types";
import { REMINDERS_COLLECTION } from "./types/constants";
import { AIContext } from "./types/app";

// Create a single Composer instance to hold all commands
const commandHandlers = new Composer<Context>();

// // Define all your command handlers directly on this Composer instance
// commandHandlers.command("start", async (ctx) => {
//   await ctx.reply("Welcome! Use /help to see available commands.");
//   // Example of using global state:
//   // console.log(`Current reminder count: ${ctx.reminders.length}`);
// });

// Now, in your command or text handlers, you can access ctx.session
commandHandlers.command("start", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.count = 0;
  ctx.session.username = ctx.from?.username;
  await ctx.reply(
    `Welcome ${ctx.session.username}! Your session count is ${ctx.session.count}.`
  );
});

commandHandlers.command("name", async (ctx: AIContext) => {
  ctx.session = ctx.session || {};
  ctx.session.waiting = "name";
  await ctx.reply("What is your name?");
});

commandHandlers.command("help", async (ctx) => {
  await ctx.reply(
    "Available commands:\n/start - Start the bot\n/help - Show this help message\n/mycommand - Do something specific"
  );
});

commandHandlers.command("all", async (ctx) => {
  await ctx.reply("You executed /all!");
});

commandHandlers.command("sendreminders", async (ctx) => {
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
});

export default commandHandlers;

// bot.command("myreminders", async (ctx) => {
//   const userId = ctx.from.id;
//   const chatId = ctx.chat.id;

//   try {
//     const snapshot = await db
//       .collection(REMINDERS_COLLECTION)
//       .where("creatorId", "==", userId)
//       .where("isScheduled", "==", true) // Only show active ones
//       .orderBy("scheduleDateTime", "asc")
//       .get();

//     // const userReminders: StoredReminder[] = snapshot.docs.map(doc => {
//     //   const data = doc.data() as FirestoreReminderDoc;
//     //   return {
//     //     id: doc.id,
//     //     chatId: data.chatId,
//     //     creatorId: data.creatorId,
//     //     task: data.task,
//     //     scheduleDateTime: data.scheduleDateTime.toDate(),
//     //     jobId: data.jobId,
//     //     isScheduled: data.isScheduled,
//     //     isGroupReminder: data.isGroupReminder || false,
//     //     targetUsers: data.targetUsers || []
//     //   } as StoredReminder;
//     // }).filter(r => !isPast(r.scheduleDateTime)); // Filter out any already past remindersif (userReminders.length === 0) {
//     //   return ctx.reply(ctx.i18n.__('no_reminders'));
//     // }

//     let message = "Do something";
//     // const inlineKeyboard = userReminders.map((r, index) => {
//     //   const dateStr = format(r.scheduleDateTime, 'dd/MM/yyyy HH:mm', { locale: enGB });
//     //   const groupSuffix = r.isGroupReminder ? ` (Group: ${r.chatId})` : ''; // Improve group display
//     //   message += `${index + 1}. ${r.task} on <span class="math-inline">\{dateStr\}</span>{groupSuffix}\n`;
//     //   return [{ text: `${index + 1}. ${r.task}`, callback_data: `manage_reminder:select:${r.id}` }];
//     // });

//     // ctx.reply(message, {
//     //   reply_markup: {
//     //     inline_keyboard: inlineKeyboard
//     //   },
//     //   parse_mode: 'HTML' // For group mention links
//     // });

//     await bot.telegram.sendMessage(chatId, message);

//     // ctx.reply(message, {
//     //   reply_markup: {
//     //     inline_keyboard: inlineKeyboard
//     //   },
//     //   parse_mode: 'HTML' // For group mention links
//     // });
//   } catch (error) {
//     console.error("Error listing reminders:", error);
//     ctx.reply("Sorry, I had trouble listing your reminders.");
//   }
// });
