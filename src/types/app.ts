import { Scenes, Context } from "telegraf";
import { ReminderBody, ReminderData } from "./index";
import { PlanManager } from "../services/plan";

export interface SessionData extends Scenes.WizardSession {
  username?: string;
  count?: number;
  locale?: string;
  services?: string[];
  waiting?: string;
  timezone?: string;
  timezoneMatches?: string[]; // Alternative during timezone

  current?: number; // By ID
  body?: ReminderBody; // Body structure only
  reminder?: ReminderData; // Full Reminder
}

// This extends Telegraf's default Context and includes your custom session
export interface AIContext extends Context {
  session: SessionData;
  manager?: PlanManager;
  wizard: Scenes.WizardContextWizard<AIContext>;
  scene: Scenes.SceneContextScene<AIContext, Scenes.WizardSessionData>;
}
