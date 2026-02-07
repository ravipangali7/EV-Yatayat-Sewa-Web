import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts a value to a number.
 * Handles null, undefined, empty strings, and string numbers.
 * Returns defaultValue for invalid inputs.
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}
