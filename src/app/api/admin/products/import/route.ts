// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// =====================================================
// API: IMPORTACIÓN DE PRODUCTOS CSV
// Ruta: /api/admin/products/import
// Descripción: Importación masiva de productos desde CSV
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';

// =====================================================
// CONFIGURACIÓN
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const ProductImportSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock debe ser un número entero positivo'),
  category: z.string().min(1, 'Categoría es requerida'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional()
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

function normalizeProductData(row: any): any {
  return {
    name: row.nombre || row.name || '',
    description: row.descripcion || row.description || '',
    price: parseFloat(row.precio || row.price || '0'),
    stock: parseInt(row.stock || row.cantidad || '0'),
    category: row.categoria || row.category || '',
    brand: row.marca || row.brand || '',
    sku: row.sku || row.codigo || '',
    is_active: row.activo === 'true' || row.is_active === 'true' || true,
    is_featured: row.destacado === 'true' || row.is_featured === 'true' || false
  };
}

async function findOrCreateCategory(categoryName: string): Promise<number> {
  // Buscar categoría existente
  const { data: existingCategory, error: searchError } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryName)
    .single();

  if (existingCategory && !searchError) {
    return existingCategory.id;
  }

  // Crear nueva categoría
  const { data: newCategory, error: createError } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Error creando categoría "${categoryName}": ${createError.message}`);
  }

  return newCategory.id;
}

// =====================================================
// HANDLER POST - IMPORTAR PRODUCTOS
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un CSV' },
        { status: 400 }
      );
    }

    // Leer contenido del archivo
    const csvText = await file.text();
    
    // Parsear CSV
    let rows;
    try {
      rows = parseCSV(csvText);
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Error parseando CSV',
          details: parseError instanceof Error ? parseError.message : 'Error desconocido'
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV está vacío' },
        { status: 400 }
      );
    }

    if (rows.length > 1000) {
      return NextResponse.json(
        { error: 'Máximo 1000 productos por importación' },
        { status: 400 }
      );
    }

    // Procesar productos
    const results = {
      imported_count: 0,
      failed_count: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 porque empezamos en fila 1 y hay header
      
      try {
        // Normalizar datos
        const normalizedData = normalizeProductData(rows[i]);
        
        // Validar datos
        const validationResult = ProductImportSchema.safeParse(normalizedData);
        if (!validationResult.success) {
          results.errors.push({
            row: rowNumber,
            error: `Datos inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
            data: normalizedData
          });
          results.failed_count++;
          continue;
        }

        const productData = validationResult.data;

        // Buscar o crear categoría
        let categoryId;
        try {
          categoryId = await findOrCreateCategory(productData.category);
        } catch (categoryError) {
          results.errors.push({
            row: rowNumber,
            error: `Error con categoría: ${categoryError instanceof Error ? categoryError.message : 'Error desconocido'}`,
            data: productData
          });
          results.failed_count++;
          continue;
        }

        // Generar slug único
        const baseSlug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        const slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Crear producto
        const { data: product, error: createError } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            slug: slug,
            description: productData.description || '',
            price: productData.price,
            stock: productData.stock,
            category_id: categoryId,
            brand: productData.brand || '',
            sku: productData.sku || '',
            is_active: productData.is_active !== false,
            is_featured: productData.is_featured === true,
            images: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          results.errors.push({
            row: rowNumber,
            error: `Error creando producto: ${createError.message}`,
            data: productData
          });
          results.failed_count++;
          continue;
        }

        results.imported_count++;

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          data: rows[i]
        });
        results.failed_count++;
      }
    }

    // Log del resultado
    console.log('✅ Importación completada:', {
      total_rows: rows.length,
      imported: results.imported_count,
      failed: results.failed_count,
      user_id: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${results.imported_count} productos importados, ${results.failed_count} fallidos`,
      data: results
    });

  } catch (error) {
    console.error('❌ Error en importación de productos:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// HANDLER GET - INFORMACIÓN DE IMPORTACIÓN
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const importInfo = {
      max_products_per_import: 1000,
      supported_formats: ['CSV'],
      required_columns: ['nombre/name', 'precio/price', 'stock', 'categoria/category'],
      optional_columns: ['descripcion/description', 'marca/brand', 'sku', 'activo/is_active', 'destacado/is_featured'],
      example_csv: `nombre,descripcion,precio,stock,categoria,marca,sku
"Pintura Látex Blanca","Pintura látex interior blanca 4L",1500,50,"Pinturas","Alba","ALB-LAT-BL-4L"
"Brocha 2 pulgadas","Brocha profesional para pintura",250,100,"Herramientas","ProBrush","PB-2IN"`
    };

    return NextResponse.json({
      success: true,
      data: importInfo
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de importación:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










