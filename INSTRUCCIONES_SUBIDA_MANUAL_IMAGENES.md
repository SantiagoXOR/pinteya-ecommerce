# 📸 Instrucciones: Subida Manual de Imágenes a Supabase

**Fecha:** 2 de Noviembre, 2025  
**Estado:** ⏳ **Pendiente de Ejecución Manual**

---

## ✅ Optimización Completada

- ✅ 16 imágenes convertidas a WebP
- ✅ Reducción del **90.3%** (5.32 MB → 0.52 MB)
- ✅ Calidad 85%, resolución máxima 1200x1200px
- ✅ Ubicación: `c:/Users/marti/Desktop/image-products-webp/`

---

## 📋 Pasos para Subir Imágenes

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. **Ir a Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Proyecto: Tu proyecto de Pinteya

2. **Navegar a Storage**
   - Storage → product-images (bucket)

3. **Crear carpetas por marca:**
   - `plavicon/`
   - `petrilac/`
   - `galgo/`
   - `mas-color/`
   - `pintemas/`
   - `duxol/`

4. **Subir archivos a cada carpeta:**

#### Carpeta `plavicon/`:
- plavipint-fibrado-plavicon.webp
- plavicon-fibrado-plavicon.webp
- piscinas-solvente-plavipint-plavicon.webp
- sellador-multi-uso-plavicon.webp
- techos-poliuretanico.webp

#### Carpeta `petrilac/`:
- removedor-gel-penta-petrilac.webp
- protector-ladrillos-sellagres-petrilac.webp
- impregnante-danzke-1l-petrilac.webp

#### Carpeta `galgo/`:
- lija-rubi-el-galgo.webp

#### Carpeta `mas-color/`:
- enduido-mas-color.webp
- fijador-mas-color.webp
- ladrillo-visto-mas-color.webp
- latex-impulso-generico.webp

#### Carpeta `pintemas/`:
- aguarras-pintemas.webp
- thinner-pintemas.webp

#### Carpeta `duxol/`:
- diluyente-caucho-duxol.webp

---

### Opción 2: Usando Supabase CLI

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Login
supabase login

# Subir archivos (ejecutar desde image-products-webp/)
cd c:/Users/marti/Desktop/image-products-webp

supabase storage cp plavipint-fibrado-plavicon.webp supabase://product-images/plavicon/plavipint-fibrado-plavicon.webp
supabase storage cp plavicon-fibrado-plavicon.webp supabase://product-images/plavicon/plavicon-fibrado-plavicon.webp
# ... repetir para cada archivo
```

---

## 🗄️ Después de Subir: Actualizar Base de Datos

### Una vez subidas las imágenes, ejecutar este SQL:

**Archivo generado:** `c:/Users/marti/Desktop/image-products-webp/update-urls.sql`

**O copiar y ejecutar:**

```sql
-- PLAVICON
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-fibrado-plavicon.webp', 
    updated_at = NOW()
WHERE product_id = 97;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavicon-fibrado-plavicon.webp', 
    updated_at = NOW()
WHERE product_id = 98;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/piscinas-solvente-plavipint-plavicon.webp', 
    updated_at = NOW()
WHERE product_id = 99;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/sellador-multi-uso-plavicon.webp', 
    updated_at = NOW()
WHERE product_id = 100;

-- PETRILAC
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/removedor-gel-penta-petrilac.webp', 
    updated_at = NOW()
WHERE product_id = 101;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/protector-ladrillos-sellagres-petrilac.webp', 
    updated_at = NOW()
WHERE product_id = 102;

-- DUXOL
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/duxol/diluyente-caucho-duxol.webp', 
    updated_at = NOW()
WHERE product_id = 103;

-- EL GALGO
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-rubi-el-galgo.webp', 
    updated_at = NOW()
WHERE product_id = 104;

-- MAS COLOR (+COLOR)
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mas-color/enduido-mas-color.webp', 
    updated_at = NOW()
WHERE product_id = 105;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mas-color/fijador-mas-color.webp', 
    updated_at = NOW()
WHERE product_id = 106;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mas-color/latex-impulso-generico.webp', 
    updated_at = NOW()
WHERE product_id = 108;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mas-color/ladrillo-visto-mas-color.webp', 
    updated_at = NOW()
WHERE product_id = 110;

-- PINTEMAS
UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/pintemas/aguarras-pintemas.webp', 
    updated_at = NOW()
WHERE product_id = 111;

UPDATE product_variants 
SET image_url = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/pintemas/thinner-pintemas.webp', 
    updated_at = NOW()
WHERE product_id = 112;

-- Verificar actualización
SELECT 
  COUNT(*) as variantes_con_imagen
FROM product_variants 
WHERE image_url IS NOT NULL;
```

---

## 📊 Resumen de Optimización

| Métrica | Valor |
|---------|-------|
| Archivos procesados | 16 |
| Tamaño original | 5.32 MB |
| Tamaño optimizado | 0.52 MB |
| Reducción | **90.3%** |
| Ahorro | 4.80 MB |

### Mejores Optimizaciones:
- **latex-impulso-generico.webp**: 1.9 MB → 79 KB (95.9% reducción)
- **thinner-pintemas.webp**: 156 KB → 16 KB (89.6% reducción)
- **protector-ladrillos-sellagres-petrilac.webp**: 329 KB → 34 KB (89.8% reducción)

---

## ✅ Checklist

- [x] Imágenes optimizadas a WebP
- [ ] Subir imágenes a Supabase Storage (dashboard/CLI)
- [ ] Ejecutar SQL de actualización
- [ ] Verificar imágenes en la UI

---

**📁 Ubicación archivos optimizados:**  
`c:/Users/marti/Desktop/image-products-webp/`

**📄 SQL de actualización:**  
`c:/Users/marti/Desktop/image-products-webp/update-urls.sql`

