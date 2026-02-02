/**
 * Verificación de analytics para el tenant Pintemas
 *
 * Comprueba que los eventos recientes en analytics_events_optimized
 * tienen tenant_id de Pintemas (tras aplicar la migración con p_tenant_id).
 *
 * Uso desde la raíz del proyecto:
 *   node docs/analytics/verify-analytics-pintemas.js
 *
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

const path = require('path')
const fs = require('fs')

const envLocal = path.join(__dirname, '..', '..', '.env.local')
if (fs.existsSync(envLocal)) {
  const content = fs.readFileSync(envLocal, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  })
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Verificación de analytics para Pintemas\n')

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', 'pintemas')
    .single()

  if (tenantError || !tenant) {
    console.error('No se encontró tenant pintemas:', tenantError?.message || 'sin datos')
    process.exit(1)
  }

  console.log('Tenant Pintemas:', tenant.id, `(${tenant.name})\n`)

  const { data: events, error: eventsError } = await supabase
    .from('analytics_events_optimized')
    .select('id, event_type, tenant_id, created_at, product_id, product_name')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (eventsError) {
    console.error('Error leyendo eventos:', eventsError.message)
    process.exit(1)
  }

  if (events.length === 0) {
    console.log('No hay eventos recientes con tenant_id = Pintemas.')
    console.log('Tras aplicar la migración 20260202100000_add_tenant_id_to_analytics_rpc.sql,')
    console.log('navega en www.pintemas.com (page_view, add_to_cart) y vuelve a ejecutar.\n')
  } else {
    console.log(`Últimos ${events.length} eventos de Pintemas:\n`)
    events.forEach((e, i) => {
      const ts = e.created_at ? new Date(e.created_at * 1000).toISOString() : '-'
      console.log(`  ${i + 1}. id=${e.id} event_type=${e.event_type} created_at=${ts} product=${e.product_name || '-'}`)
    })
    console.log('')
  }

  console.log('SQL manual:')
  console.log(`  SELECT id, event_type, tenant_id, created_at FROM analytics_events_optimized WHERE tenant_id = '${tenant.id}' ORDER BY created_at DESC LIMIT 10;`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
