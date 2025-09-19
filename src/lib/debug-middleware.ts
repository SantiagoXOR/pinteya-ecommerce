/**
 * Middleware de debugging para APIs de búsqueda
 * Pinteya E-commerce
 */

import { NextRequest, NextResponse } from 'next/server';

export interface DebugInfo {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  searchParams: Record<string, string>;
  userAgent: string;
  environment: string;
  supabaseConfigured: boolean;
}

export interface ApiDebugResult {
  debugInfo: DebugInfo;
  success: boolean;
  data?: any;
  error?: string;
  timing: number;
  statusCode: number;
}

/**
 * Captura información de debugging de la request
 */
export function captureDebugInfo(request: NextRequest): DebugInfo {
  const url = new URL(request.url);
  
  // Convertir headers a objeto simple
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  // Convertir search params a objeto simple
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });
  
  return {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers,
    searchParams,
    userAgent: request.headers.get('user-agent') || 'Unknown',
    environment: process.env.NODE_ENV || 'unknown',
    supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

/**
 * Wrapper para APIs que agrega información de debugging
 */
export function withDebugInfo<T>(
  handler: (request: NextRequest, debugInfo: DebugInfo) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const debugInfo = captureDebugInfo(request);
    
    console.log('🔍 API Debug Info:', {
      method: debugInfo.method,
      url: debugInfo.url,
      searchParams: debugInfo.searchParams,
      environment: debugInfo.environment,
      supabaseConfigured: debugInfo.supabaseConfigured,
    });
    
    try {
      const response = await handler(request, debugInfo);
      const timing = Date.now() - startTime;
      
      console.log('✅ API Success:', {
        url: debugInfo.url,
        status: response.status,
        timing: `${timing}ms`,
      });
      
      // Agregar headers de debugging en desarrollo
      if (process.env.NODE_ENV === 'development') {
        response.headers.set('X-Debug-Timing', `${timing}ms`);
        response.headers.set('X-Debug-Environment', debugInfo.environment);
        response.headers.set('X-Debug-Supabase', debugInfo.supabaseConfigured.toString());
      }
      
      return response;
      
    } catch (error: any) {
      const timing = Date.now() - startTime;
      
      console.error('❌ API Error:', {
        url: debugInfo.url,
        error: error.message,
        timing: `${timing}ms`,
        stack: error.stack,
      });
      
      // Crear respuesta de error con información de debugging
      const errorResponse = {
        success: false,
        error: error.message,
        debugInfo: process.env.NODE_ENV === 'development' ? debugInfo : undefined,
        timing,
      };
      
      return NextResponse.json(errorResponse, { 
        status: 500,
        headers: {
          'X-Debug-Error': 'true',
          'X-Debug-Timing': `${timing}ms`,
        }
      });
    }
  };
}

/**
 * Función para logging estructurado de búsquedas
 */
export function logSearchAttempt(searchTerm: string, results: any[], timing: number) {
  const logData = {
    timestamp: new Date().toISOString(),
    searchTerm,
    resultCount: results.length,
    timing: `${timing}ms`,
    environment: process.env.NODE_ENV,
    hasResults: results.length > 0,
  };
  
  if (results.length > 0) {
    console.log('🔍 Search Success:', logData);
  } else {
    console.warn('⚠️ Search No Results:', logData);
  }
  
  return logData;
}

/**
 * Función para validar configuración de entorno
 */
export function validateEnvironmentConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar variables críticas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL no está configurada');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY no está configurada (requerida para APIs administrativas)');
  }
  
  // Verificar configuración de producción
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('NEXT_PUBLIC_APP_URL no está configurada en producción');
    }
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL apunta a localhost en producción');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Middleware para debugging de requests de búsqueda
 */
export function debugSearchRequest(request: NextRequest) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('search') || url.searchParams.get('q');
  
  if (searchTerm) {
    console.log('🔍 Search Request Debug:', {
      searchTerm,
      url: url.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Función para crear respuesta de debugging
 */
export function createDebugResponse(data: any, debugInfo?: Partial<DebugInfo>) {
  const response = {
    ...data,
    debug: process.env.NODE_ENV === 'development' ? {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...debugInfo,
    } : undefined,
  };
  
  return NextResponse.json(response);
}

/**
 * Hook para debugging en el cliente
 */
export function useDebugMode() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const debugLog = (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
  };
  
  const debugError = (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`❌ [DEBUG] ${message}`, error);
    }
  };
  
  const debugWarn = (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ [DEBUG] ${message}`, data);
    }
  };
  
  return {
    isDevelopment,
    debugLog,
    debugError,
    debugWarn,
  };
}









