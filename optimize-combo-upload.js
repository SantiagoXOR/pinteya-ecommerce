/**
 * Optimiza combo1–3.webp de cada tenant y re-sube a Supabase tenant-assets.
 * Descarga desde Storage → sharp (resize 1200px, WebP 76) → upsert.
 * Uso: node optimize-combo-upload.js
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env.local') })
const { createClient } = require('@supabase/supabase-js')
const sharp = require('sharp')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'tenant-assets'
const TENANTS = ['pinteya', 'pintemas']
const COMBOS = ['combo1.webp', 'combo2.webp', 'combo3.webp']
const MAX_WIDTH = 1200
const WEBP_QUALITY = 76

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function publicUrl(storagePath) {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

async function download(storagePath) {
  const url = publicUrl(storagePath)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function optimize(buffer) {
  return sharp(buffer)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function main() {
  let ok = 0
  let err = 0
  for (const slug of TENANTS) {
    for (const name of COMBOS) {
      const storagePath = `tenants/${slug}/combos/${name}`
      try {
        const raw = await download(storagePath)
        const rawKb = (raw.length / 1024).toFixed(1)
        const out = await optimize(raw)
        const outKb = (out.length / 1024).toFixed(1)
        const { error } = await supabase.storage.from(BUCKET).upload(storagePath, out, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000, immutable',
          upsert: true,
        })
        if (error) throw error
        const localPath = path.join(process.cwd(), 'public', 'tenants', slug, 'combos', name)
        fs.mkdirSync(path.dirname(localPath), { recursive: true })
        fs.writeFileSync(localPath, out)
        console.log(`✅ ${storagePath}  ${rawKb} KB → ${outKb} KB`)
        ok++
      } catch (e) {
        console.error(`❌ ${storagePath}: ${e.message}`)
        err++
      }
      await new Promise((r) => setTimeout(r, 150))
    }
  }
  console.log(`\n📊 OK: ${ok} | Errores: ${err}`)
  process.exit(err > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
