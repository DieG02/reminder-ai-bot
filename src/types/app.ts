// src/index.ts
import { Context } from "telegraf";

export interface AIContext extends Context {
  session?: {
    // Define the structure of your session data here
    username?: string;
    count?: number; // Amount of reminders available
    locale?: string;
    services?: string[];
    waiting?: string; // Key-Value to update
  };
}
