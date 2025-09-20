// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API de monitoreo de seguridad
 * Proporciona estadísticas y eventos de seguridad para el dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurityStats, securityMonitor } from '@/lib/security/security-monitor';
import { generateCorsHeaders } from '@/lib/security/cors-config';
import { logger, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET - Obtener estadísticas de seguridad
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') as 'hour' | 'day' | 'week' || 'day';
    const includeEvents = searchParams.get('includeEvents') === 'true';
    
    // Obtener estadísticas
    const stats = getSecurityStats(timeRange);
    
    // Respuesta base
    const response: any = {
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString(),
        timeRange
      }
    };
    
    // Incluir eventos recientes si se solicita
    if (includeEvents) {
      const recentEvents = securityMonitor['eventBuffer']
        .slice(-50) // Últimos 50 eventos
        .map(event => ({
          type: event.type,
          severity: event.severity,
          source: event.source,
          timestamp: event.timestamp,
          ip: event.ip ? event.ip.substring(0, 8) + '***' : undefined, // Ofuscar IP
          userAgent: event.userAgent ? event.userAgent.substring(0, 50) + '...' : undefined
        }));
      
      response.data.recentEvents = recentEvents;
    }
    
    // Log del acceso al monitoreo
    logger.info(LogLevel.INFO, 'Security monitoring accessed', {
      timeRange,
      includeEvents,
      statsCount: stats.totalEvents
    });
    
    const origin = request.headers.get('origin');
    const corsHeaders = generateCorsHeaders(origin, 'admin');
    
    return NextResponse.json(response, {
      headers: corsHeaders
    });
    
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error accessing security monitoring', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const origin = request.headers.get('origin');
    const corsHeaders = generateCorsHeaders(origin, 'admin');
    
    return NextResponse.json({
      success: false,
      error: 'Error accessing security monitoring'
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// ===================================
// POST - Reportar evento de seguridad manual
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, details, source = 'manual_report' } = body;
    
    // Validar datos requeridos
    if (!type || !severity || !details) {
      const origin = request.headers.get('origin');
      const corsHeaders = generateCorsHeaders(origin, 'admin');
      
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, severity, details'
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Registrar evento de seguridad
    securityMonitor.logSecurityEvent({
      type,
      severity,
      source,
      details,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    
    logger.info(LogLevel.INFO, 'Manual security event reported', {
      type,
      severity,
      source,
      reportedBy: 'admin_user' // En un caso real, obtener del token de auth
    });
    
    const origin = request.headers.get('origin');
    const corsHeaders = generateCorsHeaders(origin, 'admin');
    
    return NextResponse.json({
      success: true,
      message: 'Security event reported successfully'
    }, {
      headers: corsHeaders
    });
    
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error reporting security event', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    const origin = request.headers.get('origin');
    const corsHeaders = generateCorsHeaders(origin, 'admin');
    
    return NextResponse.json({
      success: false,
      error: 'Error reporting security event'
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// ===================================
// OPTIONS - CORS
// ===================================
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = generateCorsHeaders(origin, 'admin');
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
