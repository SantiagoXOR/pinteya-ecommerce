import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/enterprise/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// CONFIGURACIÓN
// ===================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 50,
    message: 'Demasiadas solicitudes de cupón'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const UpdateCouponSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']).optional(),
  discount_value: z.number().min(0).optional(),
  minimum_order_amount: z.number().min(0).optional(),
  maximum_discount_amount: z.number().min(0).optional(),
  usage_limit: z.number().int().min(1).optional(),
  usage_limit_per_user: z.number().int().min(1).optional(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().optional(),
  applicable_to: z.enum(['all', 'categories', 'products']).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  exclude_sale_items: z.boolean().optional(),
  first_time_customers_only: z.boolean().optional()
});

const CouponUsageSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'discount_amount', 'order_total']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().optional(),
  date_to: z.string().optional()
});

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CouponData {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  usage_count: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  applicable_to: 'all' | 'categories' | 'products';
  category_ids?: string[];
  product_ids?: string[];
  exclude_sale_items: boolean;
  first_time_customers_only: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: 'active' | 'inactive' | 'expired' | 'used_up';
  categories?: Array<{
    id: string;
    name: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
  creator?: {
    full_name: string;
    email: string;
  };
  usage_history?: Array<{
    id: string;
    user_id: string;
    order_id: string;
    discount_amount: number;
    order_total: number;
    created_at: string;
    user?: {
      full_name: string;
      email: string;
    };
    order?: {
      order_number: string;
      status: string;
    };
  }>;
}

interface CouponUsageData {
  id: string;
  user_id: string;
  order_id: string;
  discount_amount: number;
  order_total: number;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
  order: {
    order_number: string;
    status: string;
  };
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function validateAdminAuth() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'No autorizado', status: 401 };
  }

  // Verificar rol de administrador o manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!['admin', 'manager'].includes(profile?.role)) {
    return { error: 'Acceso denegado', status: 403 };
  }

  return { userId: session.user.id, role: profile.role };
}

async function getCouponById(couponId: string, includeUsage: boolean = false): Promise<CouponData> {
  const query = supabase
    .from('coupons')
    .select(`
      *,
      categories:coupon_categories!coupon_categories_coupon_id_fkey(
        category:categories!coupon_categories_category_id_fkey(
          id,
          name
        )
      ),
      products:coupon_products!coupon_products_coupon_id_fkey(
        product:products!coupon_products_product_id_fkey(
          id,
          name,
          sku
        )
      ),
      creator:profiles!coupons_created_by_fkey(
        full_name,
        email
      )
    `)
    .eq('id', couponId)
    .single();

  const { data: coupon, error } = await query;

  if (error || !coupon) {
    throw new Error('Cupón no encontrado');
  }

  // Calcular estado
  const now = new Date();
  const startsAt = new Date(coupon.starts_at);
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
  
  let status: 'active' | 'inactive' | 'expired' | 'used_up';
  
  if (!coupon.is_active) {
    status = 'inactive';
  } else if (now < startsAt) {
    status = 'inactive';
  } else if (expiresAt && now > expiresAt) {
    status = 'expired';
  } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    status = 'used_up';
  } else {
    status = 'active';
  }

  const processedCoupon: CouponData = {
    ...coupon,
    status,
    categories: coupon.categories?.map((cc: any) => cc.category) || [],
    products: coupon.products?.map((cp: any) => cp.product) || []
  };

  // Incluir historial de uso si se solicita
  if (includeUsage) {
    const { data: usageHistory } = await supabase
      .from('coupon_usage')
      .select(`
        *,
        user:profiles!coupon_usage_user_id_fkey(
          full_name,
          email
        ),
        order:orders!coupon_usage_order_id_fkey(
          order_number,
          status
        )
      `)
      .eq('coupon_id', couponId)
      .order('created_at', { ascending: false })
      .limit(50);

    processedCoupon.usage_history = usageHistory || [];
  }

  return processedCoupon;
}

async function updateCoupon(couponId: string, updateData: z.infer<typeof UpdateCouponSchema>, userId: string) {
  // Verificar que el cupón existe
  const existingCoupon = await getCouponById(couponId);

  // Validar fechas si se proporcionan
  if (updateData.starts_at || updateData.expires_at) {
    const startsAt = updateData.starts_at ? new Date(updateData.starts_at) : new Date(existingCoupon.starts_at);
    const expiresAt = updateData.expires_at ? new Date(updateData.expires_at) : 
                     (existingCoupon.expires_at ? new Date(existingCoupon.expires_at) : null);
    
    if (expiresAt && startsAt >= expiresAt) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de expiración');
    }
  }

  // Validar descuento si se proporciona
  if (updateData.type === 'percentage' && updateData.discount_value && updateData.discount_value > 100) {
    throw new Error('El descuento porcentual no puede ser mayor al 100%');
  }

  // Preparar datos de actualización
  const { category_ids, product_ids, ...couponUpdateData } = updateData;
  const finalUpdateData = {
    ...couponUpdateData,
    updated_at: new Date().toISOString()
  };

  // Actualizar cupón
  const { data: updatedCoupon, error: updateError } = await supabase
    .from('coupons')
    .update(finalUpdateData)
    .eq('id', couponId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error al actualizar cupón: ${updateError.message}`);
  }

  // Actualizar asociaciones de categorías si se proporcionan
  if (category_ids !== undefined) {
    // Eliminar asociaciones existentes
    await supabase
      .from('coupon_categories')
      .delete()
      .eq('coupon_id', couponId);

    // Crear nuevas asociaciones
    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map(categoryId => ({
        coupon_id: couponId,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('coupon_categories')
        .insert(categoryInserts);

      if (categoryError) {
        throw new Error(`Error al actualizar categorías: ${categoryError.message}`);
      }
    }
  }

  // Actualizar asociaciones de productos si se proporcionan
  if (product_ids !== undefined) {
    // Eliminar asociaciones existentes
    await supabase
      .from('coupon_products')
      .delete()
      .eq('coupon_id', couponId);

    // Crear nuevas asociaciones
    if (product_ids.length > 0) {
      const productInserts = product_ids.map(productId => ({
        coupon_id: couponId,
        product_id: productId
      }));

      const { error: productError } = await supabase
        .from('coupon_products')
        .insert(productInserts);

      if (productError) {
        throw new Error(`Error al actualizar productos: ${productError.message}`);
      }
    }
  }

  // Registrar auditoría
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: 'update',
      resource_type: 'coupon',
      resource_id: couponId,
      details: {
        updated_fields: Object.keys(updateData),
        old_values: existingCoupon,
        new_values: updateData
      },
      created_at: new Date().toISOString()
    });

  return updatedCoupon;
}

async function deleteCoupon(couponId: string, userId: string) {
  // Verificar que el cupón existe
  const existingCoupon = await getCouponById(couponId);

  // Verificar si el cupón ha sido usado
  const { count: usageCount } = await supabase
    .from('coupon_usage')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId);

  if (usageCount && usageCount > 0) {
    throw new Error('No se puede eliminar un cupón que ya ha sido utilizado. Considere desactivarlo en su lugar.');
  }

  // Eliminar asociaciones
  await supabase
    .from('coupon_categories')
    .delete()
    .eq('coupon_id', couponId);

  await supabase
    .from('coupon_products')
    .delete()
    .eq('coupon_id', couponId);

  // Eliminar cupón
  const { error: deleteError } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId);

  if (deleteError) {
    throw new Error(`Error al eliminar cupón: ${deleteError.message}`);
  }

  // Registrar auditoría
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: 'delete',
      resource_type: 'coupon',
      resource_id: couponId,
      details: {
        deleted_coupon: existingCoupon
      },
      created_at: new Date().toISOString()
    });

  return { success: true };
}

async function getCouponUsage(couponId: string, filters: z.infer<typeof CouponUsageSchema>) {
  let query = supabase
    .from('coupon_usage')
    .select(`
      *,
      user:profiles!coupon_usage_user_id_fkey(
        full_name,
        email
      ),
      order:orders!coupon_usage_order_id_fkey(
        order_number,
        status
      )
    `, { count: 'exact' })
    .eq('coupon_id', couponId);

  // Aplicar filtros de fecha
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // Contar total
  const { count } = await query.select('*', { count: 'exact', head: true });

  // Aplicar paginación y ordenamiento
  const offset = (filters.page - 1) * filters.limit;
  query = query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(offset, offset + filters.limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener historial de uso: ${error.message}`);
  }

  return {
    usage: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit)
  };
}

// ===================================
// GET - Obtener cupón específico
// ===================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message
      },
      'admin-coupon-detail'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const couponId = params.id;

    if (action === 'usage') {
      // Obtener historial de uso
      const filters = CouponUsageSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sort_by: searchParams.get('sort_by'),
        sort_order: searchParams.get('sort_order'),
        date_from: searchParams.get('date_from'),
        date_to: searchParams.get('date_to')
      });

      const { usage, total, totalPages } = await getCouponUsage(couponId, filters);

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/coupons/[id]',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<CouponUsageData[]> = {
        data: usage,
        success: true,
        message: 'Historial de uso obtenido exitosamente',
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages
        }
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    // Obtener cupón específico
    const includeUsage = searchParams.get('include_usage') === 'true';
    const coupon = await getCouponById(couponId, includeUsage);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<CouponData> = {
      data: coupon,
      success: true,
      message: 'Cupón obtenido exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/coupons/[id]', { error, couponId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'GET',
      statusCode: error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// ===================================
// PUT - Actualizar cupón
// ===================================
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas actualizaciones de cupón'
      },
      'admin-coupon-update'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Validar datos de entrada
    const body = await request.json();
    const updateData = UpdateCouponSchema.parse(body);
    const couponId = params.id;

    // Actualizar cupón
    const updatedCoupon = await updateCoupon(couponId, updateData, authResult.userId!);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<typeof updatedCoupon> = {
      data: updatedCoupon,
      success: true,
      message: 'Cupón actualizado exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/coupons/[id]', { error, couponId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'PUT',
      statusCode: error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// ===================================
// DELETE - Eliminar cupón
// ===================================
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 4),
        message: 'Demasiadas eliminaciones de cupón'
      },
      'admin-coupon-delete'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    const couponId = params.id;

    // Eliminar cupón
    const result = await deleteCoupon(couponId, authResult.userId!);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'DELETE',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<typeof result> = {
      data: result,
      success: true,
      message: 'Cupón eliminado exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en DELETE /api/admin/coupons/[id]', { error, couponId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons/[id]',
      method: 'DELETE',
      statusCode: error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Cupón no encontrado' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}