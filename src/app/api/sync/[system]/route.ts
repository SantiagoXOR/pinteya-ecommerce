// =====================================================
// API: SINCRONIZACIÓN DE ERP
// Descripción: Endpoint para recibir actualizaciones de
// sistemas ERP externos (Aikon, SAP, Tango, etc.)
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

interface SyncProduct {
  code: string          // Código externo (ej: "50001" para Aikon)
  stock?: number        // Stock actualizado
  price?: number        // Precio actualizado
  discountedPrice?: number
  name?: string         // Nombre si cambió
  active?: boolean      // Si el producto está activo
}

interface SyncRequest {
  products: SyncProduct[]
  timestamp?: string    // Timestamp de la sincronización
  source?: string       // Identificador de la fuente
}

interface SyncResult {
  code: string
  status: 'updated' | 'created' | 'not_found' | 'error'
  message?: string
}

// ============================================================================
// VALIDATION
// ============================================================================

async function validateApiKey(
  apiKey: string | null,
  systemCode: string
): Promise<{
  valid: boolean
  tenantId?: string
  tenantSlug?: string
  externalSystemId?: string
  instanceId?: string
}> {
  if (!apiKey) {
    return { valid: false }
  }
  
  const supabase = createAdminClient()
  
  // Buscar el tenant_external_systems que tiene esta API key
  const { data, error } = await supabase
    .from('tenant_external_systems')
    .select(`
      tenant_id,
      external_system_id,
      instance_id,
      api_credentials,
      tenants (slug),
      external_systems!inner (code)
    `)
    .eq('is_active', true)
    .eq('external_systems.code', systemCode.toUpperCase())
  
  if (error || !data || data.length === 0) {
    return { valid: false }
  }
  
  // Buscar el registro que coincide con la API key
  const match = data.find((d: any) => {
    const credentials = d.api_credentials as Record<string, any>
    return credentials?.api_key === apiKey || credentials?.webhook_secret === apiKey
  })
  
  if (!match) {
    return { valid: false }
  }
  
  return {
    valid: true,
    tenantId: match.tenant_id,
    tenantSlug: (match.tenants as any)?.slug,
    externalSystemId: match.external_system_id,
    instanceId: match.instance_id,
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST /api/sync/[system]
 * Recibe actualizaciones de stock/precio desde un ERP externo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { system: string } }
) {
  const startTime = Date.now()
  const systemCode = params.system.toUpperCase()
  
  try {
    // Validar API key
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    const validation = await validateApiKey(apiKey, systemCode)
    
    if (!validation.valid || !validation.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Parsear body
    const body: SyncRequest = await request.json()
    
    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'products array is required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    const results: SyncResult[] = []
    let updatedCount = 0
    let notFoundCount = 0
    let errorCount = 0
    
    // Procesar cada producto
    for (const item of body.products) {
      try {
        // Buscar el mapeo del código externo al producto
        const { data: mapping, error: mappingError } = await supabase
          .from('tenant_product_external_ids')
          .select(`
            product_id,
            tenant_products (
              id,
              tenant_id,
              shared_pool_id
            )
          `)
          .eq('tenant_id', validation.tenantId)
          .eq('external_system_id', validation.externalSystemId)
          .eq('external_code', item.code)
          .single()
        
        if (mappingError || !mapping) {
          results.push({
            code: item.code,
            status: 'not_found',
            message: 'Product mapping not found',
          })
          notFoundCount++
          continue
        }
        
        const tenantProduct = mapping.tenant_products as any
        
        // Actualizar stock
        if (item.stock !== undefined) {
          if (tenantProduct?.shared_pool_id) {
            // Actualizar stock en pool compartido
            await supabase
              .from('shared_pool_stock')
              .upsert({
                pool_id: tenantProduct.shared_pool_id,
                product_id: mapping.product_id,
                stock: item.stock,
                last_sync_at: new Date().toISOString(),
                sync_source: systemCode,
              }, {
                onConflict: 'pool_id,product_id',
              })
          } else if (tenantProduct) {
            // Actualizar stock propio del tenant
            await supabase
              .from('tenant_products')
              .update({
                stock: item.stock,
                last_stock_sync_at: new Date().toISOString(),
              })
              .eq('id', tenantProduct.id)
          }
        }
        
        // Actualizar precio
        if (tenantProduct && (item.price !== undefined || item.discountedPrice !== undefined)) {
          const priceUpdate: Record<string, any> = {
            last_price_sync_at: new Date().toISOString(),
          }
          
          if (item.price !== undefined) {
            priceUpdate.price = item.price
          }
          if (item.discountedPrice !== undefined) {
            priceUpdate.discounted_price = item.discountedPrice
          }
          
          await supabase
            .from('tenant_products')
            .update(priceUpdate)
            .eq('id', tenantProduct.id)
        }
        
        // Actualizar metadatos del mapeo
        await supabase
          .from('tenant_product_external_ids')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
          })
          .eq('tenant_id', validation.tenantId)
          .eq('external_system_id', validation.externalSystemId)
          .eq('external_code', item.code)
        
        results.push({
          code: item.code,
          status: 'updated',
        })
        updatedCount++
        
      } catch (itemError) {
        console.error(`[ERP Sync] Error processing ${item.code}:`, itemError)
        results.push({
          code: item.code,
          status: 'error',
          message: 'Internal error processing item',
        })
        errorCount++
      }
    }
    
    // Actualizar estadísticas de sincronización
    const duration = Date.now() - startTime
    await supabase
      .from('tenant_external_systems')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: errorCount === 0 ? 'success' : 'partial',
        sync_stats: {
          products_synced: updatedCount,
          last_sync_duration_ms: duration,
          last_sync_timestamp: body.timestamp || new Date().toISOString(),
        },
      })
      .eq('tenant_id', validation.tenantId)
      .eq('external_system_id', validation.externalSystemId)
    
    // Respuesta
    return NextResponse.json({
      success: true,
      system: systemCode,
      tenant: validation.tenantSlug,
      summary: {
        total: body.products.length,
        updated: updatedCount,
        notFound: notFoundCount,
        errors: errorCount,
        durationMs: duration,
      },
      results,
    })
    
  } catch (error) {
    console.error(`[ERP Sync] Error in ${systemCode} sync:`, error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Sync failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/[system]
 * Verifica el estado de la conexión con el ERP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { system: string } }
) {
  const systemCode = params.system.toUpperCase()
  const apiKey = request.headers.get('x-api-key')
  
  const validation = await validateApiKey(apiKey, systemCode)
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid API key' },
      { status: 401 }
    )
  }
  
  const supabase = createAdminClient()
  
  // Obtener estado del sistema
  const { data: systemStatus } = await supabase
    .from('tenant_external_systems')
    .select(`
      instance_id,
      last_sync_at,
      last_sync_status,
      sync_stats,
      external_systems (name, code)
    `)
    .eq('tenant_id', validation.tenantId)
    .eq('external_system_id', validation.externalSystemId)
    .single()
  
  return NextResponse.json({
    status: 'connected',
    system: {
      code: systemCode,
      name: (systemStatus?.external_systems as any)?.name,
      instanceId: validation.instanceId,
    },
    tenant: validation.tenantSlug,
    lastSync: {
      at: systemStatus?.last_sync_at,
      status: systemStatus?.last_sync_status,
      stats: systemStatus?.sync_stats,
    },
  })
}
