/**
 * Elimina objetos duplicados en tenant-assets: solo borra los que están
 * en la raíz (pinteya/..., pintemas/...) y deja tenants/pinteya/..., tenants/pintemas/...
 * Uso: node remove-tenant-assets-duplicates.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'tenant-assets'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ROOT_PATHS_TO_DELETE = [
  'pinteya/combos/combo1.webp', 'pinteya/combos/combo2.webp', 'pinteya/combos/combo3.webp',
  'pinteya/favicon.svg', 'pinteya/hero/hero1.webp', 'pinteya/hero/hero2.webp', 'pinteya/hero/hero3.webp',
  'pinteya/icons/icon-envio.svg', 'pinteya/logo-dark.svg', 'pinteya/logo.svg', 'pinteya/og-image.png',
  'pinteya/promo/30-off.webp', 'pinteya/promo/calculator.webp', 'pinteya/promo/help.webp',
  'pintemas/combos/combo1.webp', 'pintemas/combos/combo2.webp', 'pintemas/combos/combo3.webp',
  'pintemas/favicon.svg', 'pintemas/hero/hero1.webp', 'pintemas/hero/hero2.webp', 'pintemas/hero/hero3.webp',
  'pintemas/icons/icon-envio.svg', 'pintemas/logo-dark.svg', 'pintemas/logo.svg', 'pintemas/og-image.png',
  'pintemas/promo/30-off.webp', 'pintemas/promo/calculator.webp', 'pintemas/promo/help.webp',
]

async function main() {
  const { data, error } = await supabase.storage.from(BUCKET).remove(ROOT_PATHS_TO_DELETE)
  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
  console.log('✅ Eliminados', ROOT_PATHS_TO_DELETE.length, 'objetos duplicados (pinteya/..., pintemas/... en raíz).')
  console.log('   Se mantienen tenants/pinteya/... y tenants/pintemas/...')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
