#!/usr/bin/env node

/**
 * Script para verificar la configuración del tenant Pintemas en Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('\n💡 Asegúrate de tener un archivo .env.local con estas variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTenantPintemas() {
  console.log('🔍 Verificando configuración del tenant Pintemas...\n')

  try {
    // 1. Verificar que el tenant existe
    console.log('1️⃣ Verificando existencia del tenant...')
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', 'pintemas')
      .single()

    if (tenantError) {
      console.error('❌ Error consultando tenant:', tenantError.message)
      return
    }

    if (!tenant) {
      console.error('❌ Tenant Pintemas no encontrado en la base de datos')
      console.log('\n💡 Necesitas ejecutar la migración:')
      console.log('   supabase/migrations/20260121000010_create_tenant_pintemas.sql')
      return
    }

    console.log('✅ Tenant encontrado:')
    console.log(`   - ID: ${tenant.id}`)
    console.log(`   - Slug: ${tenant.slug}`)
    console.log(`   - Nombre: ${tenant.name}`)
    console.log(`   - Subdomain: ${tenant.subdomain || 'N/A'}`)
    console.log(`   - Custom Domain: ${tenant.custom_domain || 'N/A'}`)
    console.log(`   - Activo: ${tenant.is_active ? '✅ Sí' : '❌ No'}`)
    console.log()

    // 2. Verificar configuración de dominios
    console.log('2️⃣ Verificando configuración de dominios...')
    if (!tenant.custom_domain) {
      console.warn('⚠️  Custom domain no configurado')
      console.log('   Debes ejecutar:')
      console.log("   UPDATE tenants SET custom_domain = 'www.pintemas.com' WHERE slug = 'pintemas';")
    } else {
      console.log(`✅ Custom domain configurado: ${tenant.custom_domain}`)
      if (tenant.custom_domain !== 'www.pintemas.com' && tenant.custom_domain !== 'www.pintemas.com.ar') {
        console.warn(`⚠️  El custom_domain (${tenant.custom_domain}) no coincide con los esperados`)
      }
    }
    console.log()

    // 3. Verificar assets
    console.log('3️⃣ Verificando configuración de assets...')
    console.log(`   - Logo URL: ${tenant.logo_url || 'N/A'}`)
    console.log(`   - Logo Dark URL: ${tenant.logo_dark_url || 'N/A'}`)
    console.log(`   - Favicon URL: ${tenant.favicon_url || 'N/A'}`)
    console.log(`   - OG Image URL: ${tenant.og_image_url || 'N/A'}`)
    console.log()

    // 4. Verificar productos
    console.log('4️⃣ Verificando productos del tenant...')
    const { data: products, error: productsError } = await supabase
      .from('tenant_products')
      .select('id, product_id, is_visible, is_featured')
      .eq('tenant_id', tenant.id)
      .limit(5)

    if (productsError) {
      console.error('❌ Error consultando productos:', productsError.message)
    } else {
      console.log(`✅ Productos encontrados: ${products.length}`)
      if (products.length === 0) {
        console.warn('⚠️  No hay productos configurados para Pintemas')
        console.log('   La migración debería haber copiado los productos de Pinteya')
      }
    }
    console.log()

    // 5. Verificar credenciales de MercadoPago
    console.log('5️⃣ Verificando credenciales de MercadoPago...')
    const hasMercadoPago = !!(tenant.mercadopago_access_token && tenant.mercadopago_public_key)
    if (hasMercadoPago) {
      console.log('✅ Credenciales de MercadoPago configuradas')
      console.log(`   - Access Token: ${tenant.mercadopago_access_token.substring(0, 20)}...`)
      console.log(`   - Public Key: ${tenant.mercadopago_public_key.substring(0, 20)}...`)
    } else {
      console.warn('⚠️  Credenciales de MercadoPago NO configuradas')
      console.log('   Debes configurar:')
      console.log('   UPDATE tenants SET')
      console.log("     mercadopago_access_token = 'APP_USR-xxx',")
      console.log("     mercadopago_public_key = 'APP_USR-xxx',")
      console.log("     mercadopago_webhook_secret = 'xxx'")
      console.log("   WHERE slug = 'pintemas';")
    }
    console.log()

    // 6. Verificar analytics
    console.log('6️⃣ Verificando configuración de Analytics...')
    console.log(`   - GA4 Measurement ID: ${tenant.ga4_measurement_id || 'N/A'}`)
    console.log(`   - Meta Pixel ID: ${tenant.meta_pixel_id || 'N/A'}`)
    if (!tenant.ga4_measurement_id && !tenant.meta_pixel_id) {
      console.warn('⚠️  Analytics no configurados')
    }
    console.log()

    // Resumen
    console.log('📊 RESUMEN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const issues = []
    if (!tenant.is_active) issues.push('❌ Tenant no está activo')
    if (!tenant.custom_domain) issues.push('❌ Custom domain no configurado')
    if (!hasMercadoPago) issues.push('⚠️  MercadoPago no configurado')
    if (products.length === 0) issues.push('⚠️  No hay productos configurados')

    if (issues.length === 0) {
      console.log('✅ Todo está configurado correctamente!')
    } else {
      console.log('⚠️  Problemas encontrados:')
      issues.forEach(issue => console.log(`   ${issue}`))
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Error verificando tenant:', error.message)
    process.exit(1)
  }
}

verifyTenantPintemas()
