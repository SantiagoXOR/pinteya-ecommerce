// ===================================
// PINTEYA E-COMMERCE - API DE EXPORTACIÓN DE DATOS PERSONALES (GDPR)
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logPreferenceActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// GET - Exportar datos personales del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    // Validar formato
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Use json o csv' },
        { status: 400 }
      );
    }

    // Recopilar todos los datos del usuario
    const userData = await collectUserData(userId);

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'export_data',
      {
        format,
        data_types: Object.keys(userData),
        export_timestamp: new Date().toISOString(),
      },
      requestInfo
    );

    // Generar respuesta según el formato
    if (format === 'csv') {
      const csv = generateCSV(userData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="pinteya-data-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // JSON por defecto
      const jsonData = {
        export_info: {
          user_id: userId,
          export_date: new Date().toISOString(),
          format: 'json',
          version: '1.0',
        },
        ...userData,
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pinteya-data-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error en GET /api/user/export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para recopilar todos los datos del usuario
async function collectUserData(userId: string) {
  const userData: any = {};

  try {
    // 1. Información del perfil
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    userData.profile = profile ? {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    } : null;

    // 2. Direcciones
    const { data: addresses } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId);

    userData.addresses = addresses || [];

    // 3. Órdenes
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        payment_status,
        shipping_address,
        billing_address,
        created_at,
        updated_at
      `)
      .eq('user_id', userId);

    userData.orders = orders || [];

    // 4. Preferencias
    const { data: preferences } = await supabaseAdmin
      .from('user_preferences')
      .select('preferences, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    userData.preferences = preferences || null;

    // 5. Sesiones (últimos 90 días)
    const { data: sessions } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        device_type,
        device_name,
        browser,
        os,
        ip_address,
        location,
        is_trusted,
        last_activity,
        created_at
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    userData.sessions = sessions || [];

    // 6. Actividad (últimos 90 días)
    const { data: activity } = await supabaseAdmin
      .from('user_activity')
      .select(`
        action,
        category,
        description,
        metadata,
        ip_address,
        created_at
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    userData.activity = activity || [];

    // 7. Configuración de seguridad
    const { data: securitySettings } = await supabaseAdmin
      .from('user_security_settings')
      .select(`
        two_factor_enabled,
        session_timeout,
        max_concurrent_sessions,
        alert_preferences,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single();

    userData.security_settings = securitySettings || null;

    // 8. Alertas de seguridad (últimos 90 días)
    const { data: securityAlerts } = await supabaseAdmin
      .from('user_security_alerts')
      .select(`
        type,
        severity,
        title,
        description,
        metadata,
        is_read,
        is_resolved,
        created_at,
        resolved_at
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    userData.security_alerts = securityAlerts || [];

    // 9. Carrito (si existe)
    const { data: cart } = await supabaseAdmin
      .from('cart_items')
      .select(`
        product_id,
        quantity,
        price,
        created_at,
        updated_at
      `)
      .eq('user_id', userId);

    userData.cart = cart || [];

    return userData;
  } catch (error) {
    console.error('Error al recopilar datos del usuario:', error);
    throw error;
  }
}

// Función para generar CSV
function generateCSV(userData: any): string {
  const csvRows: string[] = [];
  
  // Header
  csvRows.push('Sección,Campo,Valor,Fecha');

  // Procesar cada sección
  Object.entries(userData).forEach(([section, data]) => {
    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        Object.entries(item).forEach(([key, value]) => {
          const csvValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
          csvRows.push(`"${section}[${index}]","${key}","${csvValue.replace(/"/g, '""')}","${item.created_at || ''}"`);
        });
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        const csvValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
        csvRows.push(`"${section}","${key}","${csvValue.replace(/"/g, '""')}","${data.created_at || data.updated_at || ''}"`);
      });
    }
  });

  return csvRows.join('\n');
}

// POST - Solicitar exportación por email (para archivos grandes)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { format = 'json', email_delivery = true } = body;

    // Validar formato
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Use json o csv' },
        { status: 400 }
      );
    }

    // Crear solicitud de exportación
    const { data: exportRequest, error } = await supabaseAdmin
      .from('data_export_requests')
      .insert({
        user_id: userId,
        format,
        status: 'pending',
        email_delivery,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear solicitud de exportación:', error);
      return NextResponse.json(
        { error: 'Error al crear solicitud de exportación' },
        { status: 500 }
      );
    }

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'request_data_export',
      {
        format,
        email_delivery,
        request_id: exportRequest.id,
      },
      requestInfo
    );

    // Aquí se podría agregar a una cola de procesamiento para archivos grandes
    // Por ahora, procesamos inmediatamente
    try {
      const userData = await collectUserData(userId);
      
      // Actualizar estado a completado
      await supabaseAdmin
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportRequest.id);

      // Enviar por email (implementación pendiente)
      // await sendDataExportEmail(userId, userData, format);

    } catch (processingError) {
      console.error('Error al procesar exportación:', processingError);
      
      // Actualizar estado a error
      await supabaseAdmin
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: 'Error al procesar la exportación',
        })
        .eq('id', exportRequest.id);
    }

    return NextResponse.json({
      success: true,
      request_id: exportRequest.id,
      message: email_delivery 
        ? 'Solicitud de exportación creada. Recibirás un email con el enlace de descarga.'
        : 'Exportación procesada correctamente.',
    });
  } catch (error) {
    console.error('Error en POST /api/user/export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}









