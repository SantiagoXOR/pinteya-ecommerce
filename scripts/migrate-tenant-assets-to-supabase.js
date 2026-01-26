/**
 * Migración de assets de tenants a Supabase Storage (bucket tenant-assets).
 * Paths: tenants/{slug}/{assetPath} (ej. tenants/pinteya/logo.svg)
 * Uso: node scripts/migrate-tenant-assets-to-supabase.js
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'tenant-assets'
const TENANTS_DIR = path.join(process.cwd(), 'public', 'tenants')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function getAllFiles(dir, base = dir) {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    const rel = path.relative(base, full).replace(/\\/g, '/')
    if (e.isDirectory()) out.push(...getAllFiles(full, base))
    else if (e.isFile() && e.name !== '.gitkeep') out.push({ localPath: full, storagePath: 'tenants/' + rel })
  }
  return out
}

function mime(pathname) {
  const ext = path.extname(pathname).toLowerCase()
  const map = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }
  return map[ext] || 'application/octet-stream'
}

async function main() {
  if (!fs.existsSync(TENANTS_DIR)) {
    console.error('❌ No existe public/tenants')
    process.exit(1)
  }
  const files = getAllFiles(TENANTS_DIR)
  console.log(`📂 ${files.length} archivos → tenant-assets/tenants/...\n`)
  let ok = 0
  let err = 0
  for (const f of files) {
    try {
      const buf = fs.readFileSync(f.localPath)
      const { error } = await supabase.storage.from(BUCKET).upload(f.storagePath, buf, {
        contentType: mime(f.localPath),
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: true,
      })
      if (error) {
        console.error(`❌ ${f.storagePath}: ${error.message}`)
        err++
      } else {
        console.log(`✅ ${f.storagePath}`)
        ok++
      }
    } catch (e) {
      console.error(`❌ ${f.storagePath}: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 80))
  }
  console.log(`\n📊 OK: ${ok} | Errores: ${err}`)
  process.exit(err > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
