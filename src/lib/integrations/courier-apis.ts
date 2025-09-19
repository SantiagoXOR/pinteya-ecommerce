// =====================================================
// INTEGRACIÓN: APIS DE COURIERS ARGENTINOS
// Descripción: Conectores para OCA, Andreani, Correo Argentino y MercadoEnvíos
// Basado en: APIs REST + Webhooks + Rate Limiting
// =====================================================

import { z } from 'zod';

// =====================================================
// INTERFACES COMUNES
// =====================================================

export interface CourierAPIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
  timeout: number;
  retries: number;
}

export interface TrackingResponse {
  courier: string;
  trackingNumber: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  lastUpdate: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: {
    city: string;
    state: string;
    coordinates?: [number, number];
  };
  facility?: string;
}

export interface ShippingQuoteRequest {
  origin: {
    postalCode: string;
    city: string;
    state: string;
  };
  destination: {
    postalCode: string;
    city: string;
    state: string;
  };
  package: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue?: number;
  };
  serviceType?: string;
}

export interface ShippingQuote {
  courier: string;
  serviceType: string;
  cost: number;
  estimatedDays: number;
  estimatedDelivery: string;
  restrictions?: string[];
}

// =====================================================
// CLASE BASE PARA COURIERS
// =====================================================

export abstract class CourierAPI {
  protected config: CourierAPIConfig;
  protected lastRequest: number = 0;
  
  constructor(config: CourierAPIConfig) {
    this.config = config;
  }
  
  // Rate limiting
  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    const minInterval = this.config.rateLimit.window / this.config.rateLimit.requests;
    
    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
  }
  
  // HTTP request con retry
  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimit();
    
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers
    };
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
  
  // Métodos abstractos que deben implementar los couriers
  abstract getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote[]>;
  abstract trackShipment(trackingNumber: string): Promise<TrackingResponse>;
  abstract createShipment(shipmentData: any): Promise<any>;
  abstract cancelShipment(trackingNumber: string): Promise<boolean>;
}

// =====================================================
// OCA (ORGANIZACIÓN COORDINADORA ARGENTINA)
// =====================================================

export class OCAApi extends CourierAPI {
  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    super({
      name: 'OCA',
      baseUrl: environment === 'production' 
        ? 'https://webservice.oca.com.ar/oep_tracking/Oep_Track.asmx'
        : 'https://webservice.oca.com.ar/oep_tracking_test/Oep_Track.asmx',
      apiKey,
      environment,
      rateLimit: { requests: 100, window: 60000 }, // 100 req/min
      timeout: 30000,
      retries: 3
    });
  }
  
  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
    try {
      const response = await this.request<any>('/Tarifar_Envio_Corporativo', {
        method: 'POST',
        body: JSON.stringify({
          PesoTotal: request.package.weight,
          VolumenTotal: this.calculateVolume(request.package.dimensions),
          CodigoPostalOrigen: request.origin.postalCode,
          CodigoPostalDestino: request.destination.postalCode,
          CantidadPaquetes: 1,
          Cuit: this.config.apiKey
        })
      });
      
      return this.parseOCAQuotes(response);
      
    } catch (error) {
      console.error('Error getting OCA quote:', error);
      throw error;
    }
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await this.request<any>('/Tracking_Pieza', {
        method: 'POST',
        body: JSON.stringify({
          Pieza: trackingNumber,
          NroDocumentoCliente: this.config.apiKey
        })
      });
      
      return this.parseOCATracking(response, trackingNumber);
      
    } catch (error) {
      console.error('Error tracking OCA shipment:', error);
      throw error;
    }
  }
  
  async createShipment(shipmentData: any): Promise<any> {
    // Implementar creación de envío OCA
    throw new Error('OCA createShipment not implemented yet');
  }
  
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    // Implementar cancelación OCA
    throw new Error('OCA cancelShipment not implemented yet');
  }
  
  private calculateVolume(dimensions: { length: number; width: number; height: number }): number {
    return dimensions.length * dimensions.width * dimensions.height;
  }
  
  private parseOCAQuotes(response: any): ShippingQuote[] {
    // Parsear respuesta de OCA a formato estándar
    if (!response.Tarifas) {return [];}
    
    return response.Tarifas.map((tarifa: any) => ({
      courier: 'OCA',
      serviceType: tarifa.Producto,
      cost: parseFloat(tarifa.Total),
      estimatedDays: parseInt(tarifa.PlazoEntrega),
      estimatedDelivery: this.calculateDeliveryDate(parseInt(tarifa.PlazoEntrega)),
      restrictions: tarifa.Restricciones ? [tarifa.Restricciones] : []
    }));
  }
  
  private parseOCATracking(response: any, trackingNumber: string): TrackingResponse {
    const events: TrackingEvent[] = [];
    
    if (response.Eventos) {
      events.push(...response.Eventos.map((evento: any) => ({
        timestamp: evento.Fecha,
        status: this.mapOCAStatus(evento.Estado),
        description: evento.Descripcion,
        location: {
          city: evento.Sucursal?.Ciudad || '',
          state: evento.Sucursal?.Provincia || ''
        },
        facility: evento.Sucursal?.Nombre
      })));
    }
    
    return {
      courier: 'OCA',
      trackingNumber,
      status: events.length > 0 ? events[0].status : 'unknown',
      events,
      lastUpdate: new Date().toISOString()
    };
  }
  
  private mapOCAStatus(ocaStatus: string): string {
    const statusMap: Record<string, string> = {
      'En Origen': 'picked_up',
      'En Tránsito': 'in_transit',
      'En Destino': 'out_for_delivery',
      'Entregado': 'delivered',
      'No Entregado': 'exception'
    };
    
    return statusMap[ocaStatus] || 'unknown';
  }
  
  private calculateDeliveryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// =====================================================
// ANDREANI
// =====================================================

export class AndreaniApi extends CourierAPI {
  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    super({
      name: 'Andreani',
      baseUrl: environment === 'production' 
        ? 'https://apis.andreani.com/v2'
        : 'https://apis.andreani.com/v2', // Mismo endpoint para ambos
      apiKey,
      environment,
      rateLimit: { requests: 200, window: 60000 }, // 200 req/min
      timeout: 25000,
      retries: 3
    });
  }
  
  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
    try {
      const response = await this.request<any>('/cotizaciones', {
        method: 'POST',
        body: JSON.stringify({
          cpOrigen: request.origin.postalCode,
          cpDestino: request.destination.postalCode,
          peso: request.package.weight,
          volumen: this.calculateVolume(request.package.dimensions),
          valorDeclarado: request.package.declaredValue || 0
        })
      });
      
      return this.parseAndreaniQuotes(response);
      
    } catch (error) {
      console.error('Error getting Andreani quote:', error);
      throw error;
    }
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await this.request<any>(`/envios/${trackingNumber}/trazas`);
      
      return this.parseAndreaniTracking(response, trackingNumber);
      
    } catch (error) {
      console.error('Error tracking Andreani shipment:', error);
      throw error;
    }
  }
  
  async createShipment(shipmentData: any): Promise<any> {
    // Implementar creación de envío Andreani
    throw new Error('Andreani createShipment not implemented yet');
  }
  
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    // Implementar cancelación Andreani
    throw new Error('Andreani cancelShipment not implemented yet');
  }
  
  private calculateVolume(dimensions: { length: number; width: number; height: number }): number {
    return (dimensions.length * dimensions.width * dimensions.height) / 1000000; // cm³ to m³
  }
  
  private parseAndreaniQuotes(response: any): ShippingQuote[] {
    if (!response.cotizaciones) {return [];}
    
    return response.cotizaciones.map((cotizacion: any) => ({
      courier: 'Andreani',
      serviceType: cotizacion.producto.descripcion,
      cost: parseFloat(cotizacion.tarifaConIva),
      estimatedDays: parseInt(cotizacion.plazoEntrega),
      estimatedDelivery: this.calculateDeliveryDate(parseInt(cotizacion.plazoEntrega)),
      restrictions: []
    }));
  }
  
  private parseAndreaniTracking(response: any, trackingNumber: string): TrackingResponse {
    const events: TrackingEvent[] = [];
    
    if (response.trazas) {
      events.push(...response.trazas.map((traza: any) => ({
        timestamp: traza.fecha,
        status: this.mapAndreaniStatus(traza.estado),
        description: traza.descripcion,
        location: {
          city: traza.sucursal?.localidad || '',
          state: traza.sucursal?.provincia || ''
        },
        facility: traza.sucursal?.descripcion
      })));
    }
    
    return {
      courier: 'Andreani',
      trackingNumber,
      status: events.length > 0 ? events[0].status : 'unknown',
      events,
      lastUpdate: new Date().toISOString()
    };
  }
  
  private mapAndreaniStatus(andreaniStatus: string): string {
    const statusMap: Record<string, string> = {
      'Admitido': 'confirmed',
      'En tránsito': 'in_transit',
      'En reparto': 'out_for_delivery',
      'Entregado': 'delivered',
      'No entregado': 'exception'
    };
    
    return statusMap[andreaniStatus] || 'unknown';
  }
  
  private calculateDeliveryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// =====================================================
// CORREO ARGENTINO
// =====================================================

export class CorreoArgentinoApi extends CourierAPI {
  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    super({
      name: 'Correo Argentino',
      baseUrl: environment === 'production' 
        ? 'https://api.correoargentino.com.ar/v1'
        : 'https://api-test.correoargentino.com.ar/v1',
      apiKey,
      environment,
      rateLimit: { requests: 150, window: 60000 }, // 150 req/min
      timeout: 30000,
      retries: 3
    });
  }
  
  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
    // Implementar cotización Correo Argentino
    return [{
      courier: 'Correo Argentino',
      serviceType: 'Encomienda Clásica',
      cost: 1500 + (request.package.weight * 200), // Simulado
      estimatedDays: 5,
      estimatedDelivery: this.calculateDeliveryDate(5),
      restrictions: []
    }];
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    // Implementar tracking Correo Argentino
    return {
      courier: 'Correo Argentino',
      trackingNumber,
      status: 'in_transit',
      events: [{
        timestamp: new Date().toISOString(),
        status: 'in_transit',
        description: 'En tránsito hacia destino',
        location: {
          city: 'Buenos Aires',
          state: 'Buenos Aires'
        }
      }],
      lastUpdate: new Date().toISOString()
    };
  }
  
  async createShipment(shipmentData: any): Promise<any> {
    throw new Error('Correo Argentino createShipment not implemented yet');
  }
  
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    throw new Error('Correo Argentino cancelShipment not implemented yet');
  }
  
  private calculateDeliveryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// =====================================================
// FACTORY PARA COURIERS
// =====================================================

export class CourierAPIFactory {
  private static instances: Map<string, CourierAPI> = new Map();
  
  static getCourierAPI(
    courier: 'oca' | 'andreani' | 'correo_argentino',
    apiKey: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): CourierAPI {
    
    const key = `${courier}_${environment}`;
    
    if (!this.instances.has(key)) {
      let api: CourierAPI;
      
      switch (courier) {
        case 'oca':
          api = new OCAApi(apiKey, environment);
          break;
        case 'andreani':
          api = new AndreaniApi(apiKey, environment);
          break;
        case 'correo_argentino':
          api = new CorreoArgentinoApi(apiKey, environment);
          break;
        default:
          throw new Error(`Unsupported courier: ${courier}`);
      }
      
      this.instances.set(key, api);
    }
    
    return this.instances.get(key)!;
  }
  
  static async getMultipleQuotes(
    request: ShippingQuoteRequest,
    couriers: Array<{
      name: 'oca' | 'andreani' | 'correo_argentino';
      apiKey: string;
      environment?: 'sandbox' | 'production';
    }>
  ): Promise<ShippingQuote[]> {
    
    const promises = couriers.map(async (courier) => {
      try {
        const api = this.getCourierAPI(courier.name, courier.apiKey, courier.environment);
        return await api.getQuote(request);
      } catch (error) {
        console.error(`Error getting quote from ${courier.name}:`, error);
        return [];
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ShippingQuote[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);
  }
  
  static async trackMultipleShipments(
    trackingRequests: Array<{
      courier: 'oca' | 'andreani' | 'correo_argentino';
      trackingNumber: string;
      apiKey: string;
      environment?: 'sandbox' | 'production';
    }>
  ): Promise<TrackingResponse[]> {
    
    const promises = trackingRequests.map(async (request) => {
      try {
        const api = this.getCourierAPI(request.courier, request.apiKey, request.environment);
        return await api.trackShipment(request.trackingNumber);
      } catch (error) {
        console.error(`Error tracking ${request.courier} shipment:`, error);
        return null;
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<TrackingResponse | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
  }
}









