// ===================================
// PINTEYA E-COMMERCE - WHATSAPP TEST ENDPOINT
// Endpoint para probar la funcionalidad del sistema de WhatsApp
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { whatsappLinkService, OrderDetails } from '@/lib/integrations/whatsapp/whatsapp-link-service'
import { logger, LogLevel } from '@/lib/enterprise/logger'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin para las pruebas
    if (session.user.email !== 'santiago@xor.com.ar') {
      return NextResponse.json(
        { error: 'Solo administradores pueden ejecutar pruebas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testType = 'full' } = body

    let result: any = {}

    switch (testType) {
      case 'simple':
        // Prueba simple con datos mínimos
        const simpleLink = whatsappLinkService.generateSimpleNotificationLink(
          'TEST-001',
          '$15.500'
        )
        
        result = {
          testType: 'simple',
          whatsappLink: simpleLink,
          isValid: whatsappLinkService.validateWhatsAppLink(simpleLink),
          linkLength: simpleLink.length
        }
        break

      case 'full':
      default:
        // Prueba completa con datos de orden simulados
        const mockOrderDetails: OrderDetails = {
          id: 'test-order-123',
          orderNumber: 'PINTEYA-TEST-001',
          total: '$25.750',
          status: 'confirmed',
          paymentId: 'mp-test-payment-456',
          payerInfo: {
            name: 'Juan Carlos Pérez',
            email: 'juan.perez@email.com',
            phone: '+54 351 123-4567'
          },
          shippingInfo: {
            address: 'Av. Colón 1234, Piso 2, Depto B',
            city: 'Córdoba',
            postalCode: '5000'
          },
          items: [
            {
              name: 'Pintura Látex Interior Blanco 20L - Sherwin Williams',
              quantity: 2,
              price: '$8.500'
            },
            {
              name: 'Rodillo Antigota 23cm + Bandeja',
              quantity: 1,
              price: '$3.250'
            },
            {
              name: 'Pincel Angular 2" - Profesional',
              quantity: 3,
              price: '$1.500'
            }
          ],
          createdAt: new Date().toISOString()
        }

        const fullLink = whatsappLinkService.generateOrderWhatsAppLink(mockOrderDetails)
        
        result = {
          testType: 'full',
          whatsappLink: fullLink,
          isValid: whatsappLinkService.validateWhatsAppLink(fullLink),
          linkLength: fullLink.length,
          orderDetails: mockOrderDetails,
          messagePreview: decodeURIComponent(fullLink.split('text=')[1] || '').substring(0, 200) + '...'
        }
        break

      case 'validation':
        // Prueba de validación de enlaces
        const testLinks = [
          'https://wa.me/5411123456789?text=test',
          'https://wa.me/invalid',
          'https://example.com',
          whatsappLinkService.generateSimpleNotificationLink('VAL-001', '$100')
        ]

        result = {
          testType: 'validation',
          validationResults: testLinks.map(link => ({
            link: link.substring(0, 50) + (link.length > 50 ? '...' : ''),
            isValid: whatsappLinkService.validateWhatsAppLink(link)
          }))
        }
        break
    }

    logger.info(LogLevel.INFO, 'WhatsApp test executed successfully', {
      testType,
      adminEmail: session.user.email,
      resultKeys: Object.keys(result)
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      executedBy: session.user.email,
      ...result
    })

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error in WhatsApp test endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Error ejecutando prueba de WhatsApp',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'WhatsApp Test Endpoint - Pinteya E-commerce',
      availableTests: [
        {
          type: 'simple',
          description: 'Prueba básica con notificación simple',
          method: 'POST',
          body: { testType: 'simple' }
        },
        {
          type: 'full',
          description: 'Prueba completa con datos de orden simulados',
          method: 'POST',
          body: { testType: 'full' }
        },
        {
          type: 'validation',
          description: 'Prueba de validación de enlaces de WhatsApp',
          method: 'POST',
          body: { testType: 'validation' }
        }
      ],
      usage: 'POST /api/whatsapp/test con { "testType": "simple|full|validation" }',
      authentication: 'Requiere autenticación de administrador'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}