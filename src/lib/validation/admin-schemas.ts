// 🔧 Enterprise Validation Schemas

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export const ProductSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  price: z.number().positive('Precio debe ser positivo'),
  discounted_price: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  low_stock_threshold: z.number().int().min(0).optional(),
  category_id: z.string().uuid('ID de categoría inválido'),
  brand: z.string().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt_text: z.string().optional(),
    is_primary: z.boolean().default(false)
  })).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'draft']).default('draft')
});

export const ProductFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  price_min: z.coerce.number().positive().optional(),
  price_max: z.coerce.number().positive().optional(),
  sort_by: z.enum(['name', 'price', 'stock', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export const ProductParamsSchema = z.object({
  id: z.string().uuid('ID de producto inválido')
});

// Middleware de validación
export function withValidation(schema: z.ZodSchema) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        let data;
        
        if (request.method === 'GET') {
          // Validar query parameters
          const { searchParams } = new URL(request.url);
          data = Object.fromEntries(searchParams.entries());
          
          // Convertir tipos para números y booleans
          Object.keys(data).forEach(key => {
            if (data[key] === 'true') {data[key] = true;}
            else if (data[key] === 'false') {data[key] = false;}
            else if (!isNaN(Number(data[key])) && data[key] !== '') {
              data[key] = Number(data[key]);
            }
          });
        } else {
          // Validar body para POST/PUT
          data = await request.json();
        }

        const validationResult = schema.safeParse(data);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Datos de entrada inválidos',
              code: 'VALIDATION_ERROR',
              details: validationResult.error.errors,
              timestamp: new Date().toISOString(),
              path: request.url
            },
            { status: 422 }
          );
        }

        (request as any).validatedData = validationResult.data;
        return await handler(request, context);
      } catch (error) {
        console.error('Validation middleware error:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Error de validación',
            code: 'VALIDATION_MIDDLEWARE_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url
          },
          { status: 500 }
        );
      }
    };
  };
}









