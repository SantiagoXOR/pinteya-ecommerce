import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Tipos para configuración (placeholder)
interface SystemSettings {
  id: string;
  store_name: string;
  store_description: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  currency: string;
  timezone: string;
  language: string;
  tax_rate: number;
  shipping_enabled: boolean;
  payment_methods: string[];
  updated_at: string;
}

// Configuración de ejemplo (placeholder)
const mockSettings: SystemSettings = {
  id: 'settings_1',
  store_name: 'Pinteya E-commerce',
  store_description: 'Tu tienda de pinturería, ferretería y corralón de confianza',
  store_email: 'info@pinteya.com',
  store_phone: '+54 351 123-4567',
  store_address: 'Córdoba Capital, Argentina',
  currency: 'ARS',
  timezone: 'America/Argentina/Cordoba',
  language: 'es',
  tax_rate: 21.0,
  shipping_enabled: true,
  payment_methods: ['mercadopago', 'transferencia', 'efectivo'],
  updated_at: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: GET /api/admin/settings - Iniciando...');

    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    const response = {
      success: true,
      data: mockSettings,
      message: 'Configuración del sistema obtenida exitosamente'
    };

    console.log('✅ Configuración obtenida exitosamente');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/admin/settings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 API: PUT /api/admin/settings - Iniciando...');

    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    // TODO: Implementar actualización de configuración
    return NextResponse.json({
      success: false,
      error: 'Funcionalidad no implementada aún',
      message: 'La actualización de configuración estará disponible en una próxima versión'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error en PUT /api/admin/settings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
