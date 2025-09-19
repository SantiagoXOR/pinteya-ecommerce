import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import {
  withRateLimit,
  RATE_LIMIT_CONFIGS
} from '@/lib/rate-limiting/rate-limiter';
import {
  API_TIMEOUTS,
  withDatabaseTimeout,
  getEndpointTimeouts
} from '@/lib/config/api-timeouts';
import { createSecurityLogger } from '@/lib/logging/security-logger';

// Schema de validación para checkout
const checkoutValidationSchema = z.object({
  customerInfo: z.object({
    firstName: z.string().min(1, 'Nombre es requerido'),
    lastName: z.string().min(1, 'Apellido es requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  }),
  shippingAddress: z.object({
    streetAddress: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
    apartment: z.string().optional(),
    city: z.string().min(2, 'Ciudad es requerida'),
    state: z.string().min(2, 'Provincia es requerida'),
    zipCode: z.string().min(4, 'Código postal inválido'),
    country: z.string().default('Argentina'),
    observations: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive('Precio debe ser positivo'),
    quantity: z.number().int().positive('Cantidad debe ser positiva'),
    stock: z.number().int().nonnegative().optional(),
  })).min(1, 'Debe haber al menos un producto'),
  paymentMethod: z.enum(['mercadopago', 'bank', 'cash']),
  shippingMethod: z.enum(['free', 'express', 'pickup']),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
    total: z.number().positive('Total debe ser mayor a 0'),
  }),
});

export async function POST(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request);

  // Aplicar rate limiting para APIs de checkout
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.checkout,
    async () => {
      // Log de acceso a la API
      securityLogger.logEvent('api_access', 'low', {
        endpoint: '/api/checkout/validate',
        method: 'POST',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      try {
        const body = await request.json();
    
    // Validar estructura básica
    const validatedData = checkoutValidationSchema.parse(body);
    
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };
    
    // Validaciones adicionales de negocio
    
    // 1. Validar stock de productos (simulado)
    for (const item of validatedData.items) {
      const simulatedStock = Math.floor(Math.random() * 100) + 10; // Stock simulado
      if (item.quantity > simulatedStock) {
        validationResults.errors.push(
          `Producto "${item.name}": Stock insuficiente (disponible: ${simulatedStock}, solicitado: ${item.quantity})`
        );
        validationResults.isValid = false;
      }
    }
    
    // 2. Validar totales
    const calculatedSubtotal = validatedData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    
    if (Math.abs(calculatedSubtotal - validatedData.totals.subtotal) > 0.01) {
      validationResults.errors.push(
        `Subtotal incorrecto. Calculado: $${calculatedSubtotal}, Recibido: $${validatedData.totals.subtotal}`
      );
      validationResults.isValid = false;
    }
    
    // 3. Validar costo de envío
    const expectedShipping = calculateShippingCost(
      validatedData.shippingMethod,
      validatedData.totals.subtotal,
      validatedData.shippingAddress.state
    );
    
    if (Math.abs(expectedShipping - validatedData.totals.shipping) > 0.01) {
      validationResults.errors.push(
        `Costo de envío incorrecto. Esperado: $${expectedShipping}, Recibido: $${validatedData.totals.shipping}`
      );
      validationResults.isValid = false;
    }
    
    // 4. Validar total final
    const expectedTotal = calculatedSubtotal + expectedShipping - validatedData.totals.discount;
    if (Math.abs(expectedTotal - validatedData.totals.total) > 0.01) {
      validationResults.errors.push(
        `Total incorrecto. Esperado: $${expectedTotal}, Recibido: $${validatedData.totals.total}`
      );
      validationResults.isValid = false;
    }
    
    // 5. Validaciones de dirección
    if (validatedData.shippingAddress.state === 'CABA' && !validatedData.shippingAddress.zipCode.startsWith('C')) {
      validationResults.warnings.push(
        'El código postal no parece corresponder a CABA'
      );
    }
    
    // 6. Sugerencias basadas en observaciones
    if (validatedData.shippingAddress.observations) {
      const obs = validatedData.shippingAddress.observations.toLowerCase();
      if (obs.includes('barrio') || obs.includes('zona')) {
        validationResults.suggestions.push(
          'Excelente! Las observaciones sobre el barrio ayudarán al delivery'
        );
      }
      if (obs.includes('horario') || obs.includes('hora')) {
        validationResults.suggestions.push(
          'Perfecto! Los horarios especificados facilitarán la entrega'
        );
      }
    } else {
      validationResults.suggestions.push(
        'Considera agregar observaciones sobre el barrio o horarios preferidos para mejorar la entrega'
      );
    }
    
    // 7. Validar método de pago
    if (validatedData.paymentMethod === 'bank' && validatedData.totals.total < 10000) {
      validationResults.warnings.push(
        'Para montos menores a $10.000, recomendamos MercadoPago para mayor comodidad'
      );
    }
    
    // Log de validación
    console.log('✅ Validación de checkout:', {
      customer: `${validatedData.customerInfo.firstName} ${validatedData.customerInfo.lastName}`,
      items: validatedData.items.length,
      total: validatedData.totals.total,
      isValid: validationResults.isValid,
      errors: validationResults.errors.length,
      warnings: validationResults.warnings.length,
      observations: validatedData.shippingAddress.observations ? 'Sí' : 'No'
    });
    
    const response = {
      success: true,
      data: {
        validation: validationResults,
        estimatedDelivery: calculateEstimatedDelivery(validatedData.shippingMethod),
        recommendedActions: generateRecommendations(validatedData, validationResults)
      },
      message: validationResults.isValid ? 'Checkout válido' : 'Checkout con errores'
    };
    
        // Log de validación exitosa
        securityLogger.logEvent('checkout_validation', 'low', {
          isValid: validationResults.isValid,
          errorsCount: validationResults.errors.length,
          warningsCount: validationResults.warnings.length,
          total: validatedData.totals.total,
          paymentMethod: validatedData.paymentMethod
        });

        return NextResponse.json(response, {
          status: validationResults.isValid ? 200 : 400
        });

      } catch (error) {
        console.error('❌ Error validando checkout:', error);

        // Log de error de seguridad
        securityLogger.logEvent('checkout_validation_error', 'medium', {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/api/checkout/validate'
        });

        if (error instanceof z.ZodError) {
          return NextResponse.json({
            success: false,
            error: 'Datos de entrada inválidos',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }, { status: 400 });
        }

        return NextResponse.json({
          success: false,
          error: 'Error interno del servidor'
        }, { status: 500 });
      }
    }
  );

  // Manejar rate limit excedido
  if (rateLimitResult instanceof NextResponse) {
    securityLogger.logRateLimitExceeded(
      securityLogger.context,
      { endpoint: '/api/checkout/validate', method: 'POST' }
    );
    return rateLimitResult;
  }

  return rateLimitResult;
}

// Función auxiliar para calcular costo de envío
function calculateShippingCost(method: string, subtotal: number, state: string): number {
  if (method === 'pickup') {return 0;}
  if (method === 'free' && subtotal >= 25000) {return 0;}
  
  const baseCost = method === 'express' ? 5000 : 2500;
  
  // Costo adicional por provincia
  const stateSurcharge = state === 'CABA' ? 0 : 500;
  
  return baseCost + stateSurcharge;
}

// Función auxiliar para calcular fecha estimada de entrega
function calculateEstimatedDelivery(shippingMethod: string): string {
  const now = new Date();
  let daysToAdd = 7;
  
  switch (shippingMethod) {
    case 'express': daysToAdd = 2; break;
    case 'free': daysToAdd = 7; break;
    case 'pickup': daysToAdd = 1; break;
  }
  
  const estimatedDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return estimatedDate.toISOString().split('T')[0]; // Solo fecha
}

// Función auxiliar para generar recomendaciones
function generateRecommendations(data: any, validation: any): string[] {
  const recommendations = [];
  
  if (!validation.isValid) {
    recommendations.push('Corrige los errores antes de continuar');
  }
  
  if (data.totals.total > 50000) {
    recommendations.push('Considera dividir la compra en múltiples órdenes para mayor seguridad');
  }
  
  if (data.paymentMethod === 'cash' && data.totals.total > 30000) {
    recommendations.push('Para montos altos, recomendamos pago digital por seguridad');
  }
  
  if (!data.shippingAddress.observations) {
    recommendations.push('Agrega observaciones para facilitar la entrega');
  }
  
  return recommendations;
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}









