// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ===================================
// ERROR MONITORING API
// ===================================
// API para recibir y almacenar reportes de errores del Error Boundary System

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===================================
// INTERFACES
// ===================================

interface ErrorReport {
  errorId: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo?: {
    componentStack: string;
  };
  context: {
    level: string;
    component: string;
    url: string;
    userAgent: string;
    userId?: string;
  };
  recovery?: {
    strategy: string;
    retryCount: number;
    successful: boolean;
  };
  performance?: {
    timeToError: number;
    memoryUsage?: number;
  };
}

// ===================================
// POST - RECIBIR REPORTE DE ERROR
// ===================================

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 Error Monitoring API: Recibiendo reporte de error');

    const body = await request.json();
    const errorReport: ErrorReport = body;

    // Validar datos requeridos
    if (!errorReport.errorId || !errorReport.error || !errorReport.context) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de error incompletos' 
        },
        { status: 400 }
      );
    }

    // Preparar datos para almacenamiento
    const errorData = {
      error_id: errorReport.errorId,
      timestamp: new Date(errorReport.timestamp).toISOString(),
      error_name: errorReport.error.name,
      error_message: errorReport.error.message,
      error_stack: errorReport.error.stack,
      component_stack: errorReport.errorInfo?.componentStack,
      level: errorReport.context.level,
      component: errorReport.context.component,
      url: errorReport.context.url,
      user_agent: errorReport.context.userAgent,
      user_id: errorReport.context.userId,
      recovery_strategy: errorReport.recovery?.strategy,
      retry_count: errorReport.recovery?.retryCount || 0,
      recovery_successful: errorReport.recovery?.successful || false,
      time_to_error: errorReport.performance?.timeToError,
      memory_usage: errorReport.performance?.memoryUsage,
      created_at: new Date().toISOString()
    };

    // Almacenar en Supabase
    const { data, error: dbError } = await supabase
      .from('error_reports')
      .insert(errorData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error almacenando reporte:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error almacenando reporte',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    // Analizar severidad y enviar alertas si es necesario
    await analyzeAndAlert(errorReport);

    console.log(`✅ Reporte de error almacenado: ${errorReport.errorId}`);

    return NextResponse.json({
      success: true,
      message: 'Reporte de error procesado exitosamente',
      errorId: errorReport.errorId,
      stored: true
    });

  } catch (error: any) {
    console.error('❌ Error en API de monitoreo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// ===================================
// GET - OBTENER REPORTES DE ERRORES
// ===================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const level = searchParams.get('level');
    const component = searchParams.get('component');
    const timeframe = searchParams.get('timeframe') || '24h';

    console.log('📊 Error Monitoring API: Obteniendo reportes de errores');

    // Calcular fecha de inicio según timeframe
    const now = new Date();
    const timeframeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeframe] || 24;

    const startTime = new Date(now.getTime() - (timeframeHours * 60 * 60 * 1000));

    // Construir query
    let query = supabase
      .from('error_reports')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (level) {
      query = query.eq('level', level);
    }
    if (component) {
      query = query.eq('component', component);
    }

    const { data: errors, error: dbError } = await query;

    if (dbError) {
      console.error('❌ Error obteniendo reportes:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo reportes',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    // Obtener estadísticas
    const stats = await getErrorStats(startTime);

    return NextResponse.json({
      success: true,
      data: {
        errors: errors || [],
        stats,
        pagination: {
          limit,
          offset,
          total: errors?.length || 0
        },
        filters: {
          level,
          component,
          timeframe
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error en API de monitoreo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function analyzeAndAlert(errorReport: ErrorReport) {
  try {
    // Determinar severidad
    const severity = determineSeverity(errorReport);
    
    // Enviar alerta si es crítico
    if (severity === 'critical') {
      await sendCriticalAlert(errorReport);
    }

    // Verificar patrones de errores frecuentes
    await checkErrorPatterns(errorReport);

  } catch (error) {
    console.error('❌ Error analizando reporte:', error);
  }
}

function determineSeverity(errorReport: ErrorReport): 'low' | 'medium' | 'high' | 'critical' {
  const { level, component } = errorReport.context;
  const { name: errorName } = errorReport.error;

  // Errores críticos
  if (level === 'page' || component.includes('checkout') || component.includes('payment')) {
    return 'critical';
  }

  // Errores de alta prioridad
  if (errorName.includes('ChunkLoadError') || errorName.includes('NetworkError')) {
    return 'high';
  }

  // Errores de sección
  if (level === 'section') {
    return 'medium';
  }

  return 'low';
}

async function sendCriticalAlert(errorReport: ErrorReport) {
  try {
    // Aquí se podría integrar con servicios de notificación
    // como Slack, Discord, email, etc.
    
    console.log('🚨 CRITICAL ERROR ALERT:', {
      errorId: errorReport.errorId,
      component: errorReport.context.component,
      message: errorReport.error.message,
      url: errorReport.context.url
    });

    // Ejemplo de integración con webhook de Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 CRITICAL ERROR in ${errorReport.context.component}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Error ID', value: errorReport.errorId, short: true },
              { title: 'Component', value: errorReport.context.component, short: true },
              { title: 'Message', value: errorReport.error.message, short: false },
              { title: 'URL', value: errorReport.context.url, short: false }
            ]
          }]
        })
      });
    }

  } catch (error) {
    console.error('❌ Error enviando alerta crítica:', error);
  }
}

async function checkErrorPatterns(errorReport: ErrorReport) {
  try {
    const { component, level } = errorReport.context;
    const { name: errorName } = errorReport.error;

    // Buscar errores similares en las últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: similarErrors, error } = await supabase
      .from('error_reports')
      .select('error_id, timestamp')
      .eq('component', component)
      .eq('error_name', errorName)
      .gte('timestamp', oneDayAgo.toISOString());

    if (error) {
      console.error('❌ Error verificando patrones:', error);
      return;
    }

    // Si hay más de 5 errores similares, es un patrón
    if (similarErrors && similarErrors.length >= 5) {
      console.warn(`⚠️ Error pattern detected: ${errorName} in ${component} (${similarErrors.length} occurrences)`);
      
      // Aquí se podría enviar una alerta de patrón detectado
      await sendPatternAlert(component, errorName, similarErrors.length);
    }

  } catch (error) {
    console.error('❌ Error verificando patrones:', error);
  }
}

async function sendPatternAlert(component: string, errorName: string, count: number) {
  try {
    console.log(`📈 PATTERN ALERT: ${errorName} in ${component} occurred ${count} times in 24h`);
    
    // Aquí se podría enviar notificación de patrón
    // por ejemplo, crear un issue en GitHub, enviar email, etc.
    
  } catch (error) {
    console.error('❌ Error enviando alerta de patrón:', error);
  }
}

async function getErrorStats(startTime: Date) {
  try {
    const { data: stats, error } = await supabase
      .from('error_reports')
      .select('level, error_name, component')
      .gte('timestamp', startTime.toISOString());

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }

    if (!stats) {return null;}

    // Calcular estadísticas
    const totalErrors = stats.length;
    const errorsByLevel = stats.reduce((acc: any, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {});

    const errorsByType = stats.reduce((acc: any, error) => {
      acc[error.error_name] = (acc[error.error_name] || 0) + 1;
      return acc;
    }, {});

    const errorsByComponent = stats.reduce((acc: any, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {});

    return {
      totalErrors,
      errorsByLevel,
      errorsByType,
      errorsByComponent
    };

  } catch (error) {
    console.error('❌ Error calculando estadísticas:', error);
    return null;
  }
}










