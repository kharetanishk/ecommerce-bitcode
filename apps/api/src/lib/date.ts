import {
  formatDistanceToNow,
  parseISO,
  differenceInDays,
  startOfDay,
  endOfDay,
  isValid,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const TIMEZONE = "Asia/Kolkata" as const;
export const LOCALE = "en-IN" as const;

function asDate(date: Date | string): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

// 1. nowIST(): Date
export function nowIST(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

// 2. nowISTString(): string (store UTC in DB)
export function nowISTString(): string {
  return new Date().toISOString();
}

// 3. formatIST(date, fmt?)
export function formatIST(date: Date | string, fmt?: string): string {
  const dateObj = asDate(date);
  return formatInTimeZone(dateObj, TIMEZONE, fmt ?? "dd MMM yyyy, hh:mm a");
}

// 4. formatISTDate
export function formatISTDate(date: Date | string): string {
  return formatIST(date, "dd MMMM yyyy");
}

// 5. formatISTTime
export function formatISTTime(date: Date | string): string {
  return formatIST(date, "hh:mm a");
}

// 6. formatISTShort
export function formatISTShort(date: Date | string): string {
  return formatIST(date, "dd MMM yyyy");
}

// 7. formatISTFull
export function formatISTFull(date: Date | string): string {
  return formatIST(date, "EEEE, dd MMMM yyyy, hh:mm a");
}

// 8. formatRelative
export function formatRelative(date: Date | string): string {
  const dateObj = asDate(date);
  const diffMs = Date.now() - dateObj.getTime();
  if (diffMs < 60_000) return "just now";
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// 9. forShiprocket
export function forShiprocket(date?: Date): string {
  const d = date ?? new Date();
  return formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd HH:mm");
}

// 10. forLogger
export function forLogger(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "HH:mm:ss");
}

// 11. forLoggerFull
export function forLoggerFull(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

// 12. daysSince
export function daysSince(date: Date | string): number {
  const dateObj = asDate(date);
  return differenceInDays(new Date(), dateObj);
}

// 13. isWithinReturnWindow
export function isWithinReturnWindow(
  deliveredAt: Date | string,
  windowDays = 7,
): boolean {
  return daysSince(deliveredAt) <= windowDays;
}

// 14. parseDate
export function parseDate(dateString: string): Date {
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : new Date();
}

// 15. startOfDayIST / endOfDayIST
export function startOfDayIST(date?: Date): Date {
  const base = toZonedTime(date ?? new Date(), TIMEZONE);
  const localStart = startOfDay(base);
  return fromZonedTime(localStart, TIMEZONE);
}

export function endOfDayIST(date?: Date): Date {
  const base = toZonedTime(date ?? new Date(), TIMEZONE);
  const localEnd = endOfDay(base);
  return fromZonedTime(localEnd, TIMEZONE);
}

