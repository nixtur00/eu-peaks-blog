import { logSecurityEvent } from './security';

// Error types for better error handling
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
}

export class CustomError extends Error implements AppError {
  public code?: string;
  public statusCode: number;
  public isOperational: boolean;
  public context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', context?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', true, context);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests', context?: Record<string, unknown>) {
    super(message, 429, 'RATE_LIMIT', true, context);
  }
}

export class SecurityError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 403, 'SECURITY_ERROR', true, context);
  }
}

// Error logger
export class ErrorLogger {
  static log(error: Error | AppError, context?: Record<string, unknown>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        ...(context || {}),
        ...((error as AppError).context || {}),
      },
    };

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Error occurred:', errorInfo);
    }

    // Log security-related errors
    if (error instanceof SecurityError || error instanceof RateLimitError) {
      logSecurityEvent({
        type: 'suspicious_activity',
        details: {
          errorType: error.name,
          errorMessage: error.message,
          errorCode: (error as AppError).code,
          ...errorInfo.context,
        },
      });
    }

    // In production, send to logging service
    if (import.meta.env.PROD) {
      // TODO: Integrate with your preferred logging service
      // Examples: DataDog, Sentry, LogRocket, etc.
      this.sendToLoggingService(errorInfo);
    }
  }

  private static sendToLoggingService(errorInfo: unknown): void {
    // Placeholder for production logging integration
    // In a real application, you would send this to your logging service
    console.log('Would send to logging service:', errorInfo);
  }
}

// Error handler middleware for API routes
export function handleApiError(error: unknown, request?: Request): Response {
  let appError: AppError;

  // Convert unknown errors to AppError
  if (error instanceof CustomError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new CustomError(
      'An unexpected error occurred',
      500,
      'INTERNAL_ERROR',
      false,
      { originalError: error.message }
    );
  } else {
    appError = new CustomError(
      'An unknown error occurred',
      500,
      'UNKNOWN_ERROR',
      false
    );
  }

  // Log the error
  ErrorLogger.log(appError, {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
  });

  // Create user-friendly response
  const response = {
    error: true,
    message: appError.isOperational ? appError.message : 'An internal error occurred',
    code: appError.code,
    timestamp: new Date().toISOString(),
    // Only include context in development
    ...(import.meta.env.DEV && { context: appError.context }),
  };

  return new Response(JSON.stringify(response), {
    status: appError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

// Content error handlers
export class ContentErrorHandler {
  static handleMissingContent(type: string, identifier: string): string {
    ErrorLogger.log(
      new NotFoundError(`${type} not found: ${identifier}`),
      { contentType: type, identifier }
    );

    return `
      <div class="content-error bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Content Not Found</h3>
        <p class="text-red-600 dark:text-red-300 mb-4">The requested ${type} could not be found.</p>
        <a href="/" class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return Home
        </a>
      </div>
    `;
  }

  static handleBrokenImage(src: string, alt: string): string {
    ErrorLogger.log(
      new CustomError(`Broken image: ${src}`, 404, 'BROKEN_IMAGE'),
      { imageSrc: src, imageAlt: alt }
    );

    return `
      <div class="broken-image bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">Image not available</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">${alt}</p>
      </div>
    `;
  }

  static handleInvalidContent(type: string, errors: string[]): string {
    ErrorLogger.log(
      new ValidationError(`Invalid ${type} content`),
      { contentType: type, validationErrors: errors }
    );

    return `
      <div class="validation-error bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Content Validation Issues</h3>
            <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <ul class="list-disc list-inside space-y-1">
                ${errors.map(error => `<li>${error}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Recovery utilities
export class RecoveryUtils {
  // Attempt to recover from content loading errors
  static async recoverContent<T>(
    primaryLoader: () => Promise<T>,
    fallbackLoader: () => Promise<T>,
    errorHandler: (error: Error) => T
  ): Promise<T> {
    try {
      return await primaryLoader();
    } catch (primaryError) {
      ErrorLogger.log(primaryError as Error, { recovery: 'attempting_fallback' });
      
      try {
        return await fallbackLoader();
      } catch (fallbackError) {
        ErrorLogger.log(fallbackError as Error, { recovery: 'fallback_failed' });
        return errorHandler(fallbackError as Error);
      }
    }
  }

  // Graceful degradation for missing data
  static withFallback<T>(value: T | undefined | null, fallback: T): T {
    return value ?? fallback;
  }

  // Safe array access with fallback
  static safeArrayAccess<T>(array: T[] | undefined, index: number, fallback: T): T {
    return array?.[index] ?? fallback;
  }

  // Safe object property access
  static safeAccess<T>(obj: unknown, path: string, fallback: T): T {
    try {
      const keys = path.split('.');
      let current = obj as any;
      
      for (const key of keys) {
        if (current == null || typeof current !== 'object') {
          return fallback;
        }
        current = current[key];
      }
      
      return current ?? fallback;
    } catch {
      return fallback;
    }
  }
}

// Global error boundary for client-side errors
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      ErrorLogger.log(
        new CustomError(
          `Unhandled promise rejection: ${event.reason}`,
          500,
          'UNHANDLED_REJECTION'
        ),
        { reason: event.reason }
      );
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      ErrorLogger.log(
        new CustomError(
          event.message,
          500,
          'UNCAUGHT_ERROR'
        ),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });
  }
} 