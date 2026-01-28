/**
 * Optimiza favicon.svg y hero1/hero2.png de pintemas y los sube a Supabase tenant-assets.
 * - Favicon: minifica SVG (quita comentarios y espacios redundantes).
 * - Hero PNG: convierte a WebP (max 1920px, calidad 76) para coincidir con hero1.webp/hero2.webp.
 * Uso: node optimize-pintemas-assets-upload.js
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
const SLUG = 'pintemas'
const BASE = path.join(process.cwd(), 'public', 'tenants', SLUG)
const MAX_HERO_WIDTH = 1920
const WEBP_QUALITY = 76

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function minifySvg(buffer) {
  let svg = buffer.toString('utf8')
  // Quitar comentarios XML
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  // Colapsar espacios múltiples y saltos de línea
  svg = svg.replace(/\s+/g, ' ').trim()
  return Buffer.from(svg, 'utf8')
}

async function optimizePngToWebp(inputPath) {
  return sharp(inputPath)
    .resize(MAX_HERO_WIDTH, null, { withoutEnlargement: true })
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

  // 1. Favicon SVG
  const faviconPath = path.join(BASE, 'favicon.svg')
  if (fs.existsSync(faviconPath)) {
    try {
      const raw = fs.readFileSync(faviconPath)
      const out = minifySvg(raw)
      const storagePath = `tenants/${SLUG}/favicon.svg`
      await upload(storagePath, out, 'image/svg+xml')
      console.log(`✅ ${storagePath}  ${(raw.length / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB`)
      ok++
    } catch (e) {
      console.error(`❌ favicon.svg: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${faviconPath}`)
  }

  // 2. Hero 1 PNG → WebP
  const hero1Path = path.join(BASE, 'hero', 'hero1.png')
  if (fs.existsSync(hero1Path)) {
    try {
      const out = await optimizePngToWebp(hero1Path)
      const storagePath = `tenants/${SLUG}/hero/hero1.webp`
      await upload(storagePath, out, 'image/webp')
      const stats = fs.statSync(hero1Path)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB (PNG) → ${(out.length / 1024).toFixed(1)} KB (WebP)`)
      ok++
      // Opcional: guardar WebP local para consistencia
      const localWebp = path.join(BASE, 'hero', 'hero1.webp')
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ hero1.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${hero1Path}`)
  }

  // 3. Hero 2 PNG → WebP
  const hero2Path = path.join(BASE, 'hero', 'hero2.png')
  if (fs.existsSync(hero2Path)) {
    try {
      const out = await optimizePngToWebp(hero2Path)
      const storagePath = `tenants/${SLUG}/hero/hero2.webp`
      await upload(storagePath, out, 'image/webp')
      const stats = fs.statSync(hero2Path)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB (PNG) → ${(out.length / 1024).toFixed(1)} KB (WebP)`)
      ok++
      const localWebp = path.join(BASE, 'hero', 'hero2.webp')
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ hero2.png: ${e.message}`)
      err++
    }
  } else {
    console.warn(`⚠️ No existe: ${hero2Path}`)
  }

  console.log(`\n📊 OK: ${ok} | Errores: ${err}`)
  process.exit(err > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
