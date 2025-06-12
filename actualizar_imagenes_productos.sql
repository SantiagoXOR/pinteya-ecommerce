-- Script SQL para actualizar las imágenes de los productos de marcas argentinas
-- Ejecutar en Supabase SQL Editor del proyecto: pinteya-ecommerce (aakzspzfulgftqlgwkpb)
-- URL: https://aakzspzfulgftqlgwkpb.supabase.co

-- ========================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS SHERWIN WILLIAMS
-- ========================================

-- Sherwin Williams Loxon Super-Elástico 20L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-1-sm-1.png", "/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-1.png", "/images/products/product-1-bg-2.png"]}'
WHERE slug = 'sherwin-loxon-super-elastico-20l';

-- Sherwin Williams Loxon Super-Elástico 10L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-2-sm-1.png", "/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-1.png", "/images/products/product-2-bg-2.png"]}'
WHERE slug = 'sherwin-loxon-super-elastico-10l';

-- Sherwin Williams Kem Aqua Brillante 4L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-3-sm-1.png", "/images/products/product-3-sm-2.png"], "previews": ["/images/products/product-3-bg-1.png", "/images/products/product-3-bg-2.png"]}'
WHERE slug = 'sherwin-kem-aqua-brillante-4l';

-- Sherwin Williams Kem Aqua Satinado 1L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-4-sm-1.png", "/images/products/product-4-sm-2.png"], "previews": ["/images/products/product-4-bg-1.png", "/images/products/product-4-bg-2.png"]}'
WHERE slug = 'sherwin-kem-aqua-satinado-1l';

-- ========================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS PETRILAC
-- ========================================

-- Petrilac Techesco Látex Premium 20L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-5-sm-1.png", "/images/products/product-5-sm-2.png"], "previews": ["/images/products/product-5-bg-1.png", "/images/products/product-5-bg-2.png"]}'
WHERE slug = 'petrilac-techesco-latex-premium-20l';

-- Petrilac Techesco Membrana Pasta 20L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-6-sm-1.png", "/images/products/product-6-sm-2.png"], "previews": ["/images/products/product-6-bg-1.png", "/images/products/product-6-bg-2.png"]}'
WHERE slug = 'petrilac-techesco-membrana-pasta-20l';

-- Petrilac Ferrobet Duo 4L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-7-sm-1.png", "/images/products/product-7-sm-2.png"], "previews": ["/images/products/product-7-bg-1.png", "/images/products/product-7-bg-2.png"]}'
WHERE slug = 'petrilac-ferrobet-duo-4l';

-- Petrilac Techesco Látex Colores 4L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-8-sm-1.png", "/images/products/product-8-sm-2.png"], "previews": ["/images/products/product-8-bg-1.png"]}'
WHERE slug = 'petrilac-techesco-latex-colores-4l';

-- ========================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS SINTEPLAST
-- ========================================

-- Sinteplast Látex Blanco Mate 20L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-1-sm-1.png"], "previews": ["/images/products/product-1-bg-1.png"]}'
WHERE slug = 'sinteplast-latex-blanco-mate-20l';

-- Sinteplast Esmalte Sintético Brillante 4L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-2-sm-1.png"], "previews": ["/images/products/product-2-bg-1.png"]}'
WHERE slug = 'sinteplast-esmalte-brillante-4l';

-- Sinteplast Esmalte Sintético Negro Mate 1L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-3-sm-1.png"], "previews": ["/images/products/product-3-bg-1.png"]}'
WHERE slug = 'sinteplast-esmalte-negro-mate-1l';

-- ========================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS PLAVICON
-- ========================================

-- Plavicon Antióxido Convertidor 1L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-4-sm-1.png"], "previews": ["/images/products/product-4-bg-1.png"]}'
WHERE slug = 'plavicon-antioxido-convertidor-1l';

-- Plavicon Antióxido Rojo Minio 4L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-5-sm-1.png"], "previews": ["/images/products/product-5-bg-1.png"]}'
WHERE slug = 'plavicon-antioxido-rojo-minio-4l';

-- Plavicon Esmalte Sintético Azul 1L
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-6-sm-1.png"], "previews": ["/images/products/product-6-bg-1.png"]}'
WHERE slug = 'plavicon-esmalte-azul-1l';

-- ========================================
-- ACTUALIZAR IMÁGENES DE HERRAMIENTAS
-- ========================================

-- Set 3 Pinceles Profesionales
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-7-sm-1.png"], "previews": ["/images/products/product-7-bg-1.png"]}'
WHERE slug = 'set-3-pinceles-profesionales';

-- Rodillo Lana Natural 23cm + Bandeja
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-8-sm-1.png"], "previews": ["/images/products/product-8-bg-1.png"]}'
WHERE slug = 'rodillo-lana-natural-23cm-bandeja';

-- Espátula Enduido Profesional 30cm
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-2.png"]}'
WHERE slug = 'espatula-enduido-profesional-30cm';

-- Lija al Agua Grano 220 (Pack x10)
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-2.png"]}'
WHERE slug = 'lija-agua-grano-220-pack-10';

-- Guantes Nitrilo Profesionales (Pack x50)
UPDATE products 
SET images = '{"thumbnails": ["/images/products/product-3-sm-2.png"], "previews": ["/images/products/product-3-bg-2.png"]}'
WHERE slug = 'guantes-nitrilo-profesionales-pack-50';

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
SELECT 
  COUNT(*) as productos_actualizados,
  'Imágenes actualizadas correctamente para productos de marcas argentinas' as mensaje
FROM products 
WHERE slug IN (
  'sherwin-loxon-super-elastico-20l',
  'sherwin-loxon-super-elastico-10l',
  'sherwin-kem-aqua-brillante-4l',
  'sherwin-kem-aqua-satinado-1l',
  'petrilac-techesco-latex-premium-20l',
  'petrilac-techesco-membrana-pasta-20l',
  'petrilac-ferrobet-duo-4l',
  'petrilac-techesco-latex-colores-4l',
  'sinteplast-latex-blanco-mate-20l',
  'sinteplast-esmalte-brillante-4l',
  'sinteplast-esmalte-negro-mate-1l',
  'plavicon-antioxido-convertidor-1l',
  'plavicon-antioxido-rojo-minio-4l',
  'plavicon-esmalte-azul-1l',
  'set-3-pinceles-profesionales',
  'rodillo-lana-natural-23cm-bandeja',
  'espatula-enduido-profesional-30cm',
  'lija-agua-grano-220-pack-10',
  'guantes-nitrilo-profesionales-pack-50'
);
