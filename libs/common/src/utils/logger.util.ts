/**
 * Shared logger utility
 * Simple logger for both API and Crawler services
 */
export class Logger {
  constructor(private readonly context: string) {}

  log(message: string, ...args: any[]) {
    console.log(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, trace?: string, ...args: any[]) {
    console.error(`[${this.context}] ERROR: ${message}`, trace, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${this.context}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
  }
}
