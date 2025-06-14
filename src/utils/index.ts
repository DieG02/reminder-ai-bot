import dayjs from "../lib/dayjs";
import { Dayjs } from "dayjs";
import { RepeatType, ReminderBody } from "../types/";
import { getTimeZones, TimeZone } from "@vvo/tzdb";
/**
 * Calculate the next date in a 'repeat' task
 */
export const getNextRepeatDate = (
  current: Dayjs,
  repeat: RepeatType,
  relativeDuration: number = 1
): Dayjs => {
  if (!repeat) return current;
  return (
    {
      minutely: () => current.add(relativeDuration, "minute"),
      hourly: () => current.add(relativeDuration, "hour"),
      daily: () => current.add(relativeDuration, "day"),
      weekly: () => current.add(relativeDuration, "week"),
      monthly: () => current.add(relativeDuration, "month"),
    }[repeat]?.() ?? current
  );
};

/**
 * Standarize date and time with the ReminderBody type
 */
export const getScheduleDateTime = (
  input: ReminderBody,
  timezone: string = "Europe/Rome"
): Dayjs | null => {
  const now = dayjs().tz(timezone);

  // Case 1: Has absolute date and time
  if (input.date && input.time) {
    const parsed = dayjs.tz(
      `${input.date} ${input.time}`,
      "DD/MM/YYYY HH:mm",
      timezone
    );
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

  // Case 3: Has only time, maybe recurring (e.g., daily at 08:00)
  if (input.time) {
    const [hours, minutes] = input.time.split(":").map(Number);
    let base = now.set("hour", hours).set("minute", minutes).set("second", 0);

    // If the time has already passed today, move to tomorrow
    if (base.isBefore(now)) {
      base = base.add(1, "day");
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

/**
 * Helper function to search between common timezones
 */
export const searchTimezones = (query: string) => {
  const q = query.toLowerCase();

  return getTimeZones({ includeUtc: true })
    .filter((tz: TimeZone) => {
      return (
        tz.name.toLowerCase().includes(q) ||
        tz.countryName.toLowerCase().includes(q) ||
        tz.mainCities.some((c) => c.toLowerCase().includes(q)) ||
        tz.alternativeName.toLowerCase().includes(q)
      );
    })
    .slice(0, 5)
    .map((tz: TimeZone) => ({
      name: tz.name,
      label: tz.abbreviation || tz.alternativeName,
      offset: tz.rawOffsetInMinutes,
      country: tz.countryName,
      cities: tz.mainCities,
    }));
};
