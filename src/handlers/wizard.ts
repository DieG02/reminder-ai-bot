import { Composer, Scenes } from "telegraf";
import { AIContext } from "../types/app";
import createWizard from "./wizard/create";
import updateWizard from "./wizard/update";
import usernameWizard from "./wizard/username";
import timezoneWizard from "./wizard/timezone";
import deleteWizard from "./wizard/delete";
import clearWizard from "./wizard/clear";

import { Wizard } from "../types/constants";

const composer = new Composer<AIContext>();
const stage = new Scenes.Stage<AIContext>([
  createWizard,
  updateWizard,
  usernameWizard,
  timezoneWizard,
  deleteWizard,
  clearWizard,
]);

composer.use(stage.middleware());
composer.command("username", (ctx) => ctx.scene.enter(Wizard.USERNAME));
composer.command("timezone", (ctx) => ctx.scene.enter(Wizard.TIMEZONE));

composer.command("create", (ctx) => ctx.scene.enter(Wizard.CREATE));
composer.command("update", (ctx) => ctx.scene.enter(Wizard.UPDATE));
composer.command("delete", (ctx) => ctx.scene.enter(Wizard.DELETE));
composer.command("clear", (ctx) => ctx.scene.enter(Wizard.CLEAR));

export default composer;
