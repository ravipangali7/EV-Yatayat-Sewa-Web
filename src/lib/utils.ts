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

/** Strip HTML tags and truncate to maxChars, appending "..." if truncated. */
export function excerptFromHtml(html: string, maxChars: number = 20): string {
  if (!html || typeof html !== 'string') return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  let text: string;
  if (div) {
    div.innerHTML = html;
    text = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  } else {
    text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim() + '...';
}
