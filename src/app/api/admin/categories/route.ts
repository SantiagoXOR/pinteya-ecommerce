// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - ADMIN CATEGORIES API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { checkRateLimit } from '@/lib/enterprise/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';
import { ApiResponse } from '@/types/api';
import { Category } from '@/types/database';

// ===================================
// CONFIGURACIÓN
// ===================================
const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Demasiadas solicitudes de categorías'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const CategoryFiltersSchema = z.object({
  search: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  level: z.coerce.number().int().min(0).max(5).optional(),
  has_products: z.boolean().optional(),
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'product_count', 'order_index']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  slug: z.string().min(1, 'El slug es requerido').max(100, 'El slug es muy largo').regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  parent_id: z.string().uuid().optional(),
  
  // SEO
  meta_title: z.string().max(60, 'El meta título es muy largo').optional(),
  meta_description: z.string().max(160, 'La meta descripción es muy larga').optional(),
  meta_keywords: z.array(z.string()).max(10, 'Máximo 10 palabras clave').optional(),
  
  // Imagen
  image_url: z.string().url('URL de imagen inválida').optional(),
  image_alt: z.string().max(100, 'El texto alternativo es muy largo').optional(),
  
  // Configuración
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  show_in_menu: z.boolean().default(true),
  order_index: z.number().int().min(0).default(0)
});

const BulkCategoryActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete', 'move', 'reorder']),
  category_ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una categoría').max(50, 'Máximo 50 categorías por operación'),
  
  // Para move
  new_parent_id: z.string().uuid().optional(),
  
  // Para reorder
  order_updates: z.array(z.object({
    category_id: z.string().uuid(),
    order_index: z.number().int().min(0)
  })).optional()
});

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function getCategoriesWithStats(filters: z.infer<typeof CategoryFiltersSchema>) {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  let query = supabase
    .from('categories')
    .select('*', { count: 'exact' });

  // Aplicar filtros
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
  }

  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', filters.parent_id);
    }
  }

  // Filtros deshabilitados temporalmente hasta que se agreguen las columnas necesarias
  // if (filters.is_active !== undefined) {
  //   query = query.eq('is_active', filters.is_active);
  // }

  // if (filters.level !== undefined) {
  //   query = query.eq('level', filters.level);
  // }

  // if (filters.has_products !== undefined) {
  //   if (filters.has_products) {
  //     query = query.gt('products_count', 0);
  //   } else {
  //     query = query.eq('products_count', 0);
  //   }
  // }

  // Ordenamiento - usando solo columnas que existen
  const validSortColumns = ['name', 'created_at', 'updated_at'];
  const sortBy = validSortColumns.includes(filters.sort_by) ? filters.sort_by : 'name';
  query = query.order(sortBy, { ascending: filters.sort_order === 'asc' });

  // Paginación
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  query = query.range(from, to);

  const { data: categories, error, count } = await query;

  if (error) {
    throw new Error(`Error al obtener categorías: ${error.message}`);
  }

  // Procesar datos
  const processedCategories = (categories || []).map(category => ({
    ...category,
    children: category.children || [],
    products_count: category.products_count?.[0]?.count || 0,
    meta_keywords: category.meta_keywords ? JSON.parse(category.meta_keywords) : []
  }));

  return {
    categories: processedCategories,
    total: count || 0,
    page: filters.page,
    limit: filters.limit,
    pages: Math.ceil((count || 0) / filters.limit)
  };
}

async function createCategory(categoryData: z.infer<typeof CreateCategorySchema>, userId: string) {
  const supabase = getSupabaseClient(true);
  
  if (!supabase) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  // Verificar que el slug sea único
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categoryData.slug)
    .single();

  if (existingCategory) {
    throw new Error('Ya existe una categoría con este slug');
  }

  // Calcular nivel y path si tiene padre
  let level = 0;
  let path = categoryData.slug;
  
  if (categoryData.parent_id) {
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('level, path')
      .eq('id', categoryData.parent_id)
      .single();

    if (parentError || !parentCategory) {
      throw new Error('Categoría padre no encontrada');
    }

    level = parentCategory.level + 1;
    path = `${parentCategory.path}/${categoryData.slug}`;

    // Verificar profundidad máxima
    if (level > 5) {
      throw new Error('Profundidad máxima de categorías excedida (5 niveles)');
    }
  }

  // Preparar datos para inserción
  const insertData = {
    ...categoryData,
    level,
    path,
    meta_keywords: categoryData.meta_keywords ? JSON.stringify(categoryData.meta_keywords) : null,
    product_count: 0,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: newCategory, error: insertError } = await supabase
    .from('categories')
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error al crear categoría: ${insertError.message}`);
  }

  return newCategory;
}

async function logAuditAction(action: string, categoryId: string, userId: string, details?: any) {
  try {
    const supabase = getSupabaseClient(true);
    if (supabase) {
      await supabase.from('audit_logs').insert({
        table_name: 'categories',
        record_id: categoryId,
        action,
        user_id: userId,
        changes: details,
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.log(LogLevel.WARN, LogCategory.AUDIT, 'Error al registrar auditoría', { error });
  }
}

// ===================================
// GET /api/admin/categories - Obtener categorías (Admin)
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
      'admin-categories'
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

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url);
    const rawFilters = {
      search: searchParams.get('search') || undefined,
      parent_id: searchParams.get('parent_id') || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      level: searchParams.get('level') || undefined,
      has_products: searchParams.get('has_products') ? searchParams.get('has_products') === 'true' : undefined,
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: searchParams.get('sort_order') || 'asc',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20
    };
    const filters = CategoryFiltersSchema.parse(rawFilters);

    // Obtener categorías
    const result = await getCategoriesWithStats(filters);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id
    });

    const response: ApiResponse<{
      categories: Category[];
      total: number;
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }> = {
      data: {
        categories: result.categories,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
          hasNext: result.page < result.pages,
          hasPrev: result.page > 1
        }
      },
      success: true,
      message: `${result.categories.length} categorías encontradas`,
    };

    const nextResponse = NextResponse.json(response);
    // Rate limit headers are handled internally
    return nextResponse;

  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/categories', { 
      error: error.message
    });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error'
    });
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST /api/admin/categories - Crear categoría o operaciones masivas (Admin)
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
        message: 'Demasiadas creaciones de categorías'
      },
      'admin-categories-create'
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
    const authResult = await requireAdminAuth(request, ['categories_create']);

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

    const body = await request.json();
    const { operation } = body;

    if (operation === 'bulk') {
      // Operación masiva
      const bulkData = BulkCategoryActionSchema.parse(body);
      const supabase = getSupabaseClient(true);
      
      if (!supabase) {
        throw new Error('Cliente administrativo de Supabase no disponible');
      }
      
      // Implementar operaciones masivas
      let updateData: any = {};
      
      switch (bulkData.action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'feature':
          updateData = { is_featured: true };
          break;
        case 'unfeature':
          updateData = { is_featured: false };
          break;
        case 'delete':
          // Verificar que las categorías no tengan productos
          const { data: categoriesWithProducts } = await supabase
            .from('categories')
            .select('id, name, product_count')
            .in('id', bulkData.category_ids)
            .gt('product_count', 0);

          if (categoriesWithProducts && categoriesWithProducts.length > 0) {
            throw new Error(`No se pueden eliminar categorías con productos: ${categoriesWithProducts.map(c => c.name).join(', ')}`);
          }

          const { data: deletedCategories, error: deleteError } = await supabase
            .from('categories')
            .delete()
            .in('id', bulkData.category_ids)
            .select();

          if (deleteError) {
            throw new Error(`Error eliminando categorías: ${deleteError.message}`);
          }

          // Registrar auditoría para cada categoría eliminada
          for (const categoryId of bulkData.category_ids) {
            await logAuditAction('bulk_delete', categoryId, authResult.user?.id!, bulkData);
          }

          const deleteResponse: ApiResponse<typeof deletedCategories> = {
            data: deletedCategories,
            success: true,
            message: `${deletedCategories?.length || 0} categorías eliminadas`
          };

          const deleteNextResponse = NextResponse.json(deleteResponse);
          // Rate limit headers are handled internally
          return deleteNextResponse;

        default:
          throw new Error('Operación masiva no implementada');
      }

      if (Object.keys(updateData).length > 0) {
        const { data: updatedCategories, error: updateError } = await supabase
          .from('categories')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .in('id', bulkData.category_ids)
          .select();

        if (updateError) {
          throw new Error(`Error en operación masiva: ${updateError.message}`);
        }

        // Registrar auditoría para cada categoría
        for (const categoryId of bulkData.category_ids) {
          await logAuditAction(`bulk_${bulkData.action}`, categoryId, authResult.user?.id!, bulkData);
        }

        const bulkResponse: ApiResponse<typeof updatedCategories> = {
          data: updatedCategories,
          success: true,
          message: `Operación '${bulkData.action}' ejecutada en ${updatedCategories?.length || 0} categorías`
        };

        const bulkNextResponse = NextResponse.json(bulkResponse);
        // Rate limit headers are handled internally
        return bulkNextResponse;
      }
    }

    // Crear categoría individual
    const categoryData = CreateCategorySchema.parse(body);
    
    // Crear slug si no se proporciona
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const newCategory = await createCategory(categoryData, authResult.user?.id!);

    // Registrar auditoría
    await logAuditAction('create', newCategory.id, authResult.user?.id!, categoryData);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id
    });

    const response: ApiResponse<Category> = {
      data: newCategory,
      success: true,
      message: 'Categoría creada exitosamente',
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    // Rate limit headers are handled internally
    return nextResponse;

  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/categories', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error'
    });
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}










