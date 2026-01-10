/**
 * Environment-aware logger utility
 * Only logs detailed errors in development mode to prevent information leakage in production
 */

export const logError = (message: string, error?: unknown): void => {
  if (import.meta.env.DEV) {
    console.error(message, error);
  }
  // In production, could optionally send to an error tracking service
};

export const logWarn = (message: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    console.warn(message, data);
  }
};

export const logInfo = (message: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    console.log(message, data);
  }
};
