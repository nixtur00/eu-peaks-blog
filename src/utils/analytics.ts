// Privacy-focused analytics utility
// No personal data collection, GDPR compliant

interface AnalyticsEvent {
  name: string;
  category: 'navigation' | 'content' | 'performance' | 'error' | 'engagement';
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

interface PageView {
  path: string;
  referrer?: string;
  timestamp: number;
  sessionId: string;
}

class PrivacyAnalytics {
  private sessionId: string;
  private isOptedOut: boolean = false;
  private queue: AnalyticsEvent[] = [];
  private endpoint: string = '/api/analytics';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isOptedOut = this.checkOptOutStatus();

    // Set up automatic page view tracking
    if (typeof window !== 'undefined' && !this.isOptedOut) {
      this.setupPageViewTracking();
      this.setupPerformanceTracking();
    }
  }

  // Generate anonymous session ID (no personal data)
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  // Check if user has opted out of analytics
  private checkOptOutStatus(): boolean {
    if (typeof window === 'undefined') return true;

    // Check localStorage for opt-out preference
    const optOut = localStorage.getItem('analytics-opt-out');
    return optOut === 'true';
  }

  // Opt out of analytics
  public optOut(): void {
    this.isOptedOut = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics-opt-out', 'true');
    }
    this.queue = []; // Clear existing queue
  }

  // Opt in to analytics
  public optIn(): void {
    this.isOptedOut = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics-opt-out');
    }
  }

  // Track page view (no personal data)
  public trackPageView(path?: string): void {
    if (this.isOptedOut || typeof window === 'undefined') return;

    const pageView: PageView = {
      path: path || window.location.pathname,
      referrer: this.sanitizeReferrer(document.referrer),
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.track('page_view', 'navigation', {
      path: pageView.path,
      ...(pageView.referrer && { referrer: pageView.referrer }),
    });
  }

  // Track custom events
  public track(
    name: string,
    category: AnalyticsEvent['category'],
    properties?: Record<string, string | number | boolean>
  ): void {
    if (this.isOptedOut) return;

    const event: AnalyticsEvent = {
      name: this.sanitizeEventName(name),
      category,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.processQueue();
  }

  // Track peak content interactions
  public trackPeakView(peakSlug: string, country: string): void {
    this.track('peak_view', 'content', {
      peak_slug: peakSlug,
      country: country,
    });
  }

  public trackSearch(query: string, resultsCount: number): void {
    this.track('search', 'engagement', {
      query_length: query.length, // Don't store actual query
      results_count: resultsCount,
    });
  }

  public trackImageView(imageType: 'featured' | 'gallery' | 'map'): void {
    this.track('image_view', 'content', {
      image_type: imageType,
    });
  }

  // Track performance metrics
  public trackPerformance(): void {
    if (this.isOptedOut || typeof window === 'undefined') return;

    // Web Vitals tracking
    if ('performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.track('page_performance', 'performance', {
          load_time: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          dom_content_loaded: Math.round(
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
          ),
          first_paint: this.getFirstPaint(),
        });
      }
    }
  }

  // Track errors (no sensitive data)
  public trackError(errorType: string, errorCategory: string): void {
    this.track('error_occurred', 'error', {
      error_type: errorType,
      error_category: errorCategory,
    });
  }

  // Set up automatic page view tracking
  private setupPageViewTracking(): void {
    // Track initial page view
    this.trackPageView();

    // Track navigation in SPAs (if using client-side routing)
    let currentPath = window.location.pathname;

    const trackNavigation = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        currentPath = newPath;
        this.trackPageView(newPath);
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', trackNavigation);

    // Override pushState and replaceState to track programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(trackNavigation, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(trackNavigation, 0);
    };
  }

  // Set up performance tracking
  private setupPerformanceTracking(): void {
    // Track performance after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.trackPerformance(), 1000);
    });

    // Track Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.track('core_web_vital', 'performance', {
                metric: 'lcp',
                value: Math.round(entry.startTime),
              });
            }
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // PerformanceObserver not fully supported
        console.warn('PerformanceObserver not supported');
      }
    }
  }

  // Get first paint timing
  private getFirstPaint(): number {
    if (typeof window === 'undefined') return 0;

    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? Math.round(firstPaint.startTime) : 0;
  }

  // Sanitize referrer to remove sensitive data
  private sanitizeReferrer(referrer: string): string {
    if (!referrer) return '';

    try {
      const url = new URL(referrer);
      // Only keep the hostname, remove search params and paths
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }

  // Sanitize event names
  private sanitizeEventName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  }

  // Sanitize event properties
  private sanitizeProperties(
    properties?: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    if (!properties) return {};

    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Only allow safe property names
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

      // Ensure values are safe
      if (typeof value === 'string') {
        sanitized[safeKey] = value.slice(0, 100); // Limit string length
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[safeKey] = value;
      }
    }

    return sanitized;
  }

  // Process analytics queue
  private processQueue(): void {
    if (this.queue.length === 0 || this.isOptedOut) return;

    // Batch events for efficiency
    const batchSize = 10;
    const batch = this.queue.splice(0, batchSize);

    // Send batch to analytics endpoint
    this.sendBatch(batch);
  }

  // Send batch to analytics endpoint
  private async sendBatch(events: AnalyticsEvent[]): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          session_id: this.sessionId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      // Fail silently for analytics - don't break user experience
      console.warn('Analytics request failed:', error);

      // In production, you might want to retry or use a fallback
      if (import.meta.env.DEV) {
        console.log('Analytics events that failed to send:', events);
      }
    }
  }

  // Get analytics status for privacy dashboard
  public getStatus(): { optedOut: boolean; sessionId: string } {
    return {
      optedOut: this.isOptedOut,
      sessionId: this.sessionId,
    };
  }

  // Clear all analytics data
  public clearData(): void {
    this.queue = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics-opt-out');
    }
  }
}

// Create singleton instance
export const analytics = new PrivacyAnalytics();

// Convenience functions for common tracking
export const trackPageView = (path?: string) => analytics.trackPageView(path);
export const trackPeakView = (peakSlug: string, country: string) =>
  analytics.trackPeakView(peakSlug, country);
export const trackSearch = (query: string, resultsCount: number) =>
  analytics.trackSearch(query, resultsCount);
export const trackImageView = (imageType: 'featured' | 'gallery' | 'map') =>
  analytics.trackImageView(imageType);
export const trackError = (errorType: string, errorCategory: string) =>
  analytics.trackError(errorType, errorCategory);

// Privacy controls
export const optOutOfAnalytics = () => analytics.optOut();
export const optInToAnalytics = () => analytics.optIn();
export const getAnalyticsStatus = () => analytics.getStatus();

// Setup function to be called in layout
export const setupAnalytics = () => {
  // Analytics is automatically set up in constructor
  // This function exists for explicit initialization if needed
  return analytics;
};

// GDPR/Privacy compliance helpers
export const showPrivacyBanner = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hasSeenBanner = localStorage.getItem('privacy-banner-seen');
  return !hasSeenBanner;
};

export const acceptPrivacyPolicy = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('privacy-banner-seen', 'true');
  analytics.optIn();
};

export const declinePrivacyPolicy = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('privacy-banner-seen', 'true');
  analytics.optOut();
};
