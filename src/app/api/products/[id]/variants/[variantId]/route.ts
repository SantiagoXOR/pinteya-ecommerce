import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { z } from 'zod'

// Schema de validación para actualización de variante
// ✅ CORREGIDO: Usar preprocess para convertir strings a números automáticamente
const UpdateVariantSchema = z.object({
  color_name: z.string().optional(),
  color_hex: z.string().optional(),
  measure: z.string().optional(),
  finish: z.string().optional().nullable(),
  // ✅ Convertir strings a números automáticamente
  price_list: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined
      const num = typeof val === 'string' ? parseFloat(val) : val
      return isNaN(num) ? undefined : num
    },
    z.number().optional()
  ),
  price_sale: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '' || val === 0) return null
      const num = typeof val === 'string' ? parseFloat(val) : val
      return isNaN(num) ? null : num
    },
    z.number().nullable().optional()
  ),
  stock: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined
      const num = typeof val === 'string' ? parseInt(val, 10) : val
      return isNaN(num) ? undefined : Math.floor(num)
    },
    z.number().int().min(0).optional()
  ),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  image_url: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null
      return typeof val === 'string' ? val.trim() || null : val
    },
    z.string().nullable().optional()
  ),
  aikon_id: z.string().optional(),
})

/**
 * PUT /api/products/[id]/variants/[variantId]
 * Actualizar una variante específica
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: productId, variantId } = await context.params
    
    // Parse body
    const body = await request.json()
    
    console.log('📥 [PUT Variant] Datos recibidos:', {
      productId,
      variantId,
      body: JSON.stringify(body, null, 2),
      bodyKeys: Object.keys(body),
      stock: body.stock,
      stockType: typeof body.stock
    })
    
    // Validar datos
    // Filtrar solo los campos que se pueden actualizar (ignorar campos de solo lectura)
    const allowedFields = {
      color_name: body.color_name,
      color_hex: body.color_hex,
      measure: body.measure,
      finish: body.finish,
      price_list: body.price_list,
      price_sale: body.price_sale,
      stock: body.stock,
      is_active: body.is_active,
      is_default: body.is_default,
      image_url: body.image_url,
      aikon_id: body.aikon_id,
    }
    
    // Remover campos undefined
    const filteredBody = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    )
    
    console.log('📦 [PUT Variant] Campos filtrados:', {
      original: Object.keys(body).length,
      filtered: Object.keys(filteredBody).length,
      filteredBody
    })
    
    const validation = UpdateVariantSchema.safeParse(filteredBody)
    
    if (!validation.success) {
      console.error('❌ [PUT Variant] Validación fallida:', {
        errors: validation.error.errors,
        filteredBody
      })
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validation.error.errors,
          received: filteredBody
        },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data
    
    console.log('✅ [PUT Variant] Validación exitosa:', {
      productId,
      variantId,
      data: validatedData
    })
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }
    
    const numericProductId = parseInt(productId, 10)
    const numericVariantId = parseInt(variantId, 10)
    
    // Preparar datos de actualización
    const updateData: Record<string, any> = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }
    
    console.log('🔍 [PUT Variant] updateData antes de enviar a Supabase:', {
      updateData,
      hasStock: 'stock' in updateData,
      stockValue: updateData.stock,
      stockType: typeof updateData.stock,
      allKeys: Object.keys(updateData)
    })
    
    // Si se marca como default, desmarcar las demás
    if (validatedData.is_default === true) {
      // @ts-ignore - Supabase types are too strict
      await supabaseAdmin
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', numericProductId)
        .neq('id', numericVariantId)
    }
    
    // Actualizar la variante
    // @ts-ignore - Supabase types are too strict
    const { data: variant, error } = await supabaseAdmin
      .from('product_variants')
      .update(updateData)
      .eq('id', numericVariantId)
      .eq('product_id', numericProductId)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ [PUT Variant] Error al actualizar variante en Supabase:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        updateData
      })
      return NextResponse.json(
        { error: 'Error al actualizar variante', details: error.message },
        { status: 500 }
      )
    }
    
    if (!variant) {
      console.error('❌ [PUT Variant] Variante no encontrada después de update')
      return NextResponse.json(
        { error: 'Variante no encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ [PUT Variant] Variante actualizada exitosamente:', {
      id: (variant as any).id,
      measure: (variant as any).measure,
      stockAntes: body.stock,
      stockDespues: (variant as any).stock,
      updated_at: (variant as any).updated_at
    })
    
    return NextResponse.json({
      data: variant,
      success: true,
      message: 'Variante actualizada exitosamente',
    })
  } catch (error: any) {
    console.error('❌ Error en PUT /api/products/[id]/variants/[variantId]:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]/variants/[variantId]
 * Eliminar una variante específica
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: productId, variantId } = await context.params
    
    console.log('🗑️ Eliminando variante:', {
      productId,
      variantId
    })
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }
    
    const numericProductId = parseInt(productId, 10)
    const numericVariantId = parseInt(variantId, 10)
    
    // Verificar que no sea la única variante
    // @ts-ignore - Supabase types are too strict
    const { count } = await supabaseAdmin
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', numericProductId)
    
    if (count && count <= 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar la única variante del producto' },
        { status: 400 }
      )
    }
    
    // Verificar que no sea la variante default
    // @ts-ignore - Supabase types are too strict
    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('is_default')
      .eq('id', numericVariantId)
      .single()
    
    if ((variant as any)?.is_default) {
      return NextResponse.json(
        { error: 'No se puede eliminar la variante predeterminada. Marca otra como predeterminada primero.' },
        { status: 400 }
      )
    }
    
    // Eliminar la variante
    // @ts-ignore - Supabase types are too strict
    const { error } = await supabaseAdmin
      .from('product_variants')
      .delete()
      .eq('id', numericVariantId)
      .eq('product_id', numericProductId)
    
    if (error) {
      console.error('❌ Error al eliminar variante:', error)
      return NextResponse.json(
        { error: 'Error al eliminar variante', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Variante eliminada exitosamente')
    
    return NextResponse.json({
      success: true,
      message: 'Variante eliminada exitosamente',
    })
  } catch (error: any) {
    console.error('❌ Error en DELETE /api/products/[id]/variants/[variantId]:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
