/**
 * Category Analytics System
 * Advanced analytics tracking for Categories component
 * Pinteya E-commerce - Enterprise Analytics
 */

import React from 'react';
import type { CategoryId, CategoryInteractionEvent, CategoryChangeEvent } from '@/types/categories';

/**
 * Analytics event types
 */
export type AnalyticsEventType = 
  | 'category_view'
  | 'category_click'
  | 'category_hover'
  | 'category_focus'
  | 'category_select'
  | 'category_deselect'
  | 'category_clear_all'
  | 'category_keyboard_navigation'
  | 'category_error'
  | 'category_performance';

/**
 * Analytics event data
 */
export interface AnalyticsEvent {
  /** Event type */
  type: AnalyticsEventType;
  /** Category ID (if applicable) */
  categoryId?: CategoryId;
  /** Event timestamp */
  timestamp: number;
  /** Session ID */
  sessionId: string;
  /** User ID (if available) */
  userId?: string;
  /** Page URL */
  url: string;
  /** User agent */
  userAgent: string;
  /** Additional event data */
  data?: Record<string, any>;
  /** Performance metrics */
  performance?: {
    renderTime?: number;
    interactionTime?: number;
    loadTime?: number;
  };
}

/**
 * Analytics configuration
 */
interface AnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Batch size for sending events */
  batchSize: number;
  /** Flush interval in milliseconds */
  flushInterval: number;
  /** Maximum events to store locally */
  maxEvents: number;
  /** Debug mode */
  debug: boolean;
}

/**
 * Default analytics configuration
 */
const defaultConfig: AnalyticsConfig = {
  enabled: true,
  samplingRate: 1.0,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  maxEvents: 100,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Analytics manager class
 */
class CategoryAnalyticsManager {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize analytics
   */
  private initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) {return;}

    // Set up flush timer
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    // Set up page unload handler
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Set up visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    this.isInitialized = true;

    if (this.config.debug) {
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID from various sources
   */
  private getUserId(): string | undefined {
    // Try to get user ID from various sources
    if (typeof window !== 'undefined') {
      // From localStorage
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {return storedUserId;}

      // From cookies (if using cookie-based auth)
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userId') {return value;}
      }

      // 🚨 TEMPORAL: Clerk removido durante migración a NextAuth.js
      // TODO: Implementar obtención de usuario desde NextAuth.js
      // if ((window as any).Clerk?.user?.id) {
      //   return (window as any).Clerk.user.id;
      // }
    }

    return undefined;
  }

  /**
   * Check if event should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Create base event data
   */
  private createBaseEvent(type: AnalyticsEventType): Omit<AnalyticsEvent, 'data'> {
    return {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId() || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  /**
   * Track an analytics event
   */
  track(
    type: AnalyticsEventType,
    data?: Record<string, any>,
    categoryId?: CategoryId
  ): void {
    if (!this.config.enabled || !this.shouldSample()) {return;}

    const event: AnalyticsEvent = {
      ...this.createBaseEvent(type),
      categoryId,
      data,
    };

    this.addEvent(event);
  }

  /**
   * Track category interaction
   */
  trackInteraction(interaction: CategoryInteractionEvent): void {
    const eventType = `category_${interaction.action}` as AnalyticsEventType;
    
    this.track(eventType, {
      method: interaction.method,
      metadata: interaction.metadata,
    }, interaction.categoryId);
  }

  /**
   * Track category change
   */
  trackChange(change: CategoryChangeEvent): void {
    this.track('category_select', {
      changeType: change.type,
      selectedCount: change.selectedCategories.length,
      previousCount: change.previousCategories.length,
      selectedCategories: change.selectedCategories,
      previousCategories: change.previousCategories,
    }, change.categoryId);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: {
    renderTime?: number;
    interactionTime?: number;
    loadTime?: number;
    categoryId?: CategoryId;
  }): void {
    this.track('category_performance', {
      metrics,
    }, metrics.categoryId);
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('category_error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Add event to queue
   */
  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    if (this.config.debug) {
    }

    // Remove old events if we exceed max
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Flush if we reach batch size
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to analytics service
   */
  flush(): void {
    if (this.events.length === 0) {return;}

    const eventsToSend = [...this.events];
    this.events = [];

    this.sendEvents(eventsToSend);
  }

  /**
   * Send events to analytics service
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Send to Google Analytics 4 if available
      if (typeof window !== 'undefined' && window.gtag) {
        events.forEach(event => {
          window.gtag('event', event.type, {
            event_category: 'categories',
            event_label: event.categoryId || 'general',
            custom_parameters: {
              session_id: event.sessionId,
              user_id: event.userId,
              ...event.data,
            },
          });
        });
      }

      // Send to custom analytics endpoint
      if (typeof window !== 'undefined' && window.fetch) {
        await fetch('/api/analytics/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });
      }

      if (this.config.debug) {
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      
      // Re-add events to queue for retry
      this.events.unshift(...events);
    }
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    sessionId: string;
    config: AnalyticsConfig;
  } {
    const eventsByType: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      sessionId: this.sessionId,
      config: this.config,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debug) {
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
    this.isInitialized = false;
  }
}

/**
 * Global analytics instance
 */
let analyticsInstance: CategoryAnalyticsManager | null = null;

/**
 * Get or create analytics instance
 */
export const getCategoryAnalytics = (config?: Partial<AnalyticsConfig>): CategoryAnalyticsManager => {
  if (!analyticsInstance) {
    analyticsInstance = new CategoryAnalyticsManager(config);
  }
  return analyticsInstance;
};

/**
 * Convenience functions
 */
export const trackCategoryView = (categoryId?: CategoryId) => {
  getCategoryAnalytics().track('category_view', {}, categoryId);
};

export const trackCategoryClick = (categoryId: CategoryId, method: 'mouse' | 'keyboard' | 'touch' = 'mouse') => {
  getCategoryAnalytics().track('category_click', { method }, categoryId);
};

export const trackCategoryHover = (categoryId: CategoryId) => {
  getCategoryAnalytics().track('category_hover', {}, categoryId);
};

export const trackCategoryKeyboardNavigation = (key: string, categoryId?: CategoryId) => {
  getCategoryAnalytics().track('category_keyboard_navigation', { key }, categoryId);
};

/**
 * React hook for category analytics
 */
export const useCategoryAnalytics = (config?: Partial<AnalyticsConfig>) => {
  const analytics = getCategoryAnalytics(config);

  React.useEffect(() => {
    return () => {
      analytics.destroy();
    };
  }, [analytics]);

  return {
    track: analytics.track.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackChange: analytics.trackChange.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    getSummary: analytics.getSummary.bind(analytics),
  };
};

/**
 * Export analytics manager class
 */
export { CategoryAnalyticsManager };









