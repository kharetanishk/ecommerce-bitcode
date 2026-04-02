import {
  formatDistanceToNow,
  parseISO,
  differenceInDays,
  isValid,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const TIMEZONE = "Asia/Kolkata" as const;
export const LOCALE = "en-IN" as const;

function asDate(date: Date | string): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

export function formatIST(date: Date | string, fmt?: string): string {
  const dateObj = asDate(date);
  return formatInTimeZone(dateObj, TIMEZONE, fmt ?? "dd MMM yyyy, hh:mm a");
}

export function formatISTDate(date: Date | string): string {
  return formatIST(date, "dd MMMM yyyy");
}

export function formatISTTime(date: Date | string): string {
  return formatIST(date, "hh:mm a");
}

export function formatISTShort(date: Date | string): string {
  return formatIST(date, "dd MMM yyyy");
}

export function formatISTFull(date: Date | string): string {
  return formatIST(date, "EEEE, dd MMMM yyyy, hh:mm a");
}

export function formatRelative(date: Date | string): string {
  const dateObj = asDate(date);
  const diffMs = Date.now() - dateObj.getTime();
  if (diffMs < 60_000) return "just now";
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function daysSince(date: Date | string): number {
  const dateObj = asDate(date);
  return differenceInDays(new Date(), dateObj);
}

export function isWithinReturnWindow(
  deliveredAt: Date | string,
  windowDays = 7,
): boolean {
  return daysSince(deliveredAt) <= windowDays;
}

export function parseDate(dateString: string): Date {
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : new Date();
}

