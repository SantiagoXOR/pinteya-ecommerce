-- ===================================
-- PRODUCTOS REALES DE MARCAS ARGENTINAS PARA PINTEYA
-- ===================================
-- Productos extraídos de Sherwin Williams, Petrilac, Sinteplast y Plavicon
-- Ejecutar DESPUÉS de supabase-schema.sql

-- Limpiar productos existentes
DELETE FROM products;

-- Insertar productos reales de marcas argentinas con precios actualizados 2024
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES

-- ===================================
-- SHERWIN WILLIAMS ARGENTINA
-- ===================================

-- Impermeabilizantes Sherwin Williams
('Sherwin Williams Loxon Larga Duración Super-Elástico 20L', 'sherwin-loxon-super-elastico-20l',
'Recubrimiento formulado con polímeros acrílicos elastoméricos que acompaña los movimientos estructurales. Impermeabilizante elastomérico con máxima durabilidad y elasticidad. Rendimiento: 1L por cada 3m². Secado al tacto: 1 hora.',
28500.00, 24200.00, 15,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-1-sm-1.png"], "previews": ["/images/products/product-1-bg-1.png"]}'),

('Sherwin Williams Loxon Larga Duración Super-Elástico 10L', 'sherwin-loxon-super-elastico-10l',
'Impermeabilizante elastomérico para frentes y medianeras. Alta resistencia al desgaste y mínima adherencia de suciedad. Formulado con agente antihongo y antialga.',
15800.00, 13500.00, 25,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-2-sm-1.png"], "previews": ["/images/products/product-2-bg-1.png"]}'),

('Sherwin Williams Loxon Larga Duración Super-Elástico 4L', 'sherwin-loxon-super-elastico-4l',
'Impermeabilizante elastomérico de alta calidad. Ideal para reparaciones y trabajos menores. Excelente nivelación y mínimo salpicado.',
7200.00, 6100.00, 35,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-3-sm-1.png"], "previews": ["/images/products/product-3-bg-1.png"]}'),

('Sherwin Williams Kem Aqua Brillante 4L', 'sherwin-kem-aqua-brillante-4l',
'Esmalte para metal y madera con rápido secado y bajo olor. Terminación brillante de alta durabilidad. Base agua, fácil limpieza.',
9800.00, 8300.00, 30,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-4-sm-1.png"], "previews": ["/images/products/product-4-bg-1.png"]}'),

('Sherwin Williams Kem Aqua Brillante 1L', 'sherwin-kem-aqua-brillante-1l',
'Esmalte sintético base agua para metal y madera. Secado rápido, bajo olor, alta resistencia. Ideal para interiores y exteriores.',
3200.00, 2700.00, 45,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-5-sm-1.png"], "previews": ["/images/products/product-5-bg-1.png"]}'),

-- ===================================
-- PETRILAC ARGENTINA
-- ===================================

-- Línea Techesco - Látex y Membranas
('Petrilac Techesco Látex Interior-Exterior 20L', 'petrilac-techesco-latex-20l',
'Látex acrílico mate con gran poder cubritivo, resistente a la intemperie. Apto para revoques gruesos y finos, fibrocemento y yeso. Rendimiento: 10-12 m²/L por mano.',
19500.00, 16800.00, 20,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-6-sm-1.png"], "previews": ["/images/products/product-6-bg-1.png"]}'),

('Petrilac Techesco Látex Interior-Exterior 4L', 'petrilac-techesco-latex-4l',
'Pintura látex acrílica de fácil aplicación con buena nivelación y lavabilidad. Color blanco, entonable con sistemas tintométricos.',
5800.00, 4900.00, 40,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-7-sm-1.png"], "previews": ["/images/products/product-7-bg-1.png"]}'),

('Petrilac Techesco Membrana Pasta 20L', 'petrilac-techesco-membrana-pasta-20l',
'Membrana impermeabilizante en pasta para techos. Máxima protección contra filtraciones. Aplicación directa sobre diferentes superficies.',
32000.00, 27500.00, 12,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-8-sm-1.png"], "previews": ["/images/products/product-8-bg-1.png"]}'),

('Petrilac Techesco Membrana Líquida 20L', 'petrilac-techesco-membrana-liquida-20l',
'Membrana líquida impermeabilizante para techos y terrazas. Fácil aplicación a pincel o rodillo. Excelente adherencia y flexibilidad.',
28500.00, 24200.00, 15,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-2.png"]}'),

-- Línea Ferrobet - Metales
('Petrilac Ferrobet Duo 4L', 'petrilac-ferrobet-duo-4l',
'Convertidor de óxido y esmalte 2 en 1. Convierte el óxido y protege en una sola aplicación. Para superficies metálicas interiores y exteriores.',
8900.00, 7600.00, 25,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-2.png"]}'),

('Petrilac Ferrobet Duo 1L', 'petrilac-ferrobet-duo-1l',
'Esmalte convertidor de óxido. Transforma el óxido en una capa protectora. Ideal para hierros, rejas y estructuras metálicas.',
3200.00, 2700.00, 50,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-3-sm-2.png"], "previews": ["/images/products/product-3-bg-2.png"]}'),

('Petrilac Ferrobet Convertidor de Óxido 1L', 'petrilac-ferrobet-convertidor-1l',
'Convertidor de óxido tradicional. Neutraliza el óxido existente y prepara la superficie para el acabado final. Base para sistema anticorrosivo.',
2800.00, 2400.00, 60,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-4-sm-2.png"], "previews": ["/images/products/product-4-bg-2.png"]}'),

-- Línea Maderas Petrilac
('Petrilac Danzke H2O Classic 4L', 'petrilac-danzke-h2o-classic-4l',
'Lasur protector para maderas base agua. Protección UV, resistente a la intemperie. Realza la veta natural de la madera. Múltiples colores disponibles.',
12500.00, 10600.00, 20,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-5-sm-2.png"], "previews": ["/images/products/product-5-bg-2.png"]}'),

('Petrilac Xylasol Lasur 4L', 'petrilac-xylasol-lasur-4l',
'Lasur brillante para maderas exteriores e interiores. Protección contra rayos UV y hongos. Fácil aplicación a pincel.',
11800.00, 10000.00, 25,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-6-sm-2.png"], "previews": ["/images/products/product-6-bg-2.png"]}'),

-- ===================================
-- SINTEPLAST ARGENTINA
-- ===================================

-- Línea Arquitectónica Sinteplast
('Sinteplast Látex Interior Premium 20L', 'sinteplast-latex-interior-premium-20l',
'Pintura látex interior de máxima calidad. Excelente cubrimiento, lavabilidad superior. Terminación mate sedosa. Bajo olor.',
21500.00, 18300.00, 18,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-7-sm-2.png"], "previews": ["/images/products/product-7-bg-2.png"]}'),

('Sinteplast Látex Exterior 20L', 'sinteplast-latex-exterior-20l',
'Látex acrílico para exteriores. Resistencia a la intemperie y rayos UV. Excelente adherencia sobre diferentes sustratos.',
23000.00, 19500.00, 15,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-8-sm-2.png"], "previews": ["/images/products/product-8-bg-1.png"]}'),

('Sinteplast Esmalte Sintético Brillante 4L', 'sinteplast-esmalte-sintetico-brillante-4l',
'Esmalte sintético de alta calidad para madera y metal. Terminación brillante duradera. Secado rápido, fácil aplicación.',
8200.00, 6900.00, 30,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-1-sm-1.png"], "previews": ["/images/products/product-1-bg-1.png"]}'),

('Sinteplast Hidroesmalte Satinado 4L', 'sinteplast-hidroesmalte-satinado-4l',
'Esmalte base agua para interiores. Terminación satinada, bajo olor, secado rápido. Ideal para maderas y metales.',
7800.00, 6600.00, 35,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-2-sm-1.png"], "previews": ["/images/products/product-2-bg-1.png"]}'),

-- ===================================
-- PLAVICON ARGENTINA
-- ===================================

-- Línea Protección Plavicon
('Plavicon Fibrado Silicona 20L', 'plavicon-fibrado-silicona-20l',
'Membrana hidrófuga para techos con nueva tecnología. Transitable, hidrorepelente. Máxima protección contra filtraciones.',
35000.00, 29800.00, 10,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-3-sm-1.png"], "previews": ["/images/products/product-3-bg-1.png"]}'),

('Plavicon Impermeabilizante Techos 20L', 'plavicon-impermeabilizante-techos-20l',
'Impermeabilizante acrílico para techos. Tecnología XP eXTRA PERFORMA. Resistente a la intemperie y rayos UV.',
26500.00, 22500.00, 15,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-4-sm-1.png"], "previews": ["/images/products/product-4-bg-1.png"]}'),

('Plavicon Látex Interior Hábitat 20L', 'plavicon-latex-interior-habitat-20l',
'Látex interior línea Hábitat. Sistema Colorpak para múltiples colores. Excelente cubrimiento y lavabilidad.',
18500.00, 15700.00, 25,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-5-sm-1.png"], "previews": ["/images/products/product-5-bg-1.png"]}'),

('Plavicon Látex Exterior Profesional 20L', 'plavicon-latex-exterior-profesional-20l',
'Látex profesional para exteriores. Máxima resistencia a la intemperie. Tecnología avanzada de protección.',
24000.00, 20400.00, 20,
(SELECT id FROM categories WHERE slug = 'pinturas-latex'),
'{"thumbnails": ["/images/products/product-6-sm-1.png"], "previews": ["/images/products/product-6-bg-1.png"]}'),

('Plavicon Esmalte Sintético Profesional 4L', 'plavicon-esmalte-sintetico-profesional-4l',
'Esmalte sintético línea profesional. Alta resistencia y durabilidad. Terminación brillante superior.',
9200.00, 7800.00, 30,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-7-sm-1.png"], "previews": ["/images/products/product-7-bg-1.png"]}'),

('Plavicon Convertidor de Óxido 1L', 'plavicon-convertidor-oxido-1l',
'Convertidor de óxido de alta eficiencia. Neutraliza el óxido y prepara la superficie. Base para sistema anticorrosivo.',
3500.00, 2980.00, 45,
(SELECT id FROM categories WHERE slug = 'pinturas-esmalte'),
'{"thumbnails": ["/images/products/product-8-sm-1.png"], "previews": ["/images/products/product-8-bg-1.png"]}'),

-- ===================================
-- HERRAMIENTAS Y ACCESORIOS PROFESIONALES
-- ===================================

-- Herramientas de Aplicación
('Rodillo Antigota Profesional 23cm', 'rodillo-antigota-profesional-23cm',
'Rodillo antigota profesional con mango ergonómico. Ideal para pinturas látex y esmaltes. Pelo sintético de alta calidad.',
4200.00, 3600.00, 50,
(SELECT id FROM categories WHERE slug = 'rodillos'),
'{"thumbnails": ["/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-2.png"]}'),

('Set Pinceles Profesionales 5 Piezas', 'set-pinceles-profesionales-5-piezas',
'Set de pinceles profesionales de diferentes tamaños (1", 2", 3", 4" y angular). Cerdas naturales y sintéticas de primera calidad.',
8500.00, 7200.00, 40,
(SELECT id FROM categories WHERE slug = 'pinceles'),
'{"thumbnails": ["/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-2.png"]}'),

('Bandeja para Rodillo con Rejilla Profesional', 'bandeja-rodillo-rejilla-profesional',
'Bandeja para rodillo con rejilla escurridora de acero inoxidable. Plástico resistente, fácil limpieza. Medidas: 23cm.',
3200.00, 2700.00, 60,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-3-sm-2.png"], "previews": ["/images/products/product-3-bg-2.png"]}'),

('Extensión Telescópica para Rodillo 1.5m', 'extension-telescopica-rodillo-15m',
'Extensión telescópica para rodillo, ajustable hasta 1.5m. Mango antideslizante, rosca universal. Ideal para techos y paredes altas.',
5800.00, 4900.00, 35,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-4-sm-2.png"], "previews": ["/images/products/product-4-bg-2.png"]}'),

-- Herramientas de Preparación
('Espátula Profesional 10cm', 'espatula-profesional-10cm',
'Espátula de acero inoxidable con mango ergonómico. Ideal para aplicación de masillas y preparación de superficies.',
2800.00, 2400.00, 70,
(SELECT id FROM categories WHERE slug = 'herramientas'),
'{"thumbnails": ["/images/products/product-5-sm-2.png"], "previews": ["/images/products/product-5-bg-2.png"]}'),

('Lija de Agua Grano 220 (Pack 10 hojas)', 'lija-agua-grano-220-pack-10',
'Lija de agua grano 220 para acabados finos. Pack de 10 hojas. Ideal para preparación de superficies antes del pintado.',
1800.00, 1500.00, 80,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-6-sm-2.png"], "previews": ["/images/products/product-6-bg-2.png"]}'),

-- ===================================
-- PRODUCTOS COMPLEMENTARIOS
-- ===================================

-- Diluyentes y Solventes
('Aguarrás Petrilac Premium 1L', 'aguarras-petrilac-premium-1l',
'Aguarrás mineral de alta pureza. Ideal para dilución de esmaltes sintéticos y limpieza de herramientas. Calidad premium.',
2200.00, 1900.00, 60,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-7-sm-2.png"], "previews": ["/images/products/product-7-bg-2.png"]}'),

('Thinner Común 1L', 'thinner-comun-1l',
'Thinner común para dilución de pinturas y limpieza de herramientas. Evaporación controlada.',
2800.00, 2400.00, 55,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-8-sm-2.png"], "previews": ["/images/products/product-8-bg-1.png"]}'),

-- Masillas y Selladores
('Masilla Plástica Petrilac 1kg', 'masilla-plastica-petrilac-1kg',
'Masilla plástica para reparación de superficies. Fácil aplicación y lijado. Excelente adherencia sobre madera y metal.',
4500.00, 3800.00, 40,
(SELECT id FROM categories WHERE slug = 'materiales-construccion'),
'{"thumbnails": ["/images/products/product-1-sm-1.png"], "previews": ["/images/products/product-1-bg-1.png"]}'),

('Sellador Acrílico Transparente 1L', 'sellador-acrilico-transparente-1l',
'Sellador acrílico transparente para madera y superficies porosas. Secado rápido, fácil aplicación.',
6200.00, 5300.00, 30,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-2-sm-1.png"], "previews": ["/images/products/product-2-bg-1.png"]}'),

-- ===================================
-- SEGURIDAD Y PROTECCIÓN
-- ===================================

('Casco de Seguridad Blanco IRAM', 'casco-seguridad-blanco-iram',
'Casco de seguridad industrial certificado IRAM. Ajuste cómodo con sistema de suspensión. Protección UV.',
6500.00, 5500.00, 25,
(SELECT id FROM categories WHERE slug = 'seguridad'),
'{"thumbnails": ["/images/products/product-3-sm-1.png"], "previews": ["/images/products/product-3-bg-1.png"]}'),

('Guantes de Trabajo Reforzados', 'guantes-trabajo-reforzados',
'Guantes de trabajo con refuerzos en palma y dedos. Excelente agarre y protección. Talla universal.',
3800.00, 3200.00, 50,
(SELECT id FROM categories WHERE slug = 'seguridad'),
'{"thumbnails": ["/images/products/product-4-sm-1.png"], "previews": ["/images/products/product-4-bg-1.png"]}'),

('Barbijo N95 (Pack 10 unidades)', 'barbijo-n95-pack-10',
'Barbijos N95 para protección respiratoria. Filtración de partículas. Pack de 10 unidades. Ideal para trabajos de lijado.',
4200.00, 3600.00, 45,
(SELECT id FROM categories WHERE slug = 'seguridad'),
'{"thumbnails": ["/images/products/product-5-sm-1.png"], "previews": ["/images/products/product-5-bg-1.png"]}'),

-- ===================================
-- PRODUCTOS ADICIONALES POPULARES
-- ===================================

('Cinta de Pintor Profesional 48mm x 50m', 'cinta-pintor-profesional-48mm-50m',
'Cinta de pintor profesional de alta adherencia. No deja residuos y protege superficies durante el pintado. Resistente a solventes.',
4200.00, 3600.00, 80,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-6-sm-1.png"], "previews": ["/images/products/product-6-bg-1.png"]}'),

('Nivel de Burbuja Profesional 60cm', 'nivel-burbuja-profesional-60cm',
'Nivel de burbuja profesional de 60cm con 3 burbujas. Precisión garantizada para trabajos de construcción y carpintería.',
9200.00, 7800.00, 20,
(SELECT id FROM categories WHERE slug = 'herramientas'),
'{"thumbnails": ["/images/products/product-7-sm-1.png"], "previews": ["/images/products/product-7-bg-1.png"]}'),

('Removedor Gel Petrilac 1L', 'removedor-gel-petrilac-1l',
'Removedor en gel para pinturas y barnices. Fácil aplicación, no gotea. Ideal para superficies verticales.',
5800.00, 4900.00, 25,
(SELECT id FROM categories WHERE slug = 'accesorios-pintura'),
'{"thumbnails": ["/images/products/product-8-sm-1.png"], "previews": ["/images/products/product-8-bg-1.png"]}'),

('Enduido Plástico Interior 25kg', 'enduido-plastico-interior-25kg',
'Enduido plástico para interiores. Fácil aplicación y lijado. Excelente adherencia sobre yeso, cemento y fibrocemento.',
8500.00, 7200.00, 15,
(SELECT id FROM categories WHERE slug = 'materiales-construccion'),
'{"thumbnails": ["/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-2.png"]}'),

('Fijador Sellador Concentrado 4L', 'fijador-sellador-concentrado-4l',
'Fijador sellador concentrado para superficies porosas. Consolida y sella antes del pintado. Rendimiento: hasta 40m².',
6800.00, 5800.00, 30,
(SELECT id FROM categories WHERE slug = 'pinturas'),
'{"thumbnails": ["/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-2.png"]}')

ON CONFLICT (slug) DO NOTHING;

-- ===================================
-- CONSULTAS DE VERIFICACIÓN
-- ===================================

-- Verificar que los productos se insertaron correctamente
SELECT
  'Productos de Marcas Argentinas' as tipo,
  COUNT(*) as cantidad_total
FROM products;

-- Mostrar resumen por categoría
SELECT
  c.name as categoria,
  COUNT(p.id) as productos,
  ROUND(AVG(p.price), 2) as precio_promedio,
  MIN(p.price) as precio_min,
  MAX(p.price) as precio_max
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE c.slug IN ('pinturas', 'herramientas', 'accesorios-pintura', 'materiales-construccion', 'seguridad', 'pinturas-latex', 'pinturas-esmalte', 'pinceles', 'rodillos')
GROUP BY c.id, c.name
ORDER BY productos DESC;

-- Mostrar productos con mayor descuento (Best Sellers)
SELECT
  p.name,
  p.price as precio_original,
  p.discounted_price as precio_descuento,
  ROUND(((p.price - p.discounted_price) / p.price * 100), 0) as descuento_porcentaje,
  c.name as categoria
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.discounted_price IS NOT NULL AND p.discounted_price < p.price
ORDER BY descuento_porcentaje DESC
LIMIT 10;

-- Mostrar productos por marca
SELECT
  CASE
    WHEN p.name LIKE 'Sherwin Williams%' THEN 'Sherwin Williams'
    WHEN p.name LIKE 'Petrilac%' THEN 'Petrilac'
    WHEN p.name LIKE 'Sinteplast%' THEN 'Sinteplast'
    WHEN p.name LIKE 'Plavicon%' THEN 'Plavicon'
    ELSE 'Otros'
  END as marca,
  COUNT(*) as cantidad_productos,
  ROUND(AVG(p.price), 2) as precio_promedio
FROM products p
GROUP BY
  CASE
    WHEN p.name LIKE 'Sherwin Williams%' THEN 'Sherwin Williams'
    WHEN p.name LIKE 'Petrilac%' THEN 'Petrilac'
    WHEN p.name LIKE 'Sinteplast%' THEN 'Sinteplast'
    WHEN p.name LIKE 'Plavicon%' THEN 'Plavicon'
    ELSE 'Otros'
  END
ORDER BY cantidad_productos DESC;
