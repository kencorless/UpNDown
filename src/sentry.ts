import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/browser";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN, // You'll need to set this in .env
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay()
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // Capture 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    
    // Custom error filtering
    beforeSend(event, hint) {
      // Filter out known or expected errors
      const error = hint.originalException;
      
      // Example: Ignore network errors
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        return null;
      }
      
      return event;
    }
  });
};

// Error boundary for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Custom error logging function
export const logError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    // Add custom context if provided
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Capture the error
    Sentry.captureException(error);
  });
};
