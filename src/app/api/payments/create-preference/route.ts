// ===================================
// PINTEYA E-COMMERCE - CREATE PAYMENT PREFERENCE API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CreatePreferencePayload } from '@/types/checkout';
import { ApiResponse } from '@/types/api';
import { preference } from '@/lib/mercadopago';
import type { MercadoPagoItem } from '@/lib/mercadopago';

interface Product {
  id: number;
  name: string;
  price: number;
  discounted_price?: number;
  images?: {
    previews: string[];
  };
  category?: {
    name: string;
    slug: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const orderData: CreatePreferencePayload = await request.json();
    const productIds = orderData.items.map(item => parseInt(item.id));
    const shippingCost = orderData.shipping?.cost || 0;

    // Obtener productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        discounted_price,
        images,
        category:categories (
          name,
          slug
        )
      `)
      .in('id', productIds);

    if (productsError || !products) {
      console.error('Error fetching products:', productsError);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error obteniendo productos',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const typedProducts = products as unknown as Product[];

    // Crear la orden en la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: 'demo-user-id', // TODO: Obtener de auth
        status: 'pending',
        shipping_cost: shippingCost,
        items_total: orderData.items.reduce((total, item) => {
          const product = products.find(p => p.id === parseInt(item.id));
          return total + ((product?.discounted_price || product?.price || 0) * item.quantity);
        }, 0),
        total: orderData.items.reduce((total, item) => {
          const product = products.find(p => p.id === parseInt(item.id));
          return total + ((product?.discounted_price || product?.price || 0) * item.quantity);
        }, 0) + shippingCost,
        shipping_address: orderData.shipping?.address,
        payer_email: orderData.payer.email,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error creando orden',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Crear items de la orden
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: parseInt(item.id),
      quantity: item.quantity,
      price: products.find(p => p.id === parseInt(item.id))?.discounted_price || 
             products.find(p => p.id === parseInt(item.id))?.price || 0,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: eliminar orden creada
      await supabase.from('orders').delete().eq('id', order.id);
      
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error creando items de orden',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Convertir items para MercadoPago
    const mercadoPagoItems: MercadoPagoItem[] = typedProducts.map((product) => {
      const orderItem = orderData.items.find(item => item.id === product.id.toString());
      return {
        id: product.id.toString(),
        title: product.name,
        description: `Producto de pinturería - ${product.category?.name || 'General'}`,
        picture_url: product.images?.previews?.[0] || '',
        category_id: product.category?.slug || 'general',
        quantity: orderItem?.quantity || 1,
        currency_id: 'ARS',
        unit_price: product.discounted_price || product.price,
      };
    });

    // Agregar costo de envío si existe
    if (shippingCost > 0) {
      mercadoPagoItems.push({
        id: 'shipping',
        title: 'Costo de envío',
        description: 'Envío a domicilio',
        category_id: 'shipping',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: shippingCost,
      });
    }

    // Crear preferencia de pago
    const preferenceResult = await preference.create({
      body: {
        items: mercadoPagoItems,
        payer: {
          name: orderData.payer.name,
          surname: orderData.payer.surname,
          email: orderData.payer.email,
          phone: orderData.payer.phone ? {
            area_code: orderData.payer.phone.substring(0, 3),
            number: orderData.payer.phone.substring(3),
          } : undefined,
          identification: orderData.payer.identification,
          address: orderData.shipping ? {
            street_name: orderData.shipping.address.street_name,
            street_number: orderData.shipping.address.street_number,
            zip_code: orderData.shipping.address.zip_code,
          } : undefined,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${order.id}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?order_id=${order.id}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?order_id=${order.id}`,
        },
        auto_return: 'approved',
        external_reference: order.id.toString(),
        shipments: orderData.shipping ? {
          cost: orderData.shipping.cost,
          receiver_address: {
            zip_code: orderData.shipping.address.zip_code,
            street_name: orderData.shipping.address.street_name,
            street_number: orderData.shipping.address.street_number,
            city_name: orderData.shipping.address.city_name,
            state_name: orderData.shipping.address.state_name,
          },
        } : undefined,
      },
    });

    // Actualizar orden con ID de preferencia
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_preference_id: preferenceResult.id,
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order with preference ID:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        init_point: preferenceResult.init_point,
        preference_id: preferenceResult.id,
      },
    });

  } catch (error) {
    console.error('Error en create-preference:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 });
  }
}
