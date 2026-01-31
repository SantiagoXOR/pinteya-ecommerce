/**
 * Optimiza favicon.svg, hero1/hero2.png, combo1/2/3.png, promo (30-off, calculator, help).png y pagoalrecibir.png de pintemas y los sube a Supabase tenant-assets.
 * - Favicon: minifica SVG (quita comentarios y espacios redundantes).
 * - Hero 1/2/3, combo y promo PNG: convierte a WebP (max 1920px, calidad 76).
 * - pagoalrecibir.png: optimiza (max 420px ancho, PNG comprimido) y sube como pagoalrecibir.png.
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

const MAX_PAGOALRECIBIR_WIDTH = 420

async function optimizePagoAlRecibirPng(inputPath) {
  return sharp(inputPath)
    .resize(MAX_PAGOALRECIBIR_WIDTH, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9 })
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

  // 1b. Icon envío SVG
  const iconEnvioPath = path.join(BASE, 'icons', 'icon-envio.svg')
  if (fs.existsSync(iconEnvioPath)) {
    try {
      const raw = fs.readFileSync(iconEnvioPath)
      const out = minifySvg(raw)
      const storagePath = `tenants/${SLUG}/icons/icon-envio.svg`
      await upload(storagePath, out, 'image/svg+xml')
      console.log(`✅ ${storagePath}  ${(raw.length / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB`)
      ok++
    } catch (e) {
      console.error(`❌ icons/icon-envio.svg: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${iconEnvioPath}`)
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
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${hero2Path}`)
  }

  // 4. Hero 3 PNG → WebP
  const hero3Path = path.join(BASE, 'hero', 'hero3.png')
  if (fs.existsSync(hero3Path)) {
    try {
      const out = await optimizePngToWebp(hero3Path)
      const storagePath = `tenants/${SLUG}/hero/hero3.webp`
      await upload(storagePath, out, 'image/webp')
      const stats = fs.statSync(hero3Path)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB (PNG) → ${(out.length / 1024).toFixed(1)} KB (WebP)`)
      ok++
      const localWebp = path.join(BASE, 'hero', 'hero3.webp')
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ hero3.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${hero3Path}`)
  }

  // 5–7. Combo 1, 2, 3 PNG → WebP
  const combos = ['combo1', 'combo2', 'combo3']
  const combosBase = path.join(BASE, 'combos')
  for (const name of combos) {
    const pngPath = path.join(combosBase, `${name}.png`)
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
      const localWebp = path.join(combosBase, `${name}.webp`)
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ ${name}.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  // 7–9. Promo cards: 30-off, calculator, help PNG → WebP (cards Products, Calculator, Help)
  const promos = ['30-off', 'calculator', 'help']
  const promoBase = path.join(BASE, 'promo')
  for (const name of promos) {
    const pngPath = path.join(promoBase, `${name}.png`)
    if (!fs.existsSync(pngPath)) {
      console.warn(`⚠️ No existe: ${pngPath}`)
      continue
    }
    try {
      const out = await optimizePngToWebp(pngPath)
      const storagePath = `tenants/${SLUG}/promo/${name}.webp`
      await upload(storagePath, out, 'image/webp')
      const stats = fs.statSync(pngPath)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB (PNG) → ${(out.length / 1024).toFixed(1)} KB (WebP)`)
      ok++
      const localWebp = path.join(promoBase, `${name}.webp`)
      fs.mkdirSync(path.dirname(localWebp), { recursive: true })
      fs.writeFileSync(localWebp, out)
    } catch (e) {
      console.error(`❌ promo ${name}.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  // 10. Tu pedido en mano (pagoalrecibir) PNG optimizado
  const pagoAlRecibirPath = path.join(BASE, 'pagoalrecibir.png')
  if (fs.existsSync(pagoAlRecibirPath)) {
    try {
      const out = await optimizePagoAlRecibirPng(pagoAlRecibirPath)
      const storagePath = `tenants/${SLUG}/pagoalrecibir.png`
      await upload(storagePath, out, 'image/png')
      const stats = fs.statSync(pagoAlRecibirPath)
      console.log(`✅ ${storagePath}  ${(stats.size / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB (PNG optimizado)`)
      ok++
    } catch (e) {
      console.error(`❌ pagoalrecibir.png: ${e.message}`)
      err++
    }
    await new Promise((r) => setTimeout(r, 150))
  } else {
    console.warn(`⚠️ No existe: ${pagoAlRecibirPath}`)
  }

  console.log(`\n📊 OK: ${ok} | Errores: ${err}`)
  process.exit(err > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
