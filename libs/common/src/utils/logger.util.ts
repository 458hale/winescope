/**
 * Shared logger utility
 * Simple logger for both API and Crawler services
 */
export class Logger {
  constructor(private readonly context: string) {}

  log(message: string, ...args: unknown[]) {
    console.log(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, trace?: string, ...args: unknown[]) {
    console.error(`[${this.context}] ERROR: ${message}`, trace, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(`[${this.context}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
  }
}
