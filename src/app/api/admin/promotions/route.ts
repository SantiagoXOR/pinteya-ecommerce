// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
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
    maxRequests: 100,
    message: 'Demasiadas solicitudes de promociones'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const PromotionFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'scheduled', 'expired', 'paused']).optional(),
  type: z.enum(['percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_shipping', 'bundle_deal']).optional(),
  category_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'name', 'priority', 'starts_at', 'ends_at', 'usage_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const CreatePromotionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  type: z.enum(['percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_shipping', 'bundle_deal']),
  priority: z.number().int().min(1).max(100).default(50),
  
  // Configuración de descuento
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  
  // Configuración Buy X Get Y
  buy_quantity: z.number().int().min(1).optional(),
  get_quantity: z.number().int().min(1).optional(),
  get_discount_percentage: z.number().min(0).max(100).optional(),
  
  // Configuración de bundle
  bundle_products: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1)
  })).optional(),
  bundle_price: z.number().min(0).optional(),
  
  // Condiciones
  minimum_order_amount: z.number().min(0).optional(),
  maximum_discount_amount: z.number().min(0).optional(),
  minimum_quantity: z.number().int().min(1).optional(),
  
  // Aplicabilidad
  applicable_to: z.enum(['all', 'categories', 'products', 'brands']).default('all'),
  category_ids: z.array(z.string().uuid()).optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  brand_ids: z.array(z.string().uuid()).optional(),
  
  // Exclusiones
  exclude_sale_items: z.boolean().default(false),
  exclude_categories: z.array(z.string().uuid()).optional(),
  exclude_products: z.array(z.string().uuid()).optional(),
  
  // Límites de uso
  usage_limit: z.number().int().min(1).optional(),
  usage_limit_per_user: z.number().int().min(1).optional(),
  
  // Fechas
  starts_at: z.string(),
  ends_at: z.string().optional(),
  
  // Configuración
  is_active: z.boolean().default(true),
  is_stackable: z.boolean().default(false),
  requires_coupon_code: z.boolean().default(false),
  coupon_code: z.string().optional(),
  
  // Targeting
  customer_groups: z.array(z.string()).optional(),
  first_time_customers_only: z.boolean().default(false),
  
  // Display
  banner_text: z.string().optional(),
  banner_color: z.string().optional(),
  show_on_product_page: z.boolean().default(true),
  show_on_category_page: z.boolean().default(true),
  show_on_homepage: z.boolean().default(false)
});

const UpdatePromotionSchema = CreatePromotionSchema.partial();

const BulkPromotionActionSchema = z.object({
  promotion_ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['activate', 'deactivate', 'pause', 'resume', 'delete', 'extend']),
  extend_days: z.number().int().min(1).optional()
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

interface PromotionData {
  id: string;
  name: string;
  description?: string;
  type: 'percentage_discount' | 'fixed_discount' | 'buy_x_get_y' | 'free_shipping' | 'bundle_deal';
  priority: number;
  
  // Configuración de descuento
  discount_percentage?: number;
  discount_amount?: number;
  
  // Configuración Buy X Get Y
  buy_quantity?: number;
  get_quantity?: number;
  get_discount_percentage?: number;
  
  // Configuración de bundle
  bundle_products?: Array<{
    product_id: string;
    quantity: number;
    product?: {
      name: string;
      sku: string;
      price: number;
    };
  }>;
  bundle_price?: number;
  
  // Condiciones
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  minimum_quantity?: number;
  
  // Aplicabilidad
  applicable_to: 'all' | 'categories' | 'products' | 'brands';
  category_ids?: string[];
  product_ids?: string[];
  brand_ids?: string[];
  
  // Exclusiones
  exclude_sale_items: boolean;
  exclude_categories?: string[];
  exclude_products?: string[];
  
  // Límites de uso
  usage_limit?: number;
  usage_limit_per_user?: number;
  usage_count: number;
  
  // Fechas
  starts_at: string;
  ends_at?: string;
  
  // Configuración
  is_active: boolean;
  is_stackable: boolean;
  requires_coupon_code: boolean;
  coupon_code?: string;
  
  // Targeting
  customer_groups?: string[];
  first_time_customers_only: boolean;
  
  // Display
  banner_text?: string;
  banner_color?: string;
  show_on_product_page: boolean;
  show_on_category_page: boolean;
  show_on_homepage: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Estado calculado
  status: 'active' | 'inactive' | 'scheduled' | 'expired' | 'paused';
  
  // Relaciones
  categories?: Array<{
    id: string;
    name: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
  brands?: Array<{
    id: string;
    name: string;
  }>;
  creator?: {
    full_name: string;
    email: string;
  };
}

interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  scheduled_promotions: number;
  expired_promotions: number;
  paused_promotions: number;
  total_usage: number;
  total_discount_given: number;
  average_discount: number;
  conversion_rate: number;
  top_promotions: Array<{
    id: string;
    name: string;
    type: string;
    usage_count: number;
    total_discount: number;
    conversion_rate: number;
  }>;
  usage_by_type: Record<string, number>;
  performance_metrics: {
    last_24h: {
      usage: number;
      discount_given: number;
      orders_affected: number;
    };
    last_7d: {
      usage: number;
      discount_given: number;
      orders_affected: number;
    };
    last_30d: {
      usage: number;
      discount_given: number;
      orders_affected: number;
    };
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

async function getPromotions(filters: z.infer<typeof PromotionFiltersSchema>) {
  let query = supabase
    .from('promotions')
    .select(`
      *,
      categories:promotion_categories!promotion_categories_promotion_id_fkey(
        category:categories!promotion_categories_category_id_fkey(
          id,
          name
        )
      ),
      products:promotion_products!promotion_products_promotion_id_fkey(
        product:products!promotion_products_product_id_fkey(
          id,
          name,
          sku
        )
      ),
      brands:promotion_brands!promotion_brands_promotion_id_fkey(
        brand:brands!promotion_brands_brand_id_fkey(
          id,
          name
        )
      ),
      creator:profiles!promotions_created_by_fkey(
        full_name,
        email
      )
    `);

  // Aplicar filtros
  if (filters.status) {
    const now = new Date().toISOString();
    switch (filters.status) {
      case 'active':
        query = query
          .eq('is_active', true)
          .lte('starts_at', now)
          .or(`ends_at.is.null,ends_at.gt.${now}`);
        break;
      case 'inactive':
        query = query.eq('is_active', false);
        break;
      case 'scheduled':
        query = query
          .eq('is_active', true)
          .gt('starts_at', now);
        break;
      case 'expired':
        query = query
          .eq('is_active', true)
          .not('ends_at', 'is', null)
          .lt('ends_at', now);
        break;
      case 'paused':
        query = query.eq('is_paused', true);
        break;
    }
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,banner_text.ilike.%${filters.search}%`);
  }

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
    throw new Error(`Error al obtener promociones: ${error.message}`);
  }

  // Procesar datos para incluir estado calculado
  const processedData = (data || []).map(promotion => {
    const now = new Date();
    const startsAt = new Date(promotion.starts_at);
    const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;
    
    let status: 'active' | 'inactive' | 'scheduled' | 'expired' | 'paused';
    
    if (promotion.is_paused) {
      status = 'paused';
    } else if (!promotion.is_active) {
      status = 'inactive';
    } else if (now < startsAt) {
      status = 'scheduled';
    } else if (endsAt && now > endsAt) {
      status = 'expired';
    } else {
      status = 'active';
    }

    return {
      ...promotion,
      status,
      categories: promotion.categories?.map((pc: any) => pc.category) || [],
      products: promotion.products?.map((pp: any) => pp.product) || [],
      brands: promotion.brands?.map((pb: any) => pb.brand) || []
    };
  });

  return {
    promotions: processedData,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit)
  };
}

async function createPromotion(promotionData: z.infer<typeof CreatePromotionSchema>, userId: string) {
  // Validar fechas
  const startsAt = new Date(promotionData.starts_at);
  const endsAt = promotionData.ends_at ? new Date(promotionData.ends_at) : null;
  
  if (endsAt && startsAt >= endsAt) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de finalización');
  }

  // Validar configuración según el tipo
  switch (promotionData.type) {
    case 'percentage_discount':
      if (!promotionData.discount_percentage) {
        throw new Error('El porcentaje de descuento es requerido para este tipo de promoción');
      }
      break;
    case 'fixed_discount':
      if (!promotionData.discount_amount) {
        throw new Error('El monto de descuento es requerido para este tipo de promoción');
      }
      break;
    case 'buy_x_get_y':
      if (!promotionData.buy_quantity || !promotionData.get_quantity) {
        throw new Error('Las cantidades de compra y obsequio son requeridas para este tipo de promoción');
      }
      break;
    case 'bundle_deal':
      if (!promotionData.bundle_products?.length || !promotionData.bundle_price) {
        throw new Error('Los productos del bundle y el precio son requeridos para este tipo de promoción');
      }
      break;
  }

  // Validar código de cupón si es requerido
  if (promotionData.requires_coupon_code) {
    if (!promotionData.coupon_code) {
      throw new Error('El código de cupón es requerido cuando se habilita esta opción');
    }
    
    // Verificar que el código no exista
    const { data: existingPromotion } = await supabase
      .from('promotions')
      .select('id')
      .eq('coupon_code', promotionData.coupon_code)
      .single();

    if (existingPromotion) {
      throw new Error('Ya existe una promoción con este código de cupón');
    }
  }

  // Preparar datos para inserción
  const { category_ids, product_ids, brand_ids, bundle_products, ...promotionInsertData } = promotionData;
  
  // Crear promoción
  const { data: newPromotion, error: promotionError } = await supabase
    .from('promotions')
    .insert({
      ...promotionInsertData,
      usage_count: 0,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (promotionError) {
    throw new Error(`Error al crear promoción: ${promotionError.message}`);
  }

  // Asociar categorías si aplica
  if (promotionData.applicable_to === 'categories' && category_ids?.length) {
    const categoryInserts = category_ids.map(categoryId => ({
      promotion_id: newPromotion.id,
      category_id: categoryId
    }));

    const { error: categoryError } = await supabase
      .from('promotion_categories')
      .insert(categoryInserts);

    if (categoryError) {
      throw new Error(`Error al asociar categorías: ${categoryError.message}`);
    }
  }

  // Asociar productos si aplica
  if (promotionData.applicable_to === 'products' && product_ids?.length) {
    const productInserts = product_ids.map(productId => ({
      promotion_id: newPromotion.id,
      product_id: productId
    }));

    const { error: productError } = await supabase
      .from('promotion_products')
      .insert(productInserts);

    if (productError) {
      throw new Error(`Error al asociar productos: ${productError.message}`);
    }
  }

  // Asociar marcas si aplica
  if (promotionData.applicable_to === 'brands' && brand_ids?.length) {
    const brandInserts = brand_ids.map(brandId => ({
      promotion_id: newPromotion.id,
      brand_id: brandId
    }));

    const { error: brandError } = await supabase
      .from('promotion_brands')
      .insert(brandInserts);

    if (brandError) {
      throw new Error(`Error al asociar marcas: ${brandError.message}`);
    }
  }

  // Crear productos del bundle si aplica
  if (promotionData.type === 'bundle_deal' && bundle_products?.length) {
    const bundleInserts = bundle_products.map(item => ({
      promotion_id: newPromotion.id,
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const { error: bundleError } = await supabase
      .from('promotion_bundle_products')
      .insert(bundleInserts);

    if (bundleError) {
      throw new Error(`Error al crear bundle de productos: ${bundleError.message}`);
    }
  }

  return newPromotion;
}

async function getPromotionStats(): Promise<PromotionStats> {
  // Obtener todas las promociones
  const { data: promotions, error } = await supabase
    .from('promotions')
    .select('*');

  if (error) {
    throw new Error(`Error al obtener estadísticas de promociones: ${error.message}`);
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Obtener uso de promociones
  const { data: usage } = await supabase
    .from('promotion_usage')
    .select('*');

  const totalPromotions = promotions?.length || 0;
  let activePromotions = 0;
  let scheduledPromotions = 0;
  let expiredPromotions = 0;
  let pausedPromotions = 0;

  // Clasificar promociones por estado
  (promotions || []).forEach(promotion => {
    const startsAt = new Date(promotion.starts_at);
    const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;
    
    if (promotion.is_paused) {
      pausedPromotions++;
    } else if (!promotion.is_active) {
      
    } else if (now < startsAt) {
      scheduledPromotions++;
    } else if (endsAt && now > endsAt) {
      expiredPromotions++;
    } else {
      activePromotions++;
    }
  });

  // Estadísticas de uso
  const totalUsage = (usage || []).length;
  const totalDiscountGiven = (usage || []).reduce((sum, u) => sum + (u.discount_amount || 0), 0);
  const averageDiscount = totalUsage > 0 ? totalDiscountGiven / totalUsage : 0;

  // Calcular tasa de conversión (simplificada)
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last30d.toISOString());

  const ordersWithPromotions = (usage || []).filter(u => 
    new Date(u.created_at) >= last30d
  ).length;

  const conversionRate = totalOrders ? (ordersWithPromotions / totalOrders) * 100 : 0;

  // Métricas de rendimiento
  const performanceMetrics = {
    last_24h: {
      usage: (usage || []).filter(u => new Date(u.created_at) >= last24h).length,
      discount_given: (usage || []).filter(u => new Date(u.created_at) >= last24h)
        .reduce((sum, u) => sum + (u.discount_amount || 0), 0),
      orders_affected: new Set((usage || []).filter(u => new Date(u.created_at) >= last24h)
        .map(u => u.order_id)).size
    },
    last_7d: {
      usage: (usage || []).filter(u => new Date(u.created_at) >= last7d).length,
      discount_given: (usage || []).filter(u => new Date(u.created_at) >= last7d)
        .reduce((sum, u) => sum + (u.discount_amount || 0), 0),
      orders_affected: new Set((usage || []).filter(u => new Date(u.created_at) >= last7d)
        .map(u => u.order_id)).size
    },
    last_30d: {
      usage: (usage || []).filter(u => new Date(u.created_at) >= last30d).length,
      discount_given: (usage || []).filter(u => new Date(u.created_at) >= last30d)
        .reduce((sum, u) => sum + (u.discount_amount || 0), 0),
      orders_affected: new Set((usage || []).filter(u => new Date(u.created_at) >= last30d)
        .map(u => u.order_id)).size
    }
  };

  // Top promociones
  const promotionUsageMap = (usage || []).reduce((acc, u) => {
    if (!acc[u.promotion_id]) {
      acc[u.promotion_id] = { count: 0, totalDiscount: 0, orders: new Set() };
    }
    acc[u.promotion_id].count++;
    acc[u.promotion_id].totalDiscount += u.discount_amount || 0;
    acc[u.promotion_id].orders.add(u.order_id);
    return acc;
  }, {} as Record<string, { count: number; totalDiscount: number; orders: Set<string> }>);

  const topPromotions = Object.entries(promotionUsageMap)
    .map(([promotionId, stats]) => {
      const promotion = promotions?.find(p => p.id === promotionId);
      return {
        id: promotionId,
        name: promotion?.name || '',
        type: promotion?.type || '',
        usage_count: stats.count,
        total_discount: stats.totalDiscount,
        conversion_rate: stats.orders.size > 0 ? (stats.count / stats.orders.size) * 100 : 0
      };
    })
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);

  // Uso por tipo
  const usageByType = (promotions || []).reduce((acc, promotion) => {
    acc[promotion.type] = (acc[promotion.type] || 0) + promotion.usage_count;
    return acc;
  }, {} as Record<string, number>);

  return {
    total_promotions: totalPromotions,
    active_promotions: activePromotions,
    scheduled_promotions: scheduledPromotions,
    expired_promotions: expiredPromotions,
    paused_promotions: pausedPromotions,
    total_usage: totalUsage,
    total_discount_given: totalDiscountGiven,
    average_discount: averageDiscount,
    conversion_rate: conversionRate,
    top_promotions: topPromotions,
    usage_by_type: usageByType,
    performance_metrics: performanceMetrics
  };
}

// ===================================
// GET - Obtener promociones
// ===================================
export async function GET(request: NextRequest) {
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
      'admin-promotions'
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

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Manejar diferentes acciones
    if (action === 'stats') {
      // Obtener estadísticas
      const stats = await getPromotionStats();

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/promotions',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<PromotionStats> = {
        data: stats,
        success: true,
        message: 'Estadísticas de promociones obtenidas exitosamente'
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    // Obtener promociones normales
    const filters = PromotionFiltersSchema.parse({
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      category_id: searchParams.get('category_id'),
      product_id: searchParams.get('product_id'),
      search: searchParams.get('search'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    });

    const { promotions, total, totalPages } = await getPromotions(filters);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<PromotionData[]> = {
      data: promotions,
      success: true,
      message: 'Promociones obtenidas exitosamente',
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

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/promotions', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST - Crear promoción o acción masiva
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas operaciones de promociones'
      },
      'admin-promotions-modify'
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
    const { action } = body;

    if (action === 'bulk') {
      // Acción masiva
      const bulkAction = BulkPromotionActionSchema.parse(body);
      const results = [];

      for (const promotionId of bulkAction.promotion_ids) {
        try {
          const updateData: any = { updated_at: new Date().toISOString() };

          switch (bulkAction.action) {
            case 'activate':
              updateData.is_active = true;
              updateData.is_paused = false;
              break;
            case 'deactivate':
              updateData.is_active = false;
              break;
            case 'pause':
              updateData.is_paused = true;
              break;
            case 'resume':
              updateData.is_paused = false;
              break;
            case 'extend':
              if (bulkAction.extend_days) {
                const { data: promotion } = await supabase
                  .from('promotions')
                  .select('ends_at')
                  .eq('id', promotionId)
                  .single();
                
                if (promotion?.ends_at) {
                  const newEndDate = new Date(promotion.ends_at);
                  newEndDate.setDate(newEndDate.getDate() + bulkAction.extend_days);
                  updateData.ends_at = newEndDate.toISOString();
                }
              }
              break;
            case 'delete':
              const { error: deleteError } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promotionId);
              
              if (deleteError) {throw deleteError;}
              results.push({ promotion_id: promotionId, success: true, action: 'deleted' });
              continue;
          }

          if (bulkAction.action !== 'delete') {
            const { error: updateError } = await supabase
              .from('promotions')
              .update(updateData)
              .eq('id', promotionId);
            
            if (updateError) {throw updateError;}
          }

          results.push({ promotion_id: promotionId, success: true, action: bulkAction.action });
        } catch (error) {
          results.push({ 
            promotion_id: promotionId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/promotions',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<typeof results> = {
        data: results,
        success: true,
        message: `Acción masiva completada. ${results.filter(r => r.success).length}/${results.length} exitosos`
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    // Crear promoción normal
    const promotionData = CreatePromotionSchema.parse(body);
    const newPromotion = await createPromotion(promotionData, authResult.userId!);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<typeof newPromotion> = {
      data: newPromotion,
      success: true,
      message: 'Promoción creada exitosamente'
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/promotions', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}










