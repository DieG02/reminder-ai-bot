import { parse, add } from "date-fns";
import { enGB } from "date-fns/locale";
import { addMinutes, addHours, addDays, addWeeks, addMonths } from "date-fns";
import { RepeatType, ReminderBody } from "../types/";

/**
 * Calculate the next date in a 'repeat' task
 */
export const getNextRepeatDate = (current: Date, repeat: RepeatType): Date => {
  if (!repeat) return current;
  return (
    {
      minutely: () => addMinutes(current, 1),
      hourly: () => addHours(current, 1),
      daily: () => addDays(current, 1),
      weekly: () => addWeeks(current, 1),
      monthly: () => addMonths(current, 1),
    }[repeat]?.() ?? current
  );
};

/**
 * Standarize date and time with the ReminderBody type
 */
export const getScheduleDateTime = (input: ReminderBody): Date | null => {
  const now = new Date();

  // Case 1: Has absolute date and time
  if (input.date && input.time) {
    const parsedDate = parse(
      `${input.date} ${input.time}`,
      "dd/MM/yyyy HH:mm",
      now,
      { locale: enGB }
    );

    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    return null; // invalid
  }

  // Case 2: Has relative time info
  if (input.relativeDuration && input.relativeUnit) {
    return add(now, {
      [input.relativeUnit]: input.relativeDuration,
    });
  }

  return null; // neither case
};

/**
 * Generates a random 6-character uppercase alphanumeric string.
 */
export function generateShortCode(): string {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 6;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Helper function to escape MarkdownV2 special characters.
 */
export const escapeMarkdownV2 = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
};
