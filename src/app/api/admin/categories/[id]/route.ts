import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/integrations/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { checkRateLimit } from '@/lib/enterprise/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// CONFIGURACIÓN
// ===================================
const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
  },
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  slug: z.string().min(1, 'El slug es requerido').max(100, 'El slug es muy largo').optional(),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  image_url: z.string().url('URL de imagen inválida').optional().nullable(),
  parent_id: z.string().uuid('ID de categoría padre inválido').optional().nullable(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0, 'El orden debe ser positivo').optional(),
  meta_title: z.string().max(60, 'El meta título es muy largo').optional().nullable(),
  meta_description: z.string().max(160, 'La meta descripción es muy larga').optional().nullable(),
  meta_keywords: z.string().max(255, 'Las meta keywords son muy largas').optional().nullable(),
});

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  product_count: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at: string;
  updated_at: string;
  parent?: Category;
  children?: Category[];
}

interface CategoryStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  subcategories_count: number;
  avg_product_price: number;
  total_revenue: number;
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function getCategoryById(categoryId: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent:parent_id(
        id,
        name,
        slug
      ),
      children:categories!parent_id(
        id,
        name,
        slug,
        is_active,
        product_count
      )
    `)
    .eq('id', categoryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throw new Error(`Error obteniendo categoría: ${error.message}`);
  }

  return category;
}

async function updateCategory(categoryId: string, updateData: any, userId: string): Promise<Category> {
  const supabase = await createClient();

  // Verificar que la categoría existe
  const existingCategory = await getCategoryById(categoryId);
  if (!existingCategory) {
    throw new Error('Categoría no encontrada');
  }

  // Verificar slug único si se está actualizando
  if (updateData.slug && updateData.slug !== existingCategory.slug) {
    const { data: existingSlug } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', updateData.slug)
      .neq('id', categoryId)
      .single();

    if (existingSlug) {
      throw new Error('Ya existe una categoría con ese slug');
    }
  }

  // Verificar jerarquía circular si se está actualizando parent_id
  if (updateData.parent_id) {
    const isCircular = await checkCircularHierarchy(categoryId, updateData.parent_id);
    if (isCircular) {
      throw new Error('No se puede crear una jerarquía circular');
    }
  }

  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', categoryId)
    .select(`
      *,
      parent:parent_id(
        id,
        name,
        slug
      ),
      children:categories!parent_id(
        id,
        name,
        slug,
        is_active,
        product_count
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error actualizando categoría: ${error.message}`);
  }

  return updatedCategory;
}

async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Verificar que la categoría existe
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new Error('Categoría no encontrada');
  }

  // Verificar que no tenga productos
  if (category.product_count > 0) {
    throw new Error('No se puede eliminar una categoría que tiene productos');
  }

  // Verificar que no tenga subcategorías
  if (category.children && category.children.length > 0) {
    throw new Error('No se puede eliminar una categoría que tiene subcategorías');
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new Error(`Error eliminando categoría: ${error.message}`);
  }
}

async function getCategoryStats(categoryId: string): Promise<CategoryStats> {
  const supabase = await createClient();

  // Obtener estadísticas de productos
  const { data: productStats } = await supabase
    .from('products')
    .select('is_active, price')
    .eq('category_id', categoryId);

  // Obtener subcategorías
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId);

  // Calcular estadísticas
  const totalProducts = productStats?.length || 0;
  const activeProducts = productStats?.filter(p => p.is_active).length || 0;
  const inactiveProducts = totalProducts - activeProducts;
  const subcategoriesCount = subcategories?.length || 0;
  
  const prices = productStats?.map(p => p.price).filter(p => p > 0) || [];
  const avgProductPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  // TODO: Calcular revenue real desde orders
  const totalRevenue = 0;

  return {
    total_products: totalProducts,
    active_products: activeProducts,
    inactive_products: inactiveProducts,
    subcategories_count: subcategoriesCount,
    avg_product_price: avgProductPrice,
    total_revenue: totalRevenue
  };
}

async function checkCircularHierarchy(categoryId: string, parentId: string): Promise<boolean> {
  const supabase = await createClient();

  // Si el parent_id es el mismo categoryId, es circular
  if (categoryId === parentId) {
    return true;
  }

  // Buscar hacia arriba en la jerarquía
  let currentParentId = parentId;
  const visited = new Set<string>();

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);

    if (currentParentId === categoryId) {
      return true; // Encontramos una referencia circular
    }

    const { data: parent } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', currentParentId)
      .single();

    currentParentId = parent?.parent_id;
  }

  return false;
}

async function logAuditAction(action: string, categoryId: string, userId: string, details?: any): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('audit_logs').insert({
      table_name: 'categories',
      record_id: categoryId,
      action,
      user_id: userId,
      old_values: details?.oldValues || null,
      new_values: details?.newValues || details || null,
      ip_address: details?.ipAddress || null,
      user_agent: details?.userAgent || null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUDIT, 'Error registrando auditoría', { error, action, categoryId });
  }
}

// ===================================
// GET /api/admin/categories/[id] - Obtener categoría específica (Admin)
// ===================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin,
      'admin-categories-get'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      // Rate limit headers are handled internally
      return response;
    }

    // Verificar autenticación de admin
    const authResult = await requireAdminAuth(request, ['categories_read']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const categoryId = params.id;
    const url = new URL(request.url);
    const includeStats = url.searchParams.get('include_stats') === 'true';

    // Obtener categoría
    const category = await getCategoryById(categoryId);

    if (!category) {
      const notFoundResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Categoría no encontrada'
      };
      return NextResponse.json(notFoundResponse, { status: 404 });
    }

    // Obtener estadísticas si se solicitan
    let stats: CategoryStats | undefined;
    if (includeStats) {
      stats = await getCategoryStats(categoryId);
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id
    });

    const response: ApiResponse<Category & { stats?: CategoryStats }> = {
      data: {
        ...category,
        ...(stats && { stats })
      },
      success: true,
      message: 'Categoría obtenida exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    // Rate limit headers are handled internally
    return nextResponse;

  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/categories/[id]', { error, categoryId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// PUT /api/admin/categories/[id] - Actualizar categoría (Admin)
// ===================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas actualizaciones de categorías'
      },
      'admin-categories-update'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      // Rate limit headers are handled internally
      return response;
    }

    // Verificar autenticación de admin
    const authResult = await requireAdminAuth(request, ['categories_update']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const categoryId = params.id;
    const body = await request.json();
    
    // Validar datos de entrada
    const updateData = UpdateCategorySchema.parse(body);

    // Obtener categoría actual para auditoría
    const oldCategory = await getCategoryById(categoryId);
    if (!oldCategory) {
      const notFoundResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Categoría no encontrada'
      };
      return NextResponse.json(notFoundResponse, { status: 404 });
    }

    // Actualizar categoría
    const updatedCategory = await updateCategory(categoryId, updateData, authResult.user?.id!);

    // Registrar auditoría
    await logAuditAction('update', categoryId, authResult.user?.id!, {
      oldValues: oldCategory,
      newValues: updatedCategory,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id
    });

    const response: ApiResponse<Category> = {
      data: updatedCategory,
      success: true,
      message: 'Categoría actualizada exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    // Rate limit headers are handled internally
    return nextResponse;

  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/categories/[id]', { error, categoryId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'PUT',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// DELETE /api/admin/categories/[id] - Eliminar categoría (Admin)
// ===================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 4),
        message: 'Demasiadas eliminaciones de categorías'
      },
      'admin-categories-delete'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      // Rate limit headers are handled internally
      return response;
    }

    // Verificar autenticación de admin
    const authResult = await requireAdminAuth(request, ['categories_delete']);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }

    const categoryId = params.id;

    // Obtener categoría para auditoría
    const category = await getCategoryById(categoryId);
    if (!category) {
      const notFoundResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Categoría no encontrada'
      };
      return NextResponse.json(notFoundResponse, { status: 404 });
    }

    // Eliminar categoría
    await deleteCategory(categoryId, authResult.user?.id!);

    // Registrar auditoría
    await logAuditAction('delete', categoryId, authResult.user?.id!, {
      oldValues: category,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'DELETE',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id
    });

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Categoría eliminada exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    // Rate limit headers are handled internally
    return nextResponse;

  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en DELETE /api/admin/categories/[id]', { error, categoryId: params.id });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/[id]',
      method: 'DELETE',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}