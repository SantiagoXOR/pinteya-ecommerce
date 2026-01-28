/**
 * Optimiza combo1.png, combo2.png, combo3.png del tenant pinteya y los sube a Supabase tenant-assets.
 * Convierte PNG a WebP (max 1920px, calidad 76). Escribe WebP en public/tenants/pinteya/combos/ para fallback local.
 * Uso: node optimize-pinteya-combos-upload.js
 * Requiere: .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env.local') })
const { createClient } = require('@supabase/supabase-js')
const sharp = require('sharp')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'tenant-assets'
const SLUG = 'pinteya'
const BASE = path.join(process.cwd(), 'public', 'tenants', SLUG, 'combos')
const MAX_WIDTH = 1920
const WEBP_QUALITY = 76

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function optimizePngToWebp(inputPath) {
  return sharp(inputPath)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function upload(storagePath, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
    upsert: true,
  })
  if (error) throw error
}

async function main() {
  let ok = 0
  let err = 0

  const combos = ['combo1', 'combo2', 'combo3']

  for (const name of combos) {
    const pngPath = path.join(BASE, `${name}.png`)
    if (!fs.existsSync(pngPath)) {
      console.warn(`⚠️ No existe: ${pngPath}`)
      continue
    }
    try {
      const out = await optimizePngToWebp(pngPath)
      const storagePath = `tenants/${SLUG}/combos/${name}.webp`
      await upload(storagePath, out, 'image/webp')
      const stats = fs.statSync(pngPath)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB (PNG) → ${(out.length / 1024).toFixed(1)} KB (WebP)`)
      ok++
      const localWebp = path.join(BASE, `${name}.webp`)
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ ${name}.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log(`\n📊 OK: ${ok} | Errores: ${err}`)
  process.exit(err > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
