// ===================================
// PINTEYA E-COMMERCE - API TEST EMAIL
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPasswordResetEmail,
  getEmailServiceConfig 
} from '../../../../../lib/email';

// ===================================
// POST - ENVIAR EMAIL DE PRUEBA
// ===================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, userName } = body;

    // Verificar configuración
    const config = getEmailServiceConfig();
    if (!config.isReady) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Servicio de email no configurado',
          config: {
            hasApiKey: config.hasApiKey,
            fromEmail: config.fromEmail
          }
        },
        { status: 500 }
      );
    }

    // Validar parámetros
    if (!email || !userName) {
      return NextResponse.json(
        { success: false, error: 'Email y userName son requeridos' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({
          userName,
          userEmail: email
        });
        break;

      case 'order':
        result = await sendOrderConfirmationEmail({
          userName,
          userEmail: email,
          orderNumber: 'TEST-001',
          orderTotal: '$15.990',
          orderItems: [
            { name: 'Pintura Sherwin Williams Blanco', quantity: 2, price: '$8.990' },
            { name: 'Rodillo Profesional', quantity: 1, price: '$6.990' }
          ]
        });
        break;

      case 'reset':
        result = await sendPasswordResetEmail({
          userName,
          userEmail: email,
          resetLink: 'https://www.pinteya.com/reset-password?token=test-token-123'
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de email no válido. Usa: welcome, order, reset' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      type,
      sentTo: email
    });

  } catch (error) {
    console.error('Error en API test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// ===================================
// GET - VERIFICAR CONFIGURACIÓN
// ===================================

export async function GET() {
  try {
    const config = getEmailServiceConfig();
    
    return NextResponse.json({
      success: true,
      config: {
        isReady: config.isReady,
        fromEmail: config.fromEmail,
        supportEmail: config.supportEmail,
        hasApiKey: config.hasApiKey,
        provider: 'Resend'
      }
    });

  } catch (error) {
    console.error('Error verificando configuración email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
