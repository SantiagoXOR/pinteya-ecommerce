# 📸 Guía Paso a Paso: Subida de Imágenes a Supabase

**Fecha:** 2 de Noviembre, 2025  
**Imágenes optimizadas:** 16 archivos WebP (0.52 MB total)

---

## ⚠️ Nota Importante

La subida automática falló por políticas RLS del bucket de Storage. 
**Solución:** Subir manualmente desde el dashboard de Supabase.

---

## 📋 Pasos para Subir Imágenes

### 1. Ir al Dashboard de Supabase

**URL:** https://supabase.com/dashboard  
**Proyecto:** aakzspzfulgftqlgwkpb (Pinteya E-commerce)

### 2. Navegar a Storage

- Click en **Storage** en el menú lateral
- Seleccionar bucket **product-images**

### 3. Crear Carpetas por Marca

Crear las siguientes carpetas (si no existen):
- [ ] `plavicon`
- [ ] `petrilac`
- [ ] `galgo`
- [ ] `mas-color`
- [ ] `pintemas`
- [ ] `duxol`

### 4. Subir Archivos por Carpeta

**Ubicación de archivos optimizados:**  
`c:\Users\marti\Desktop\image-products-webp\`

---

#### 📁 Carpeta `plavicon/` (5 archivos):
- [ ] plavipint-fibrado-plavicon.webp (38 KB)
- [ ] plavicon-fibrado-plavicon.webp (35 KB)
- [ ] piscinas-solvente-plavipint-plavicon.webp (34 KB)
- [ ] sellador-multi-uso-plavicon.webp (31 KB)
- [ ] techos-poliuretanico.webp (33 KB)

---

#### 📁 Carpeta `petrilac/` (3 archivos):
- [ ] removedor-gel-penta-petrilac.webp (27 KB)
- [ ] protector-ladrillos-sellagres-petrilac.webp (34 KB)
- [ ] impregnante-danzke-1l-petrilac.webp (35 KB)

---

#### 📁 Carpeta `galgo/` (1 archivo):
- [ ] lija-rubi-el-galgo.webp (39 KB)

---

#### 📁 Carpeta `mas-color/` (4 archivos):
- [ ] enduido-mas-color.webp (25 KB)
- [ ] fijador-mas-color.webp (35 KB)
- [ ] ladrillo-visto-mas-color.webp (36 KB)
- [ ] latex-impulso-generico.webp (80 KB)

---

#### 📁 Carpeta `pintemas/` (2 archivos):
- [ ] aguarras-pintemas.webp (16 KB)
- [ ] thinner-pintemas.webp (16 KB)

---

#### 📁 Carpeta `duxol/` (1 archivo):
- [ ] diluyente-caucho-duxol.webp (18 KB)

---

## 5. Verificar URLs Públicas

Después de subir, verificar que las URLs sean accesibles:

**Formato esperado:**
```
https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/[marca]/[archivo].webp
```

**Ejemplos:**
- https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-fibrado-plavicon.webp
- https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mas-color/enduido-mas-color.webp

---

## 6. Actualizar Base de Datos

Una vez subidas todas las imágenes, avísame para ejecutar el SQL de actualización que asignará las URLs a las variantes de productos.

**SQL generado en:**  
`c:\Users\marti\Desktop\image-products-webp\update-urls.sql`

---

## 💡 Tip Rápido

**Drag & Drop:**  
En el dashboard de Supabase puedes arrastrar múltiples archivos a la vez a cada carpeta para subir más rápido.

---

## ✅ Checklist Final

- [ ] Carpetas creadas en Supabase Storage
- [ ] 16 archivos WebP subidos
- [ ] URLs verificadas como públicas y accesibles
- [ ] Avisar para ejecutar SQL de actualización

---

**🎯 Cuando termines de subir, avísame y ejecutaré el SQL para actualizar las variantes!**

