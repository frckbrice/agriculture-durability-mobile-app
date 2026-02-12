/**
 * Central logger: logs only in development, never in production.
 *
 * Usage:
 *   import { logger, sanitizeForUser } from '@/lib/logger';
 *
 *   logger.log('info', data);           // dev only
 *   logger.error('failed', err);       // dev only
 *   logger.debug('state', state);      // dev only
 *   logger.logSafe('API response', res); // dev only, redacts tokens/URLs
 *
 *   // For UI (toasts, alerts): never show raw error.message
 *   const message = sanitizeForUser(error);
 *   toast.show(message);
 *
 * __DEV__ is used so production builds have zero log overhead.
 */

import { sanitizeForUser, sanitizeForLog } from "./sanitize";

const isDev =
  typeof __DEV__ !== "undefined" && __DEV__ === true;

function noop(_?: unknown, ..._args: unknown[]): void {}

function devLog(level: "log" | "warn" | "error" | "debug", ...args: unknown[]) {
  if (!isDev) return;
  const fn = console[level] ?? console.log;
  fn.apply(console, args);
}

/**
 * Logger that only outputs in development.
 * In production all methods are no-ops (no performance cost from string building).
 */
export const logger = {
  log: isDev ? (...args: unknown[]) => devLog("log", ...args) : noop,
  warn: isDev ? (...args: unknown[]) => devLog("warn", ...args) : noop,
  error: isDev ? (...args: unknown[]) => devLog("error", ...args) : noop,
  debug: isDev ? (...args: unknown[]) => devLog("debug", ...args) : noop,

  /**
   * Log with sanitization: sensitive fields in objects are redacted.
   * Use for logging API responses or payloads in development.
   */
  logSafe: isDev
    ? (label: string, payload: unknown) => {
        console.log(`[${label}]`, sanitizeForLog(payload));
      }
    : noop,

  /**
   * Get a user-friendly message from an error. Use for toasts/alerts.
   * Never show raw error.message to users in production.
   */
  userMessage: sanitizeForUser,
};

export { sanitizeForUser, sanitizeForLog } from "./sanitize";

export default logger;
