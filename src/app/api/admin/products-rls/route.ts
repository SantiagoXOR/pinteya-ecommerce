/**
 * API de Productos con RLS Enterprise
 * Demuestra la integración completa de Row Level Security con utilidades enterprise
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAdminAuth,
  withAdminAuth 
} from '@/lib/auth/enterprise-auth-utils';
import {
  executeWithRLS,
  withRLS,
  createRLSFilters,
  checkRLSPermission
} from '@/lib/auth/enterprise-rls-utils';

// ===================================
// GET /api/admin/products-rls - Listar productos con RLS
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Autenticación enterprise
    const authResult = await requireAdminAuth(request, ['products_read']);

    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const url = new URL(request.url);
    
    // Parámetros de consulta
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';
    const categoryId = url.searchParams.get('categoryId');
    const isActive = url.searchParams.get('active');

    // Ejecutar consulta con RLS
    const result = await executeWithRLS(
      context,
      async (client, rlsContext) => {
        // Crear filtros RLS automáticos
        const rlsFilters = createRLSFilters(rlsContext, 'products');
        
        let query = client
          .from('products')
          .select(`
            id,
            name,
            slug,
            description,
            price,
            discounted_price,
            stock,
            category_id,
            brand,
            is_active,
            is_featured,
            created_at,
            updated_at,
            categories (
              id,
              name,
              slug
            )
          `, { count: 'exact' });

        // Aplicar filtros RLS automáticos
        Object.entries(rlsFilters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        // Aplicar filtros de búsqueda
        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (categoryId) {
          query = query.eq('category_id', parseInt(categoryId));
        }

        if (isActive !== null && isActive !== undefined) {
          query = query.eq('is_active', isActive === 'true');
        }

        // Aplicar paginación
        query = query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        const { data: products, error, count } = await query;

        if (error) {
          throw new Error(`Error consultando productos: ${error.message}`);
        }

        return {
          products: products || [],
          total: count || 0,
          pagination: {
            limit,
            offset,
            hasMore: (count || 0) > offset + limit
          }
        };
      },
      {
        enforceRLS: true,
        auditLog: true
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          code: result.code,
          rls: true,
          enterprise: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      rls: {
        enabled: true,
        context: {
          role: context.role,
          permissions: context.permissions,
          securityLevel: context.securityLevel
        }
      },
      enterprise: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Error en GET /api/admin/products-rls:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        rls: true,
        enterprise: true
      },
      { status: 500 }
    );
  }
}

// ===================================
// POST /api/admin/products-rls - Crear producto con RLS
// ===================================
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request, ['products_create']);

    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();

    // Validar datos del producto
    const requiredFields = ['name', 'price', 'category_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            error: `Campo requerido: ${field}`,
            code: 'MISSING_FIELD',
            enterprise: true
          },
          { status: 400 }
        );
      }
    }

    // Ejecutar creación con RLS
    const result = await executeWithRLS(
      context,
      async (client, rlsContext) => {
        // Verificar permisos específicos
        if (!checkRLSPermission(rlsContext, 'products_create')) {
          throw new Error('Permisos insuficientes para crear productos');
        }

        // Crear slug automático
        const slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        const productData = {
          name: body.name,
          slug: `${slug}-${Date.now()}`, // Asegurar unicidad
          description: body.description || '',
          price: parseFloat(body.price),
          discounted_price: body.discounted_price ? parseFloat(body.discounted_price) : null,
          stock: parseInt(body.stock || '0'),
          category_id: parseInt(body.category_id),
          brand: body.brand || '',
          is_active: body.is_active !== false,
          is_featured: body.is_featured === true,
          images: body.images || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: product, error } = await client
          .from('products')
          .insert(productData)
          .select(`
            id,
            name,
            slug,
            description,
            price,
            discounted_price,
            stock,
            category_id,
            brand,
            is_active,
            is_featured,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          throw new Error(`Error creando producto: ${error.message}`);
        }

        return product;
      },
      {
        enforceRLS: true,
        auditLog: true
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          code: result.code,
          rls: true,
          enterprise: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        product: result.data,
        message: 'Producto creado exitosamente'
      },
      rls: {
        enabled: true,
        operation: 'CREATE',
        context: {
          role: context.role,
          permissions: context.permissions
        }
      },
      enterprise: true,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error en POST /api/admin/products-rls:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        rls: true,
        enterprise: true
      },
      { status: 500 }
    );
  }
}

// ===================================
// PUT /api/admin/products-rls - Actualizar producto con RLS
// ===================================
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request, ['products_update']);

    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { 
          error: 'ID de producto requerido',
          code: 'MISSING_PRODUCT_ID',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Ejecutar actualización con RLS
    const result = await executeWithRLS(
      context,
      async (client, rlsContext) => {
        // Verificar permisos específicos
        if (!checkRLSPermission(rlsContext, 'products_update')) {
          throw new Error('Permisos insuficientes para actualizar productos');
        }

        // Preparar datos de actualización
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        // Solo actualizar campos proporcionados
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.discounted_price !== undefined) {
          updateData.discounted_price = body.discounted_price ? parseFloat(body.discounted_price) : null;
        }
        if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
        if (body.category_id !== undefined) updateData.category_id = parseInt(body.category_id);
        if (body.brand !== undefined) updateData.brand = body.brand;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
        if (body.images !== undefined) updateData.images = body.images;

        const { data: product, error } = await client
          .from('products')
          .update(updateData)
          .eq('id', parseInt(productId))
          .select(`
            id,
            name,
            slug,
            description,
            price,
            discounted_price,
            stock,
            category_id,
            brand,
            is_active,
            is_featured,
            updated_at
          `)
          .single();

        if (error) {
          throw new Error(`Error actualizando producto: ${error.message}`);
        }

        return product;
      },
      {
        enforceRLS: true,
        auditLog: true
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          code: result.code,
          rls: true,
          enterprise: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        product: result.data,
        message: 'Producto actualizado exitosamente'
      },
      rls: {
        enabled: true,
        operation: 'UPDATE',
        context: {
          role: context.role,
          permissions: context.permissions
        }
      },
      enterprise: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Error en PUT /api/admin/products-rls:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        rls: true,
        enterprise: true
      },
      { status: 500 }
    );
  }
}
