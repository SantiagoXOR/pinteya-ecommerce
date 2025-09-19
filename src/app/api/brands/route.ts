// ===================================
// PINTEYA E-COMMERCE - API DE MARCAS
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase';
import { ApiResponse } from '@/types/api';

// ===================================
// TIPOS PARA MARCAS
// ===================================
export interface Brand {
  name: string;
  products_count: number;
}

export interface BrandFilters {
  search?: string;
  minProducts?: number;
}

// ===================================
// GET /api/brands - Obtener marcas disponibles
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de query
    const filters: BrandFilters = {
      search: searchParams.get('search') || undefined,
      minProducts: searchParams.get('minProducts') ? Number(searchParams.get('minProducts')) : 1,
    };
    
    const supabase = getSupabaseClient();

    // Verificar que el cliente de Supabase esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/brands');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Construir query para obtener marcas con conteo de productos
    let query = supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .gt('stock', 0); // Solo productos con stock

    // Aplicar filtro de búsqueda si existe
    if (filters.search) {
      query = query.ilike('brand', `%${filters.search}%`);
    }

    // Ejecutar query
    const { data: products, error } = await query;

    if (error) {
      handleSupabaseError(error, 'GET /api/brands');
    }

    // Procesar datos para obtener marcas únicas con conteo
    const brandCounts: Record<string, number> = {};
    
    products?.forEach(product => {
      if (product.brand) {
        brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
      }
    });

    // Convertir a array y filtrar por mínimo de productos
    const brands: Brand[] = Object.entries(brandCounts)
      .filter(([_, count]) => count >= (filters.minProducts || 1))
      .map(([name, products_count]) => ({
        name,
        products_count,
      }))
      .sort((a, b) => {
        // Ordenar por número de productos (descendente) y luego por nombre
        if (a.products_count !== b.products_count) {
          return b.products_count - a.products_count;
        }
        return a.name.localeCompare(b.name);
      });

    const response: ApiResponse<Brand[]> = {
      data: brands,
      success: true,
      message: `${brands.length} marcas encontradas`,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en GET /api/brands:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// GET /api/brands/stats - Estadísticas de marcas
// ===================================
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.error('Cliente de Supabase no disponible en POST /api/brands');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Obtener estadísticas detalladas de marcas
    const { data: products, error } = await supabase
      .from('products')
      .select('brand, price, discounted_price, stock, category_id')
      .not('brand', 'is', null);

    if (error) {
      handleSupabaseError(error, 'POST /api/brands (stats)');
    }

    // Calcular estadísticas por marca
    const brandStats: Record<string, {
      name: string;
      products_count: number;
      total_stock: number;
      avg_price: number;
      min_price: number;
      max_price: number;
      discounted_products: number;
    }> = {};

    products?.forEach(product => {
      if (product.brand) {
        if (!brandStats[product.brand]) {
          brandStats[product.brand] = {
            name: product.brand,
            products_count: 0,
            total_stock: 0,
            avg_price: 0,
            min_price: Infinity,
            max_price: 0,
            discounted_products: 0,
          };
        }

        const stats = brandStats[product.brand];
        const currentPrice = product.discounted_price || product.price;

        stats.products_count++;
        stats.total_stock += product.stock || 0;
        stats.min_price = Math.min(stats.min_price, currentPrice);
        stats.max_price = Math.max(stats.max_price, currentPrice);
        
        if (product.discounted_price && product.discounted_price < product.price) {
          stats.discounted_products++;
        }
      }
    });

    // Calcular precio promedio y finalizar estadísticas
    const finalStats = Object.values(brandStats).map(stats => {
      const brandProducts = products?.filter(p => p.brand === stats.name) || [];
      const totalPrice = brandProducts.reduce((sum, p) => sum + (p.discounted_price || p.price), 0);
      
      return {
        ...stats,
        avg_price: Math.round(totalPrice / stats.products_count),
        min_price: stats.min_price === Infinity ? 0 : stats.min_price,
      };
    }).sort((a, b) => b.products_count - a.products_count);

    const response: ApiResponse<typeof finalStats> = {
      data: finalStats,
      success: true,
      message: `Estadísticas de ${finalStats.length} marcas calculadas`,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error en POST /api/brands (stats):', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}









