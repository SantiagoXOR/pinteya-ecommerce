// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validación para crear una orden
const createOrderSchema = z.object({
  customerInfo: z.object({
    firstName: z.string().min(1, 'Nombre es requerido'),
    lastName: z.string().min(1, 'Apellido es requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'Teléfono es requerido'),
  }),
  shippingAddress: z.object({
    streetAddress: z.string().min(1, 'Dirección es requerida'),
    apartment: z.string().optional(),
    city: z.string().min(1, 'Ciudad es requerida'),
    state: z.string().min(1, 'Provincia es requerida'),
    zipCode: z.string().min(1, 'Código postal es requerido'),
    country: z.string().default('Argentina'),
    observations: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
  })),
  paymentMethod: z.enum(['mercadopago', 'bank', 'cash']),
  shippingMethod: z.enum(['free', 'express', 'pickup']),
  totals: z.object({
    subtotal: z.number(),
    shipping: z.number(),
    discount: z.number().default(0),
    total: z.number(),
  }),
  orderNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = createOrderSchema.parse(body);
    
    // Generar ID único para la orden
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear objeto de orden
    const order = {
      id: orderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...validatedData,
      trackingNumber: null,
      estimatedDelivery: calculateEstimatedDelivery(validatedData.shippingMethod),
    };
    
    // En un entorno real, aquí guardarías en la base de datos
    // Por ahora, simularemos el guardado
    console.log('📦 Nueva orden creada:', {
      orderId: order.id,
      customer: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      total: order.totals.total,
      items: order.items.length,
      observations: order.shippingAddress.observations || 'Sin observaciones'
    });
    
    // Simular procesamiento de pago según el método
    let paymentStatus = 'pending';
    let paymentUrl = null;
    
    switch (validatedData.paymentMethod) {
      case 'mercadopago':
        // En un entorno real, aquí crearías la preferencia de MercadoPago
        paymentUrl = `https://mercadopago.com/checkout/${orderId}`;
        paymentStatus = 'pending';
        break;
      case 'bank':
        paymentStatus = 'awaiting_transfer';
        break;
      case 'cash':
        paymentStatus = 'cash_on_delivery';
        break;
    }
    
    const response = {
      success: true,
      data: {
        order: {
          ...order,
          paymentStatus,
          paymentUrl,
        }
      },
      message: 'Orden creada exitosamente'
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creando orden:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Función auxiliar para calcular fecha estimada de entrega
function calculateEstimatedDelivery(shippingMethod: string): string {
  const now = new Date();
  let daysToAdd = 7; // Por defecto 7 días
  
  switch (shippingMethod) {
    case 'express':
      daysToAdd = 2;
      break;
    case 'free':
      daysToAdd = 7;
      break;
    case 'pickup':
      daysToAdd = 1;
      break;
  }
  
  const estimatedDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return estimatedDate.toISOString();
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










