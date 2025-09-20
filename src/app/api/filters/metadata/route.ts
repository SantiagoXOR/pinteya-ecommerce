// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API FILTERS METADATA
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';

/**
 * GET /api/filters/metadata
 * 
 * Obtiene metadatos para filtros dinámicos:
 * - Categorías principales y subcategorías
 * - Marcas disponibles
 * - Rangos de precios
 * 
 * @returns {Object} Metadatos de filtros
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Obtener categorías principales (parent_id = null)
    const { data: mainCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .is('parent_id', null)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching main categories:', categoriesError);
      return NextResponse.json(
        { success: false, error: 'Error fetching categories' },
        { status: 500 }
      );
    }

    // Obtener subcategorías agrupadas por categoría principal
    const { data: subCategories, error: subCategoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url')
      .not('parent_id', 'is', null)
      .order('name');

    if (subCategoriesError) {
      console.error('❌ Error fetching subcategories:', subCategoriesError);
      return NextResponse.json(
        { success: false, error: 'Error fetching subcategories' },
        { status: 500 }
      );
    }

    // Obtener marcas únicas
    const { data: brandsData, error: brandsError } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .order('brand');

    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return NextResponse.json(
        { success: false, error: 'Error fetching brands' },
        { status: 500 }
      );
    }

    // Extraer marcas únicas
    const uniqueBrands = [...new Set(brandsData.map(item => item.brand))].filter(Boolean);

    // Obtener rangos de precios
    const { data: priceData, error: priceError } = await supabase
      .from('products')
      .select('price')
      .not('price', 'is', null);

    if (priceError) {
      console.error('❌ Error fetching price data:', priceError);
      return NextResponse.json(
        { success: false, error: 'Error fetching price data' },
        { status: 500 }
      );
    }

    const prices = priceData.map(item => item.price).filter(Boolean);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Agrupar subcategorías por categoría principal
    const categoriesWithSubs = mainCategories.map(category => ({
      ...category,
      subcategories: subCategories.filter(sub => sub.parent_id === category.id)
    }));

    // Detectar tipos de pintura desde nombres de productos (análisis básico)
    const { data: productNames, error: productNamesError } = await supabase
      .from('products')
      .select('name')
      .limit(1000);

    let paintTypes: string[] = [];
    let finishes: string[] = [];

    if (!productNamesError && productNames) {
      const typeKeywords = ['Látex', 'Sintético', 'Esmalte', 'Antióxido', 'Impermeabilizante', 'Barniz'];
      const finishKeywords = ['Mate', 'Satinado', 'Brillante', 'Semi-mate', 'Semi-brillante'];
      
      paintTypes = typeKeywords.filter(type => 
        productNames.some(product => 
          product.name.toLowerCase().includes(type.toLowerCase())
        )
      );

      finishes = finishKeywords.filter(finish => 
        productNames.some(product => 
          product.name.toLowerCase().includes(finish.toLowerCase())
        )
      );
    }

    const metadata = {
      categories: categoriesWithSubs,
      brands: uniqueBrands.sort(),
      paintTypes: paintTypes.sort(),
      finishes: finishes.sort(),
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      stats: {
        totalCategories: mainCategories.length,
        totalSubcategories: subCategories.length,
        totalBrands: uniqueBrands.length,
        totalProducts: priceData.length
      }
    };

    console.log('✅ Filter metadata fetched successfully:', {
      categories: metadata.categories.length,
      brands: metadata.brands.length,
      paintTypes: metadata.paintTypes.length,
      finishes: metadata.finishes.length
    });

    return NextResponse.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('❌ Unexpected error in filters metadata API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}










