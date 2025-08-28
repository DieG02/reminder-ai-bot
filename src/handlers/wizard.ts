import { Composer, Markup, Scenes } from "telegraf";
import { AIContext } from "../types/app";
import createWizard from "./wizard/create";
import updateWizard from "./wizard/update";
import usernameWizard from "./wizard/username";
import timezoneWizard from "./wizard/timezone";
import deleteWizard from "./wizard/delete";
import clearWizard from "./wizard/clear";

import { Wizard } from "../types/constants";
import timetableWizard from "./wizard/timetable";

const composer = new Composer<AIContext>();
const stage = new Scenes.Stage<AIContext>([
  createWizard,
  updateWizard,
  usernameWizard,
  timezoneWizard,
  deleteWizard,
  clearWizard,
  timetableWizard,
]);

composer.use(stage.middleware());
composer.command("username", (ctx) => ctx.scene.enter(Wizard.USERNAME));
composer.command("timezone", (ctx) => ctx.scene.enter(Wizard.TIMEZONE));

composer.command("create", (ctx) => ctx.scene.enter(Wizard.CREATE));
composer.command("update", (ctx) => ctx.scene.enter(Wizard.UPDATE));
composer.command("delete", (ctx) => ctx.scene.enter(Wizard.DELETE));
composer.command("clear", (ctx) => ctx.scene.enter(Wizard.CLEAR));

composer.command("timetable", (ctx) => ctx.scene.enter(Wizard.TIMETABLE));
// composer.action(["confirm", "cancel"], async (ctx: any) => {
//   const selected = ctx.match[0]; // "confirm" or "cancel"

//   // Prevent double interaction
//   if (ctx.session.hasResponded) {
//     return ctx.answerCbQuery("You already selected.");
//   }
//   ctx.session.hasResponded = true;

//   const keyboard = [
//     [
//       Markup.button.callback(
//         selected === "confirm" ? "✅ Confirm" : "Confirm",
//         "noop"
//       ),
//     ],
//     [
//       Markup.button.callback(
//         selected === "cancel" ? "✅ Cancel" : "Cancel",
//         "noop"
//       ),
//     ],
//   ];

//   // Edit buttons in the original message
//   await ctx.editMessageReplyMarkup({
//     inline_keyboard: keyboard,
//   });

//   await ctx.answerCbQuery(`You selected: ${selected}`);

//   // Continue logic: save response, move to next step, etc.
//   ctx.session.taskIndex! += 1;
//   ctx.session.hasResponded = false;
//   return handleNextTask(ctx); // Or your next function
// });

export default composer;
