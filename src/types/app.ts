// src/index.ts
import { Context } from "telegraf";

export interface AIContext extends Context {
  session?: {
    username?: string;
    count?: number; // Amount of reminders available
    locale?: string;
    services?: string[];
    waiting?: string; // Key-Value to update
    timezone?: string;
  };
}
