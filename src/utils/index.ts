import dayjs, { Dayjs } from "dayjs";
import { RepeatType, ReminderBody } from "../types/";

/**
 * Calculate the next date in a 'repeat' task
 */
export const getNextRepeatDate = (
  current: Dayjs,
  repeat: RepeatType
): Dayjs => {
  if (!repeat) return current;
  return (
    {
      minutely: () => current.add(1, "minute"),
      hourly: () => current.add(1, "hour"),
      daily: () => current.add(1, "day"),
      weekly: () => current.add(1, "week"),
      monthly: () => current.add(1, "month"),
    }[repeat]?.() ?? current
  );
};

/**
 * Standarize date and time with the ReminderBody type
 */
export const getScheduleDateTime = (input: ReminderBody): Dayjs | null => {
  const now = dayjs();

  // Case 1: Has absolute date and time
  if (input.date && input.time) {
    const parsed = dayjs(`${input.date} ${input.time}`, "DD/MM/YYYY HH:mm");
    return parsed.isValid() ? parsed : null;
  }

  // Case 2: Has relative duration
  if (input.relativeDuration !== null && input.relativeUnit !== null) {
    let base = now.add(input.relativeDuration, input.relativeUnit);

    if (input.time) {
      const [hours, minutes] = input.time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        base = base.set("hour", hours).set("minute", minutes).set("second", 0);
      }
    }
    return base;
  }
  return null;
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
