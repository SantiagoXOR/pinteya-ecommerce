// ===================================
// PINTEYA E-COMMERCE - ORDERS API FUNCTIONS
// ===================================

import { ApiResponse } from '@/types/api';
import { CreateOrderRequest } from '@/types/mercadopago';
import { safeApiResponseJson } from '@/lib/json-utils';

/**
 * Crea una nueva orden y preferencia de pago
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    // Usar parsing seguro de JSON
    const parseResult = await safeApiResponseJson<ApiResponse<any>>(response);

    if (!parseResult.success) {
      return {
        data: null,
        success: false,
        error: parseResult.error || 'Error parsing API response',
      };
    }

    const result = parseResult.data;

    if (!response.ok) {
      return {
        data: null,
        success: false,
        error: result?.error || 'Error creando orden',
      };
    }

    if (!result) {
      return {
        data: null,
        success: false,
        error: 'Error: respuesta nula del servidor',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error creating order:', error);
    return {
      data: null,
      success: false,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Obtiene el estado de una orden y su pago
 */
export async function getOrderStatus(orderId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/payments/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        success: false,
        error: result?.error || 'Error obteniendo estado de orden',
      };
    }

    if (!result) {
      return {
        data: null,
        success: false,
        error: 'Error: respuesta nula del servidor',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error getting order status:', error);
    return {
      data: null,
      success: false,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Actualiza el estado de una orden después de redirección de MercadoPago
 */
export async function updateOrderStatus(
  orderId: string, 
  paymentData: {
    payment_id?: string;
    status?: string;
    merchant_order_id?: string;
  }
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/payments/status/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        success: false,
        error: result?.error || 'Error actualizando estado de orden',
      };
    }

    if (!result) {
      return {
        data: null,
        success: false,
        error: 'Error: respuesta nula del servidor',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return {
      data: null,
      success: false,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Obtiene todas las órdenes del usuario autenticado
 */
export async function getUserOrders(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: [],
        success: false,
        error: result?.error || 'Error obteniendo órdenes',
      };
    }

    if (!result) {
      return {
        data: [],
        success: false,
        error: 'Error: respuesta nula del servidor',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error getting user orders:', error);
    return {
      data: [],
      success: false,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Obtiene una orden específica del usuario
 */
export async function getUserOrder(orderId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        success: false,
        error: result?.error || 'Error obteniendo orden',
      };
    }

    if (!result) {
      return {
        data: null,
        success: false,
        error: 'Error: respuesta nula del servidor',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Error getting user order:', error);
    return {
      data: null,
      success: false,
      error: error.message || 'Error de conexión',
    };
  }
}

/**
 * Convierte items del carrito al formato requerido para crear orden
 */
export function convertCartToOrderItems(cartItems: any[]): CreateOrderRequest['items'] {
  return cartItems.map(item => ({
    id: item.id.toString(),
    name: item.name,
    price: item.discounted_price || item.price,
    quantity: item.quantity,
    image: item.images?.previews?.[0] || '',
  }));
}

/**
 * Calcula el total de una orden
 */
export function calculateOrderTotal(items: CreateOrderRequest['items'], shippingCost: number = 0): number {
  const itemsTotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  return itemsTotal + shippingCost;
}

/**
 * Valida los datos de una orden antes de enviarla
 */
export function validateOrderData(orderData: CreateOrderRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar items
  if (!orderData.items || orderData.items.length === 0) {
    errors.push('La orden debe tener al menos un producto');
  }

  orderData.items.forEach((item, index) => {
    if (!item.id || !item.name) {
      errors.push(`Producto ${index + 1}: ID y nombre son requeridos`);
    }
    if (item.price <= 0) {
      errors.push(`Producto ${index + 1}: El precio debe ser mayor a 0`);
    }
    if (item.quantity <= 0) {
      errors.push(`Producto ${index + 1}: La cantidad debe ser mayor a 0`);
    }
  });

  // Validar payer
  if (!orderData.payer.name || !orderData.payer.surname) {
    errors.push('Nombre y apellido del comprador son requeridos');
  }
  if (!orderData.payer.email) {
    errors.push('Email del comprador es requerido');
  }

  // Validar email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (orderData.payer.email && !emailRegex.test(orderData.payer.email)) {
    errors.push('El formato del email no es válido');
  }

  // Validar shipping si está presente
  if (orderData.shipping) {
    if (!orderData.shipping.address.street_name || !orderData.shipping.address.city_name) {
      errors.push('Dirección de envío incompleta');
    }
    if (!orderData.shipping.address.zip_code) {
      errors.push('Código postal es requerido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formatea el estado de una orden para mostrar al usuario
 */
export function formatOrderStatus(status: string): { label: string; color: string; description: string } {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pending: {
      label: 'Pendiente',
      color: 'yellow',
      description: 'Esperando confirmación de pago',
    },
    paid: {
      label: 'Pagado',
      color: 'green',
      description: 'Pago confirmado, preparando envío',
    },
    shipped: {
      label: 'Enviado',
      color: 'blue',
      description: 'Producto en camino',
    },
    delivered: {
      label: 'Entregado',
      color: 'green',
      description: 'Producto entregado exitosamente',
    },
    cancelled: {
      label: 'Cancelado',
      color: 'red',
      description: 'Orden cancelada',
    },
    refunded: {
      label: 'Reembolsado',
      color: 'gray',
      description: 'Pago reembolsado',
    },
  };

  return statusMap[status] || {
    label: 'Desconocido',
    color: 'gray',
    description: 'Estado no reconocido',
  };
}
