-- Script SQL para agregar productos de marcas argentinas a Pinteya E-commerce
-- Ejecutar en Supabase SQL Editor del proyecto: pinteya-ecommerce (aakzspzfulgftqlgwkpb)
-- URL: https://aakzspzfulgftqlgwkpb.supabase.co

-- NOTA: Este script AGREGA productos sin eliminar los existentes
-- Total de productos que se agregarán: 19 productos de marcas argentinas reconocidas

-- ========================================
-- PRODUCTOS SHERWIN WILLIAMS (4 productos)
-- ========================================
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES
('Sherwin Williams Loxon Super-Elástico 20L', 'sherwin-loxon-super-elastico-20l',
'Recubrimiento formulado con polímeros acrílicos elastoméricos que acompaña los movimientos estructurales. Impermeabilizante elastomérico con máxima durabilidad y elasticidad. Rendimiento: 1L por cada 3m². Secado al tacto: 1 hora.',
28500.00, 24200.00, 15, 9,
'{"thumbnails": ["/images/products/product-1-sm-1.png"], "previews": ["/images/products/product-1-bg-1.png"]}'),

('Sherwin Williams Loxon Super-Elástico 10L', 'sherwin-loxon-super-elastico-10l',
'Impermeabilizante elastomérico para frentes y medianeras. Alta resistencia al desgaste y mínima adherencia de suciedad. Formulado con agente antihongo y antialga.',
15800.00, 13500.00, 25, 9,
'{"thumbnails": ["/images/products/product-2-sm-1.png"], "previews": ["/images/products/product-2-bg-1.png"]}'),

('Sherwin Williams Kem Aqua Brillante 4L', 'sherwin-kem-aqua-brillante-4l',
'Esmalte para metal y madera con rápido secado y bajo olor. Terminación brillante de alta durabilidad. Base agua, fácil limpieza con agua.',
9800.00, 8300.00, 30, 7,
'{"thumbnails": ["/images/products/product-4-sm-1.png"], "previews": ["/images/products/product-4-bg-1.png"]}'),

('Sherwin Williams Kem Aqua Satinado 1L', 'sherwin-kem-aqua-satinado-1l',
'Esmalte sintético base agua para metal y madera. Secado rápido, bajo olor, alta resistencia. Terminación satinada elegante.',
3200.00, 2700.00, 45, 7,
'{"thumbnails": ["/images/products/product-5-sm-1.png"], "previews": ["/images/products/product-5-bg-1.png"]}');

-- ========================================
-- PRODUCTOS PETRILAC (4 productos)
-- ========================================
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES
('Petrilac Techesco Látex Premium 20L', 'petrilac-techesco-latex-premium-20l',
'Látex acrílico de alta calidad para interiores y exteriores. Excelente cubrimiento y durabilidad. Resistente a la intemperie y lavable.',
19500.00, 16800.00, 20, 6,
'{"thumbnails": ["/images/products/latex-exterior-sm-1.jpg"], "previews": ["/images/products/latex-exterior-bg-1.jpg"]}'),

('Petrilac Techesco Membrana Pasta 20L', 'petrilac-techesco-membrana-pasta-20l',
'Membrana impermeabilizante en pasta. Máxima protección contra filtraciones. Aplicación con llana o espátula. Ideal para terrazas y azoteas.',
32000.00, 27500.00, 8, 9,
'{"thumbnails": ["/images/products/impermeabilizante-sm-1.jpg"], "previews": ["/images/products/impermeabilizante-bg-1.jpg"]}'),

('Petrilac Ferrobet Duo 4L', 'petrilac-ferrobet-duo-4l',
'Convertidor de óxido y primer en un solo producto. Aplicación directa sobre óxido. Ahorra tiempo y dinero. Fórmula 2 en 1.',
8900.00, 7600.00, 25, 8,
'{"thumbnails": ["/images/products/antioxido-convertidor-sm-1.jpg"], "previews": ["/images/products/antioxido-convertidor-bg-1.jpg"]}'),

('Petrilac Techesco Látex Colores 4L', 'petrilac-techesco-latex-colores-4l',
'Látex acrílico premium en colores. Fácil aplicación, secado rápido, lavable. Ideal para ambientes húmedos. Amplia gama de colores.',
5800.00, 4900.00, 40, 6,
'{"thumbnails": ["/images/products/latex-colores-sm-1.jpg"], "previews": ["/images/products/latex-colores-bg-1.jpg"]}');

-- ========================================
-- PRODUCTOS SINTEPLAST (3 productos)
-- ========================================
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES
('Sinteplast Látex Blanco Mate 20L', 'sinteplast-latex-blanco-mate-20l',
'Látex acrílico blanco mate de excelente calidad. Ideal para interiores. Gran poder cubritivo y fácil aplicación.',
16800.00, 14300.00, 18, 6,
'{"thumbnails": ["/images/products/latex-blanco-sm-1.jpg"], "previews": ["/images/products/latex-blanco-bg-1.jpg"]}'),

('Sinteplast Esmalte Sintético Brillante 4L', 'sinteplast-esmalte-brillante-4l',
'Esmalte sintético de alta durabilidad. Terminación brillante profesional. Resistente a la intemperie y fácil limpieza.',
8500.00, 7200.00, 22, 7,
'{"thumbnails": ["/images/products/esmalte-blanco-sm-1.jpg"], "previews": ["/images/products/esmalte-blanco-bg-1.jpg"]}'),

('Sinteplast Esmalte Sintético Negro Mate 1L', 'sinteplast-esmalte-negro-mate-1l',
'Esmalte sintético negro mate. Excelente nivelación y secado rápido. Ideal para hierros y maderas.',
2800.00, 2400.00, 35, 7,
'{"thumbnails": ["/images/products/esmalte-negro-sm-1.jpg"], "previews": ["/images/products/esmalte-negro-bg-1.jpg"]}');

-- ========================================
-- PRODUCTOS PLAVICON (3 productos)
-- ========================================
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES
('Plavicon Antióxido Convertidor 1L', 'plavicon-antioxido-convertidor-1l',
'Antióxido convertidor que transforma el óxido en superficie protectora. Aplicación directa sin necesidad de lijar. Fórmula avanzada.',
2400.00, 2160.00, 35, 8,
'{"thumbnails": ["/images/products/antioxido-convertidor-sm-1.jpg"], "previews": ["/images/products/antioxido-convertidor-bg-1.jpg"]}'),

('Plavicon Antióxido Rojo Minio 4L', 'plavicon-antioxido-rojo-minio-4l',
'Antióxido rojo minio tradicional. Máxima protección para estructuras metálicas. Fórmula probada por décadas.',
5000.00, 4500.00, 22, 8,
'{"thumbnails": ["/images/products/antioxido-rojo-sm-1.jpg"], "previews": ["/images/products/antioxido-rojo-bg-1.jpg"]}'),

('Plavicon Esmalte Sintético Azul 1L', 'plavicon-esmalte-azul-1l',
'Esmalte sintético azul de alta calidad. Terminación brillante y duradera. Ideal para exteriores e interiores.',
2200.00, 1980.00, 28, 7,
'{"thumbnails": ["/images/products/esmalte-colores-sm-1.jpg"], "previews": ["/images/products/esmalte-colores-bg-1.jpg"]}');

-- ========================================
-- HERRAMIENTAS Y ACCESORIOS PROFESIONALES (5 productos)
-- ========================================
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES
('Set 3 Pinceles Profesionales', 'set-3-pinceles-profesionales',
'Set de 3 pinceles profesionales (Nº2, 3, 4). Cerda natural de alta calidad. Ideales para esmaltes y látex. Mango ergonómico.',
1650.00, 1485.00, 25, 11,
'{"thumbnails": ["/images/products/set-pinceles-sm-1.jpg"], "previews": ["/images/products/set-pinceles-bg-1.jpg"]}'),

('Rodillo Lana Natural 23cm + Bandeja', 'rodillo-lana-natural-23cm-bandeja',
'Kit rodillo de lana natural 23cm con bandeja plástica. Excelente absorción y distribución uniforme. Ideal para látex.',
1850.00, 1665.00, 30, 12,
'{"thumbnails": ["/images/products/rodillo-lana-sm-1.jpg"], "previews": ["/images/products/rodillo-lana-bg-1.jpg"]}'),

('Espátula Enduido Profesional 30cm', 'espatula-enduido-profesional-30cm',
'Espátula de acero inoxidable para enduido. Mango ergonómico antideslizante. Hoja flexible de alta resistencia.',
750.00, 675.00, 40, 15,
'{"thumbnails": ["/images/products/espatula-enduido-sm-1.jpg"], "previews": ["/images/products/espatula-enduido-bg-1.jpg"]}'),

('Lija al Agua Grano 220 (Pack x10)', 'lija-agua-grano-220-pack-10',
'Pack de 10 lijas al agua grano 220. Ideales para preparación de superficies antes del pintado. Resistentes al agua.',
1200.00, 1080.00, 50, 16,
'{"thumbnails": ["/images/products/lija-agua-sm-1.jpg"], "previews": ["/images/products/lija-agua-bg-1.jpg"]}'),

('Guantes Nitrilo Profesionales (Pack x50)', 'guantes-nitrilo-profesionales-pack-50',
'Guantes de nitrilo descartables profesionales. Resistentes a solventes y químicos. Talla M. Sin polvo.',
1850.00, 1665.00, 35, 5,
'{"thumbnails": ["/images/products/guantes-nitrilo-sm-1.jpg"], "previews": ["/images/products/guantes-nitrilo-bg-1.jpg"]}');

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
SELECT
  COUNT(*) as total_productos_agregados,
  'Productos de marcas argentinas agregados exitosamente a Pinteya' as mensaje
FROM products
WHERE name LIKE 'Sherwin Williams%'
   OR name LIKE 'Petrilac%'
   OR name LIKE 'Sinteplast%'
   OR name LIKE 'Plavicon%'
   OR name LIKE 'Set 3 Pinceles%'
   OR name LIKE 'Rodillo Lana%'
   OR name LIKE 'Espátula Enduido%'
   OR name LIKE 'Lija al Agua%'
   OR name LIKE 'Guantes Nitrilo%';

-- Resumen por marcas
SELECT
  CASE
    WHEN p.name LIKE 'Sherwin Williams%' THEN 'Sherwin Williams'
    WHEN p.name LIKE 'Petrilac%' THEN 'Petrilac'
    WHEN p.name LIKE 'Sinteplast%' THEN 'Sinteplast'
    WHEN p.name LIKE 'Plavicon%' THEN 'Plavicon'
    ELSE 'Herramientas y Accesorios'
  END as marca,
  COUNT(*) as cantidad_productos,
  MIN(p.price::numeric) as precio_minimo,
  MAX(p.price::numeric) as precio_maximo
FROM products p
WHERE name LIKE 'Sherwin Williams%'
   OR name LIKE 'Petrilac%'
   OR name LIKE 'Sinteplast%'
   OR name LIKE 'Plavicon%'
   OR name LIKE 'Set 3 Pinceles%'
   OR name LIKE 'Rodillo Lana%'
   OR name LIKE 'Espátula Enduido%'
   OR name LIKE 'Lija al Agua%'
   OR name LIKE 'Guantes Nitrilo%'
GROUP BY
  CASE
    WHEN p.name LIKE 'Sherwin Williams%' THEN 'Sherwin Williams'
    WHEN p.name LIKE 'Petrilac%' THEN 'Petrilac'
    WHEN p.name LIKE 'Sinteplast%' THEN 'Sinteplast'
    WHEN p.name LIKE 'Plavicon%' THEN 'Plavicon'
    ELSE 'Herramientas y Accesorios'
  END
ORDER BY cantidad_productos DESC;
