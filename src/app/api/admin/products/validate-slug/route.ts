// 🔍 Enterprise Slug Validation API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { composeMiddlewares } from '@/lib/api/middleware-composer';
import { withErrorHandler, ValidationError } from '@/lib/api/error-handler';
import { withApiLogging } from '@/lib/api/api-logger';
import { withAdminAuth } from '@/lib/auth/api-auth-middleware';
import { withValidation } from '@/lib/validation/admin-schemas';

// Validation schema
const SlugValidationSchema = z.object({
  slug: z.string().min(1, 'Slug es requerido'),
  productId: z.string().uuid().optional()
});

/**
 * POST /api/admin/products/validate-slug
 * Validate if a product slug is unique
 */
const postHandler = async (request: NextRequest) => {
  const { supabase, validatedData } = request as any;
  const { slug, productId } = validatedData;

  // Check if slug exists
  let query = supabase
    .from('products')
    .select('id')
    .eq('slug', slug);

  // Exclude current product if editing
  if (productId) {
    query = query.neq('id', productId);
  }

  const { data: existingProducts, error } = await query.limit(1);

  if (error) {
    console.error('Error checking slug uniqueness:', error);
    throw new Error('Error al validar slug');
  }

  const isAvailable = !existingProducts || existingProducts.length === 0;

  return NextResponse.json({
    available: isAvailable,
    slug,
    message: isAvailable ? 'Slug disponible' : 'Slug ya está en uso',
    success: true
  });
};

// Apply enterprise middlewares and export handler
export const POST = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read']),
  withValidation(SlugValidationSchema)
)(postHandler);









