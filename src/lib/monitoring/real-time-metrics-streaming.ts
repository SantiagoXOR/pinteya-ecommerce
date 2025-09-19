// ===================================
// PINTEYA E-COMMERCE - REAL-TIME METRICS STREAMING
// ===================================

import { logger, LogCategory } from '../enterprise/logger';
import { realTimePerformanceMonitor } from './real-time-performance-monitor';
import { advancedAlertingEngine } from './advanced-alerting-engine';
import { performanceBudgetsMonitor } from './performance-budgets-monitor';

/**
 * Tipos de eventos de streaming
 */
export enum StreamEventType {
  METRICS_UPDATE = 'metrics_update',
  ALERT_CREATED = 'alert_created',
  ALERT_RESOLVED = 'alert_resolved',
  BUDGET_VIOLATION = 'budget_violation',
  SYSTEM_STATUS = 'system_status',
  HEARTBEAT = 'heartbeat'
}

/**
 * Evento de streaming
 */
export interface StreamEvent {
  type: StreamEventType;
  data: any;
  timestamp: number;
  id: string;
}

/**
 * Configuración de cliente de streaming
 */
export interface StreamClientConfig {
  clientId: string;
  subscriptions: StreamEventType[];
  filters?: {
    severities?: string[];
    sources?: string[];
    tags?: string[];
  };
  rateLimit?: {
    maxEventsPerSecond: number;
    burstLimit: number;
  };
}

/**
 * Cliente de streaming
 */
export interface StreamClient {
  id: string;
  config: StreamClientConfig;
  lastActivity: number;
  eventQueue: StreamEvent[];
  rateLimitCounter: {
    count: number;
    resetTime: number;
  };
  send: (event: StreamEvent) => Promise<boolean>;
  disconnect: () => void;
}

/**
 * Estadísticas de streaming
 */
export interface StreamingStats {
  totalClients: number;
  activeClients: number;
  totalEventsSent: number;
  eventsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  clientsByType: Record<string, number>;
  topEvents: Array<{
    type: StreamEventType;
    count: number;
  }>;
}

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG = {
  maxClients: 1000,
  heartbeatInterval: 30000, // 30 segundos
  clientTimeout: 300000, // 5 minutos
  maxQueueSize: 100,
  defaultRateLimit: {
    maxEventsPerSecond: 10,
    burstLimit: 50
  }
};

/**
 * Sistema de streaming de métricas en tiempo real
 */
export class RealTimeMetricsStreaming {
  private static instance: RealTimeMetricsStreaming;
  private clients: Map<string, StreamClient> = new Map();
  private eventHistory: StreamEvent[] = [];
  private stats: StreamingStats = {
    totalClients: 0,
    activeClients: 0,
    totalEventsSent: 0,
    eventsPerSecond: 0,
    averageLatency: 0,
    errorRate: 0,
    clientsByType: {},
    topEvents: []
  };
  private heartbeatInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private statsInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeStreaming();
  }

  static getInstance(): RealTimeMetricsStreaming {
    if (!RealTimeMetricsStreaming.instance) {
      RealTimeMetricsStreaming.instance = new RealTimeMetricsStreaming();
    }
    return RealTimeMetricsStreaming.instance;
  }

  /**
   * Inicializa el sistema de streaming
   */
  private initializeStreaming(): void {
    // Suscribirse a eventos del monitor de performance
    realTimePerformanceMonitor.subscribe((data) => {
      this.broadcastEvent({
        type: StreamEventType.METRICS_UPDATE,
        data,
        timestamp: Date.now(),
        id: this.generateEventId()
      });
    });

    // Iniciar heartbeat
    this.startHeartbeat();
    
    // Iniciar limpieza periódica
    this.startCleanup();
    
    // Iniciar cálculo de estadísticas
    this.startStatsCalculation();

    logger.info(LogCategory.MONITORING, 'Real-time metrics streaming initialized');
  }

  /**
   * Registra un nuevo cliente de streaming
   */
  registerClient(config: StreamClientConfig, sendFunction: (event: StreamEvent) => Promise<boolean>): StreamClient {
    if (this.clients.size >= DEFAULT_CONFIG.maxClients) {
      throw new Error('Maximum number of streaming clients reached');
    }

    const client: StreamClient = {
      id: config.clientId,
      config,
      lastActivity: Date.now(),
      eventQueue: [],
      rateLimitCounter: {
        count: 0,
        resetTime: Date.now() + 1000
      },
      send: sendFunction,
      disconnect: () => this.disconnectClient(config.clientId)
    };

    this.clients.set(config.clientId, client);
    this.stats.totalClients++;
    this.stats.activeClients = this.clients.size;

    logger.info(LogCategory.MONITORING, `Streaming client registered: ${config.clientId}`, {
      subscriptions: config.subscriptions,
      totalClients: this.clients.size
    });

    // Enviar eventos recientes al nuevo cliente
    this.sendRecentEvents(client);

    return client;
  }

  /**
   * Desconecta un cliente
   */
  disconnectClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.stats.activeClients = this.clients.size;
      
      logger.info(LogCategory.MONITORING, `Streaming client disconnected: ${clientId}`, {
        remainingClients: this.clients.size
      });
    }
  }

  /**
   * Difunde un evento a todos los clientes suscritos
   */
  private async broadcastEvent(event: StreamEvent): Promise<void> {
    // Agregar a historial
    this.eventHistory.push(event);
    
    // Mantener solo los últimos 1000 eventos
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    const eligibleClients = Array.from(this.clients.values()).filter(client => 
      this.isClientEligible(client, event)
    );

    const sendPromises = eligibleClients.map(async (client) => {
      try {
        // Verificar rate limiting
        if (!this.checkRateLimit(client)) {
          // Agregar a cola si está dentro del límite
          if (client.eventQueue.length < DEFAULT_CONFIG.maxQueueSize) {
            client.eventQueue.push(event);
          }
          return false;
        }

        const success = await client.send(event);
        
        if (success) {
          this.updateRateLimit(client);
          this.stats.totalEventsSent++;
          client.lastActivity = Date.now();
        }
        
        return success;
      } catch (error) {
        logger.error(LogCategory.MONITORING, `Error sending event to client ${client.id}`, error as Error);
        return false;
      }
    });

    await Promise.allSettled(sendPromises);
  }

  /**
   * Verifica si un cliente es elegible para recibir un evento
   */
  private isClientEligible(client: StreamClient, event: StreamEvent): boolean {
    // Verificar suscripciones
    if (!client.config.subscriptions.includes(event.type)) {
      return false;
    }

    // Aplicar filtros si existen
    const { filters } = client.config;
    if (filters) {
      // Filtrar por severidad (para alertas)
      if (filters.severities && event.data.severity) {
        if (!filters.severities.includes(event.data.severity)) {
          return false;
        }
      }

      // Filtrar por fuente
      if (filters.sources && event.data.source) {
        if (!filters.sources.includes(event.data.source)) {
          return false;
        }
      }

      // Filtrar por tags
      if (filters.tags && event.data.tags) {
        const hasMatchingTag = filters.tags.some(tag => 
          event.data.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Verifica rate limiting para un cliente
   */
  private checkRateLimit(client: StreamClient): boolean {
    const now = Date.now();
    const rateLimit = client.config.rateLimit || DEFAULT_CONFIG.defaultRateLimit;
    
    // Reset counter si ha pasado un segundo
    if (now >= client.rateLimitCounter.resetTime) {
      client.rateLimitCounter.count = 0;
      client.rateLimitCounter.resetTime = now + 1000;
    }

    return client.rateLimitCounter.count < rateLimit.maxEventsPerSecond;
  }

  /**
   * Actualiza contador de rate limiting
   */
  private updateRateLimit(client: StreamClient): void {
    client.rateLimitCounter.count++;
  }

  /**
   * Envía eventos recientes a un cliente nuevo
   */
  private async sendRecentEvents(client: StreamClient): Promise<void> {
    const recentEvents = this.eventHistory
      .filter(event => this.isClientEligible(client, event))
      .slice(-10); // Últimos 10 eventos relevantes

    for (const event of recentEvents) {
      try {
        await client.send(event);
      } catch (error) {
        logger.error(LogCategory.MONITORING, `Error sending recent event to client ${client.id}`, error as Error);
      }
    }
  }

  /**
   * Procesa cola de eventos de un cliente
   */
  private async processClientQueue(client: StreamClient): Promise<void> {
    while (client.eventQueue.length > 0 && this.checkRateLimit(client)) {
      const event = client.eventQueue.shift();
      if (event) {
        try {
          const success = await client.send(event);
          if (success) {
            this.updateRateLimit(client);
            this.stats.totalEventsSent++;
            client.lastActivity = Date.now();
          }
        } catch (error) {
          logger.error(LogCategory.MONITORING, `Error processing queued event for client ${client.id}`, error as Error);
        }
      }
    }
  }

  /**
   * Inicia heartbeat periódico
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeatEvent: StreamEvent = {
        type: StreamEventType.HEARTBEAT,
        data: {
          timestamp: Date.now(),
          activeClients: this.clients.size,
          serverStatus: 'healthy'
        },
        timestamp: Date.now(),
        id: this.generateEventId()
      };

      this.broadcastEvent(heartbeatEvent);
    }, DEFAULT_CONFIG.heartbeatInterval);
  }

  /**
   * Inicia limpieza periódica
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = DEFAULT_CONFIG.clientTimeout;

      // Remover clientes inactivos
      for (const [clientId, client] of this.clients) {
        if (now - client.lastActivity > timeout) {
          this.disconnectClient(clientId);
          logger.info(LogCategory.MONITORING, `Removed inactive streaming client: ${clientId}`);
        } else {
          // Procesar cola de eventos pendientes
          this.processClientQueue(client);
        }
      }
    }, 60000); // Cada minuto
  }

  /**
   * Inicia cálculo de estadísticas
   */
  private startStatsCalculation(): void {
    let lastEventCount = 0;
    let lastTimestamp = Date.now();

    this.statsInterval = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - lastTimestamp) / 1000; // segundos
      const eventDiff = this.stats.totalEventsSent - lastEventCount;

      this.stats.eventsPerSecond = eventDiff / timeDiff;
      this.stats.activeClients = this.clients.size;

      // Calcular eventos más frecuentes
      const eventCounts = new Map<StreamEventType, number>();
      this.eventHistory.slice(-100).forEach(event => {
        eventCounts.set(event.type, (eventCounts.get(event.type) || 0) + 1);
      });

      this.stats.topEvents = Array.from(eventCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      lastEventCount = this.stats.totalEventsSent;
      lastTimestamp = now;
    }, 10000); // Cada 10 segundos
  }

  /**
   * Crea evento de alerta
   */
  createAlertEvent(alert: any): void {
    const event: StreamEvent = {
      type: StreamEventType.ALERT_CREATED,
      data: alert,
      timestamp: Date.now(),
      id: this.generateEventId()
    };

    this.broadcastEvent(event);
  }

  /**
   * Crea evento de resolución de alerta
   */
  createAlertResolvedEvent(alertId: string): void {
    const event: StreamEvent = {
      type: StreamEventType.ALERT_RESOLVED,
      data: { alertId, resolvedAt: Date.now() },
      timestamp: Date.now(),
      id: this.generateEventId()
    };

    this.broadcastEvent(event);
  }

  /**
   * Crea evento de violación de presupuesto
   */
  createBudgetViolationEvent(violation: any): void {
    const event: StreamEvent = {
      type: StreamEventType.BUDGET_VIOLATION,
      data: violation,
      timestamp: Date.now(),
      id: this.generateEventId()
    };

    this.broadcastEvent(event);
  }

  /**
   * Crea evento de estado del sistema
   */
  createSystemStatusEvent(status: any): void {
    const event: StreamEvent = {
      type: StreamEventType.SYSTEM_STATUS,
      data: status,
      timestamp: Date.now(),
      id: this.generateEventId()
    };

    this.broadcastEvent(event);
  }

  /**
   * Obtiene estadísticas de streaming
   */
  getStats(): StreamingStats {
    return { ...this.stats };
  }

  /**
   * Obtiene clientes activos
   */
  getActiveClients(): Array<{
    id: string;
    subscriptions: StreamEventType[];
    lastActivity: number;
    queueSize: number;
  }> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      subscriptions: client.config.subscriptions,
      lastActivity: client.lastActivity,
      queueSize: client.eventQueue.length
    }));
  }

  /**
   * Obtiene eventos recientes
   */
  getRecentEvents(limit: number = 50): StreamEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Genera ID único para evento
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    // Desconectar todos los clientes
    this.clients.clear();
  }
}

// Instancia singleton
export const realTimeMetricsStreaming = RealTimeMetricsStreaming.getInstance();

/**
 * Utilidades para streaming de métricas
 */
export const StreamingUtils = {
  /**
   * Crea configuración de cliente básica
   */
  createBasicClientConfig(
    clientId: string,
    subscriptions: StreamEventType[] = [StreamEventType.METRICS_UPDATE, StreamEventType.ALERT_CREATED]
  ): StreamClientConfig {
    return {
      clientId,
      subscriptions,
      rateLimit: DEFAULT_CONFIG.defaultRateLimit
    };
  },

  /**
   * Crea configuración de cliente para dashboard
   */
  createDashboardClientConfig(clientId: string): StreamClientConfig {
    return {
      clientId,
      subscriptions: [
        StreamEventType.METRICS_UPDATE,
        StreamEventType.ALERT_CREATED,
        StreamEventType.ALERT_RESOLVED,
        StreamEventType.BUDGET_VIOLATION,
        StreamEventType.SYSTEM_STATUS
      ],
      rateLimit: {
        maxEventsPerSecond: 20,
        burstLimit: 100
      }
    };
  },

  /**
   * Crea configuración de cliente para alertas críticas
   */
  createCriticalAlertsClientConfig(clientId: string): StreamClientConfig {
    return {
      clientId,
      subscriptions: [
        StreamEventType.ALERT_CREATED,
        StreamEventType.BUDGET_VIOLATION
      ],
      filters: {
        severities: ['high', 'critical']
      },
      rateLimit: {
        maxEventsPerSecond: 5,
        burstLimit: 20
      }
    };
  },

  /**
   * Obtiene resumen de streaming
   */
  getStreamingSummary(): {
    isActive: boolean;
    clientCount: number;
    eventsPerSecond: number;
    lastEventTime: number;
  } {
    const stats = realTimeMetricsStreaming.getStats();
    const recentEvents = realTimeMetricsStreaming.getRecentEvents(1);
    
    return {
      isActive: stats.activeClients > 0,
      clientCount: stats.activeClients,
      eventsPerSecond: stats.eventsPerSecond,
      lastEventTime: recentEvents.length > 0 ? recentEvents[0].timestamp : 0
    };
  }
};









