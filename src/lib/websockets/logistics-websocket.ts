// =====================================================
// WEBSOCKET: LOGISTICS REAL-TIME SYSTEM
// Descripción: Sistema WebSocket para tracking tiempo real
// Basado en: WebSocket API + React Context + Event Emitter
// =====================================================

import { EventEmitter } from 'events';

// =====================================================
// INTERFACES
// =====================================================

export interface WebSocketMessage {
  type: 'tracking_update' | 'shipment_status' | 'alert' | 'geofence_event' | 'route_update';
  data: any;
  timestamp: string;
  shipment_id?: number;
  user_id?: string;
}

export interface TrackingUpdate {
  shipment_id: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: string;
  timestamp: string;
  courier_id?: number;
  estimated_arrival?: string;
}

export interface GeofenceEvent {
  shipment_id: number;
  zone_id: string;
  zone_name: string;
  event_type: 'enter' | 'exit';
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface LogisticsAlert {
  id: string;
  type: 'delay' | 'exception' | 'delivery_attempt' | 'route_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shipment_id: number;
  message: string;
  timestamp: string;
  auto_resolve: boolean;
}

// =====================================================
// WEBSOCKET CLIENT CLASS
// =====================================================

export class LogisticsWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();
  
  constructor(url: string) {
    super();
    this.url = url;
  }
  
  // =====================================================
  // CONEXIÓN Y RECONEXIÓN
  // =====================================================
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('🔗 WebSocket conectado');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribe();
          this.emit('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket desconectado:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Reconectando en ${delay}ms (intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
          this.emit('max_reconnect_attempts');
        }
      });
    }, delay);
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
  }
  
  // =====================================================
  // HEARTBEAT
  // =====================================================
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // 30 segundos
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // =====================================================
  // ENVÍO DE MENSAJES
  // =====================================================
  
  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado, mensaje no enviado:', message);
    }
  }
  
  // =====================================================
  // SUSCRIPCIONES
  // =====================================================
  
  subscribeToShipment(shipmentId: number): void {
    const subscription = `shipment:${shipmentId}`;
    this.subscriptions.add(subscription);
    
    this.send({
      type: 'subscribe',
      data: { subscription },
      timestamp: new Date().toISOString()
    });
  }
  
  unsubscribeFromShipment(shipmentId: number): void {
    const subscription = `shipment:${shipmentId}`;
    this.subscriptions.delete(subscription);
    
    this.send({
      type: 'unsubscribe',
      data: { subscription },
      timestamp: new Date().toISOString()
    });
  }
  
  subscribeToGeofence(zoneId: string): void {
    const subscription = `geofence:${zoneId}`;
    this.subscriptions.add(subscription);
    
    this.send({
      type: 'subscribe',
      data: { subscription },
      timestamp: new Date().toISOString()
    });
  }
  
  subscribeToAlerts(): void {
    const subscription = 'alerts:all';
    this.subscriptions.add(subscription);
    
    this.send({
      type: 'subscribe',
      data: { subscription },
      timestamp: new Date().toISOString()
    });
  }
  
  private resubscribe(): void {
    this.subscriptions.forEach(subscription => {
      this.send({
        type: 'subscribe',
        data: { subscription },
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // =====================================================
  // MANEJO DE MENSAJES
  // =====================================================
  
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', message.type);
    
    switch (message.type) {
      case 'tracking_update':
        this.handleTrackingUpdate(message.data as TrackingUpdate);
        break;
        
      case 'shipment_status':
        this.handleShipmentStatus(message.data);
        break;
        
      case 'alert':
        this.handleAlert(message.data as LogisticsAlert);
        break;
        
      case 'geofence_event':
        this.handleGeofenceEvent(message.data as GeofenceEvent);
        break;
        
      case 'route_update':
        this.handleRouteUpdate(message.data);
        break;
        
      default:
        console.log('🤷 Unknown message type:', message.type);
    }
    
    // Emitir evento genérico
    this.emit('message', message);
  }
  
  private handleTrackingUpdate(update: TrackingUpdate): void {
    console.log('📍 Tracking update:', update);
    this.emit('tracking_update', update);
  }
  
  private handleShipmentStatus(data: any): void {
    console.log('📦 Shipment status update:', data);
    this.emit('shipment_status', data);
  }
  
  private handleAlert(alert: LogisticsAlert): void {
    console.log('🚨 Alert received:', alert);
    this.emit('alert', alert);
    
    // Mostrar notificación del navegador si está permitido (DESHABILITADO EN DESARROLLO)
    if ('Notification' in window && Notification.permission === 'granted' && process.env.NODE_ENV === 'production') {
      new Notification(`Alerta de Logística - ${alert.type}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }
  
  private handleGeofenceEvent(event: GeofenceEvent): void {
    console.log('🗺️ Geofence event:', event);
    this.emit('geofence_event', event);
  }
  
  private handleRouteUpdate(data: any): void {
    console.log('🛣️ Route update:', data);
    this.emit('route_update', data);
  }
  
  // =====================================================
  // UTILIDADES
  // =====================================================
  
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
  
  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
  
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

let logisticsWS: LogisticsWebSocketClient | null = null;

export function getLogisticsWebSocket(): LogisticsWebSocketClient {
  if (!logisticsWS) {
    // En desarrollo usar WebSocket local, en producción usar WSS
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:3001/logistics'
      : 'wss://api.pinteya.com/logistics';
    
    logisticsWS = new LogisticsWebSocketClient(wsUrl);
  }
  
  return logisticsWS;
}

// =====================================================
// SIMULADOR PARA DESARROLLO
// =====================================================

export class LogisticsWebSocketSimulator extends EventEmitter {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;
  
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎭 Iniciando simulador WebSocket');
    
    // Simular actualizaciones de tracking cada 10 segundos
    const trackingInterval = setInterval(() => {
      this.simulateTrackingUpdate();
    }, 10000);
    
    // Simular alertas cada 30 segundos
    const alertInterval = setInterval(() => {
      this.simulateAlert();
    }, 30000);
    
    // Simular eventos de geofence cada 45 segundos
    const geofenceInterval = setInterval(() => {
      this.simulateGeofenceEvent();
    }, 45000);
    
    this.intervals.push(trackingInterval, alertInterval, geofenceInterval);
  }
  
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    console.log('🛑 Simulador WebSocket detenido');
  }
  
  private simulateTrackingUpdate(): void {
    const update: TrackingUpdate = {
      shipment_id: Math.floor(Math.random() * 100) + 1,
      location: {
        latitude: -34.6037 + (Math.random() - 0.5) * 0.1,
        longitude: -58.3816 + (Math.random() - 0.5) * 0.1,
        address: 'Av. Corrientes 1234, CABA'
      },
      status: ['in_transit', 'out_for_delivery'][Math.floor(Math.random() * 2)],
      timestamp: new Date().toISOString(),
      courier_id: Math.floor(Math.random() * 4) + 1,
      estimated_arrival: new Date(Date.now() + 3600000).toISOString()
    };
    
    this.emit('tracking_update', update);
  }
  
  private simulateAlert(): void {
    const alerts = [
      { type: 'delay', message: 'Retraso en la entrega debido al tráfico' },
      { type: 'exception', message: 'Dirección incorrecta, contactar cliente' },
      { type: 'delivery_attempt', message: 'Primer intento de entrega fallido' }
    ];
    
    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    
    const alert: LogisticsAlert = {
      id: `alert_${Date.now()}`,
      type: randomAlert.type as any,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      shipment_id: Math.floor(Math.random() * 100) + 1,
      message: randomAlert.message,
      timestamp: new Date().toISOString(),
      auto_resolve: Math.random() > 0.5
    };
    
    this.emit('alert', alert);
  }
  
  private simulateGeofenceEvent(): void {
    const event: GeofenceEvent = {
      shipment_id: Math.floor(Math.random() * 100) + 1,
      zone_id: ['caba', 'gba_norte'][Math.floor(Math.random() * 2)],
      zone_name: ['CABA - Zona Prioritaria', 'GBA Norte - Zona de Entrega'][Math.floor(Math.random() * 2)],
      event_type: ['enter', 'exit'][Math.floor(Math.random() * 2)] as any,
      location: {
        latitude: -34.6037 + (Math.random() - 0.5) * 0.1,
        longitude: -58.3816 + (Math.random() - 0.5) * 0.1
      },
      timestamp: new Date().toISOString()
    };
    
    this.emit('geofence_event', event);
  }
}
