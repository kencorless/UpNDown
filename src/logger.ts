import { logError } from './sentry';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static currentLogLevel: LogLevel = LogLevel.INFO;

  static setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  static debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error);
      
      // Log to Sentry if error is provided
      if (error) {
        logError(error, {
          message,
          ...context
        });
      }
    }
  }

  // Centralized error tracking method
  static trackError(error: Error, context?: Record<string, any>): void {
    this.error('Tracked Error', error, context);
  }

  // Performance logging method
  static logPerformance(
    operationName: string, 
    duration: number, 
    threshold: number = 100
  ): void {
    if (duration > threshold) {
      this.warn(`Slow operation: ${operationName}`, { duration });
    } else {
      this.debug(`Operation timing: ${operationName}`, { duration });
    }
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  Logger.trackError(new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  Logger.trackError(new Error('Unhandled Promise Rejection'), {
    reason: event.reason
  });
});
