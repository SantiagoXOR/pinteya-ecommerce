-- =====================================================
-- MIGRACIÓN COMPLETA DESDE productos_pinteya.csv
-- =====================================================
-- Este script migra todos los productos del CSV a la estructura
-- correcta de products + product_variants

-- Mapeo de categorías del CSV a IDs de la base de datos:
-- Accesorios -> 32 (Profesionales)
-- Techos -> 35 (Techos)
-- Exteriores -> 27 (Exteriores)
-- Interiores -> 29 (Interiores)
-- Humedades -> 28 (Humedades)
-- Reparaciones -> 33 (Reparaciones)
-- Maderas -> 30 (Maderas)
-- Maderas, Sintéticos -> 30 (Maderas)
-- Terminaciones, Maderas -> 36 (Terminaciones)
-- Profesionales -> 32 (Profesionales)
-- Exteriores, Techos -> 27 (Exteriores)

-- Limpiar datos existentes
TRUNCATE TABLE product_variants CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE product_variants_id_seq RESTART WITH 1;

-- =====================================================
-- INSERTAR TODOS LOS PRODUCTOS DEL CSV
-- =====================================================

INSERT INTO products (id, name, slug, brand, category_id, price, discounted_price, stock, is_active, description, images, created_at, updated_at) VALUES
-- Pinceles Persianeros (IDs 41-45)
(41, 'Pincel Persianero', 'pincel-persianero-n10-galgo', 'El Galgo', 32, 2491, 1743.7, 25, TRUE, 'Pincel persianero profesional N°10 marca Galgo. Ideal para pintar persianas, rejas y superficies con ranuras. Cerdas de alta calidad que garantizan un acabado uniforme y duradero. Mango ergonómico para mayor comodidad durante el trabajo.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n10-galgo.webp"}', NOW(), NOW()),
(42, 'Pincel Persianero', 'pincel-persianero-n15-galgo', 'El Galgo', 32, 2888, 2021.6, 20, TRUE, 'Pincel persianero profesional N°15 marca Galgo. Tamaño intermedio perfecto para trabajos de precisión en persianas y estructuras metálicas. Excelente retención de pintura y distribución uniforme.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n15-galgo.webp"}', NOW(), NOW()),
(43, 'Pincel Persianero', 'pincel-persianero-n20-galgo', 'El Galgo', 32, 3732, 2612.4, 18, TRUE, 'Pincel persianero profesional N°20 marca Galgo. Tamaño estándar para trabajos generales en persianas, rejas y carpintería metálica. Cerdas resistentes a solventes y pinturas sintéticas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n20-galgo.webp"}', NOW(), NOW()),
(44, 'Pincel Persianero', 'pincel-persianero-n25-galgo', 'El Galgo', 32, 4521, 3164.7, 15, TRUE, 'Pincel persianero profesional N°25 marca Galgo. Ideal para superficies más amplias manteniendo la precisión en ranuras y espacios reducidos. Excelente para trabajos de mantenimiento industrial.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n25-galgo.webp"}', NOW(), NOW()),
(45, 'Pincel Persianero', 'pincel-persianero-n30-galgo', 'El Galgo', 32, 7032, 4922.4, 12, TRUE, 'Pincel persianero profesional N°30 marca Galgo. El más grande de la línea, perfecto para trabajos extensos en persianas y estructuras metálicas grandes. Máxima capacidad de carga de pintura.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n30-galgo.webp"}', NOW(), NOW()),

-- Rodillo (ID 46)
(46, 'Rodillo 22cm Lanar Elefante', 'rodillo-22cm-lanar-elefante-galgo', 'El Galgo', 32, 12962, 9073.4, 30, TRUE, 'Rodillo profesional de 22cm con lana de oveja natural marca Galgo. Sistema antigoteo que evita salpicaduras. Ideal para pinturas látex y acrílicas. Excelente absorción y distribución uniforme de la pintura. Incluye arco metálico reforzado.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-22cm-lanar-elefante-galgo.webp"}', NOW(), NOW()),

-- Plavipint Techos (IDs 47-48)
(47, 'Plavipint Techos Poliuretánico', 'plavipint-techos-poliuretanico-10l-plavicon', 'Plavicon', 35, 80032, 56022.4, 15, TRUE, 'Membrana líquida poliuretánica para techos marca Plavicon. Excelente impermeabilización y resistencia a la intemperie. Aplicación directa sobre diversos sustratos. Elasticidad permanente que resiste movimientos estructurales. Rendimiento: 1.5-2 kg/m².', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-10l-plavicon.webp"}', NOW(), NOW()),
(48, 'Plavipint Techos Poliuretánico', 'plavipint-techos-poliuretanico-20l-plavicon', 'Plavicon', 35, 144341, 101038.7, 10, TRUE, 'Membrana líquida poliuretánica para techos marca Plavicon presentación 20L. Máxima protección contra filtraciones. Resistente a rayos UV, granizo y cambios térmicos extremos. Ideal para techos planos y con pendiente.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-20l-plavicon.webp"}', NOW(), NOW()),

-- Membrana Performa (ID 49)
(49, 'Membrana Performa', 'membrana-performa-20l-plavicon', 'Plavicon', 35, 103000, 72100, 12, TRUE, 'Membrana líquida acrílica Performa de Plavicon. Impermeabilizante de alta performance para techos y terrazas. Excelente adherencia sobre hormigón, fibrocemento y metal. Resistencia superior a la intemperie y fácil aplicación con pincel o rodillo.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/membrana-performa-20l-plavicon.webp"}', NOW(), NOW()),

-- Látex Frentes (IDs 50-52)
(50, 'Látex Frentes', 'latex-frentes-4l-plavicon', 'Plavicon', 27, 45485, 31839.5, 25, TRUE, 'Pintura látex acrílica para frentes y exteriores marca Plavicon. Excelente resistencia a la intemperie y rayos UV. Impermeabilizante que protege contra la humedad. Acabado mate que disimula imperfecciones. Rendimiento: 10-12 m²/litro.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-4l-plavicon.webp"}', NOW(), NOW()),
(51, 'Látex Frentes', 'latex-frentes-10l-plavicon', 'Plavicon', 27, 96886, 67820.2, 18, TRUE, 'Pintura látex acrílica para frentes y exteriores marca Plavicon presentación 10L. Protección superior contra hongos y algas. Excelente cubrimiento y durabilidad. Ideal para fachadas, muros y superficies expuestas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-10l-plavicon.webp"}', NOW(), NOW()),
(52, 'Látex Frentes', 'latex-frentes-20l-plavicon', 'Plavicon', 27, 163300, 114310, 12, TRUE, 'Pintura látex acrílica para frentes y exteriores marca Plavicon presentación 20L. Máxima protección para grandes superficies. Resistencia excepcional a condiciones climáticas adversas. Aplicación fácil con excelente nivelación.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-20l-plavicon.webp"}', NOW(), NOW()),

-- Látex Interior (IDs 53-55)
(53, 'Látex Interior', 'latex-interior-4l-plavicon', 'Plavicon', 29, 41200, 28840, 30, TRUE, 'Pintura látex acrílica para interiores marca Plavicon. Acabado mate lavable con excelente cubrimiento. Baja emisión de olores y secado rápido. Ideal para dormitorios, living y espacios habitables. Fácil aplicación y limpieza.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-4l-plavicon.webp"}', NOW(), NOW()),
(54, 'Látex Interior', 'latex-interior-10l-plavicon', 'Plavicon', 29, 87700, 61390, 22, TRUE, 'Pintura látex acrílica para interiores marca Plavicon presentación 10L. Excelente lavabilidad y resistencia al roce. Disponible en base blanca para tintado. Cobertura uniforme y acabado profesional.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-10l-plavicon.webp"}', NOW(), NOW()),
(55, 'Látex Interior', 'latex-interior-20l-plavicon', 'Plavicon', 29, 153000, 107100, 15, TRUE, 'Pintura látex acrílica para interiores marca Plavicon presentación 20L. Máxima performance para grandes proyectos. Excelente relación calidad-precio. Resistente a manchas y fácil mantenimiento.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-20l-plavicon.webp"}', NOW(), NOW()),

-- Cielorraso (IDs 56-59)
(56, 'Cielorraso', 'cielorraso-1l-plavicon', 'Plavicon', 35, 10576, 7403.2, 35, TRUE, 'Pintura látex especial para cielorrasos marca Plavicon. Fórmula antihongo que previene la formación de moho y hongos. Secado rápido y sin goteo. Acabado mate que oculta imperfecciones. Ideal para baños y cocinas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-1l-plavicon.webp"}', NOW(), NOW()),
(57, 'Cielorraso', 'cielorraso-4l-plavicon', 'Plavicon', 35, 31354, 21947.8, 25, TRUE, 'Pintura látex especial para cielorrasos marca Plavicon presentación 4L. Protección antihongo de larga duración. Excelente adherencia sobre yeso, hormigón y placas. Aplicación sin salpicaduras.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-4l-plavicon.webp"}', NOW(), NOW()),
(58, 'Cielorraso', 'cielorraso-10l-plavicon', 'Plavicon', 35, 75156, 52609.2, 18, TRUE, 'Pintura látex especial para cielorrasos marca Plavicon presentación 10L. Máxima protección contra humedad y condensación. Rendimiento superior y fácil aplicación con rodillo.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-10l-plavicon.webp"}', NOW(), NOW()),
(59, 'Cielorraso', 'cielorraso-20l-plavicon', 'Plavicon', 35, 136000, 95200, 12, TRUE, 'Pintura látex especial para cielorrasos marca Plavicon presentación 20L. Solución profesional para grandes superficies. Tecnología antihongo avanzada y secado ultrarrápido.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-20l-plavicon.webp"}', NOW(), NOW()),

-- Látex Muros (IDs 60-62)
(60, 'Látex Muros', 'latex-muros-4l-plavicon', 'Plavicon', 27, 53700, 37590, 22, TRUE, 'Pintura látex impermeabilizante para muros y frentes marca Plavicon. Protección superior contra filtraciones y humedad. Resistente a hongos, algas y eflorescencias. Excelente adherencia sobre mampostería.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-4l-plavicon.webp"}', NOW(), NOW()),
(61, 'Látex Muros', 'latex-muros-10l-plavicon', 'Plavicon', 27, 118500, 82950, 16, TRUE, 'Pintura látex impermeabilizante para muros y frentes marca Plavicon presentación 10L. Tecnología de barrera contra la humedad. Acabado texturado que disimula irregularidades de la superficie.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-10l-plavicon.webp"}', NOW(), NOW()),
(62, 'Látex Muros', 'latex-muros-20l-plavicon', 'Plavicon', 27, 224370, 157059, 10, TRUE, 'Pintura látex impermeabilizante para muros y frentes marca Plavicon presentación 20L. Máxima protección para grandes proyectos. Resistencia excepcional a condiciones climáticas extremas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-20l-plavicon.webp"}', NOW(), NOW()),

-- Recuplast Interior (IDs 63-66)
(63, 'Recuplast Interior', 'recuplast-interior-1l-sinteplast', 'Sinteplast', 29, 14500, 10150, 40, TRUE, 'Pintura látex acrílica mate para interiores marca Sinteplast. Excelente cubrimiento y nivelación. Fórmula de bajo olor y secado rápido. Ideal para renovación de ambientes. Rendimiento: 12-14 m²/litro.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-1l-sinteplast.webp"}', NOW(), NOW()),
(64, 'Recuplast Interior', 'recuplast-interior-4l-sinteplast', 'Sinteplast', 29, 43233, 30263.1, 28, TRUE, 'Pintura látex acrílica mate para interiores marca Sinteplast presentación 4L. Excelente relación calidad-precio. Cobertura uniforme y acabado profesional. Disponible en base blanca para tintado.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-4l-sinteplast.webp"}', NOW(), NOW()),
(65, 'Recuplast Interior', 'recuplast-interior-10l-sinteplast', 'Sinteplast', 29, 102037, 71425.9, 20, TRUE, 'Pintura látex acrílica mate para interiores marca Sinteplast presentación 10L. Performance superior para proyectos medianos. Excelente lavabilidad y resistencia al desgaste.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-10l-sinteplast.webp"}', NOW(), NOW()),
(66, 'Recuplast Interior', 'recuplast-interior-20l-sinteplast', 'Sinteplast', 29, 172900, 121030, 14, TRUE, 'Pintura látex acrílica mate para interiores marca Sinteplast presentación 20L. Solución económica para grandes superficies. Durabilidad comprobada y fácil aplicación.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-20l-sinteplast.webp"}', NOW(), NOW()),

-- Recuplast Baño y Cocina (IDs 67-68)
(67, 'Recuplast Baño y Cocina Antihumedad', 'recuplast-bano-cocina-1l-sinteplast', 'Sinteplast', 28, 20206, 14144.2, 30, TRUE, 'Pintura látex especial para baños y cocinas marca Sinteplast. Fórmula antihumedad y antihongo. Super lavable y resistente a la condensación. Acabado satinado que facilita la limpieza. Protección duradera en ambientes húmedos.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.webp"}', NOW(), NOW()),
(68, 'Recuplast Baño y Cocina Antihumedad', 'recuplast-bano-cocina-4l-sinteplast', 'Sinteplast', 28, 66208, 46345.6, 22, TRUE, 'Pintura látex especial para baños y cocinas marca Sinteplast presentación 4L. Tecnología avanzada contra humedad y hongos. Excelente adherencia sobre azulejos previamente tratados. Resistencia superior al vapor y salpicaduras.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-4l-sinteplast.webp"}', NOW(), NOW()),

-- Poximix Interior (IDs 69-72)
(69, 'Poximix Interior', 'poximix-interior-05kg-akapol', 'Akapol', 33, 5160, 3612, 35, TRUE, 'Masilla epoxi bicomponente para reparación de grietas y fisuras interiores marca Poxipol. Excelente adherencia sobre hormigón, yeso y mampostería. Fácil aplicación y lijado. Secado rápido y pintable. Ideal para reparaciones menores.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png"}', NOW(), NOW()),
(70, 'Poximix Interior', 'poximix-interior-125kg-akapol', 'Akapol', 33, 6850, 4795, 25, TRUE, 'Masilla epoxi bicomponente para reparación de grietas y fisuras interiores marca Poxipol presentación 1.25kg. Resistencia mecánica superior. Excelente para reparaciones estructurales menores. No se contrae al secar.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-125kg-poxipol.png"}', NOW(), NOW()),
(71, 'Poximix Interior', 'poximix-interior-3kg-akapol', 'Akapol', 33, 15086, 10560.2, 18, TRUE, 'Masilla epoxi bicomponente para reparación de grietas y fisuras interiores marca Poxipol presentación 3kg. Solución profesional para reparaciones medianas. Excelente trabajabilidad y tiempo abierto.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-3kg-poxipol.png"}', NOW(), NOW()),
(72, 'Poximix Interior', 'poximix-interior-5kg-akapol', 'Akapol', 33, 24131, 16891.7, 12, TRUE, 'Masilla epoxi bicomponente para reparación de grietas y fisuras interiores marca Poxipol presentación 5kg. Máxima performance para grandes reparaciones. Resistencia química y mecánica excepcional. Uso profesional.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-5kg-poxipol.png"}', NOW(), NOW()),

-- Sintético Converlux (IDs 73-74) - Productos base para variantes
(73, 'Sintético Converlux', 'sintetico-converlux-1l-petrilac', 'Petrilac', 30, 15344, 10740.8, 28, TRUE, 'Esmalte sintético de alta calidad para maderas marca Petrilac. Excelente nivelación y brillo. Protección duradera contra la intemperie. Disponible en gran variedad de colores. Ideal para puertas, ventanas y muebles exteriores.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp"}', NOW(), NOW()),
(74, 'Sintético Converlux', 'sintetico-converlux-4l-petrilac', 'Petrilac', 30, 57422, 40195.4, 20, TRUE, 'Esmalte sintético de alta calidad para maderas marca Petrilac presentación 4L. Tecnología de protección UV. Resistente a rayado y desgaste. Acabado profesional con excelente durabilidad.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp"}', NOW(), NOW()),

-- Impregnante Danzke (IDs 75-76) - Productos base para variantes
(75, 'Impregnante Danzke', 'impregnante-danzke-1l-petrilac', 'Petrilac', 30, 23900, 16730, 25, TRUE, 'Impregnante protector para maderas marca Petrilac. Penetra profundamente protegiendo desde el interior. Previene ataques de hongos, insectos y humedad. Mantiene la textura natural de la madera. Ideal para deck, pérgolas y maderas exteriores.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp"}', NOW(), NOW()),
(76, 'Impregnante Danzke', 'impregnante-danzke-4l-petrilac', 'Petrilac', 30, 91500, 64050, 18, TRUE, 'Impregnante protector para maderas marca Petrilac presentación 4L. Protección integral contra agentes bióticos y abióticos. Fórmula de larga duración. Excelente penetración en maderas duras y blandas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp"}', NOW(), NOW()),

-- Barniz Campbell (IDs 77-78)
(77, 'Barniz Campbell', 'barniz-campbell-1l-petrilac', 'Petrilac', 36, 19843, 13890.1, 22, TRUE, 'Barniz poliuretánico transparente marca Petrilac. Excelente resistencia al desgaste y rayado. Protección UV que evita el amarillamiento. Ideal para pisos de madera, muebles y carpintería fina. Acabado brillante de alta durabilidad.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.webp"}', NOW(), NOW()),
(78, 'Barniz Campbell', 'barniz-campbell-4l-petrilac', 'Petrilac', 36, 71546, 50082.2, 15, TRUE, 'Barniz poliuretánico transparente marca Petrilac presentación 4L. Tecnología de protección avanzada. Resistencia excepcional al tráfico y uso intensivo. Aplicación profesional para grandes superficies.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-4l-petrilac.webp"}', NOW(), NOW()),

-- Cintas de Papel (IDs 79-82)
(79, 'Cinta Papel Blanca', 'cinta-papel-blanca-18mm', 'Genérico', 32, 2141, 1498.7, 50, TRUE, 'Cinta de papel para enmascarar marca genérica. Ancho 18mm x 40 metros. Adhesivo de fácil remoción que no deja residuos. Ideal para trabajos de precisión y detalles finos. Resistente a solventes de pinturas.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-18mm.webp"}', NOW(), NOW()),
(80, 'Cinta Papel Blanca', 'cinta-papel-blanca-24mm', 'Genérico', 32, 2854, 1997.8, 45, TRUE, 'Cinta de papel para enmascarar marca genérica. Ancho 24mm x 40 metros. Excelente adherencia y remoción limpia. Uso general en trabajos de pintura. Resistente a la humedad y temperatura.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-24mm.webp"}', NOW(), NOW()),
(81, 'Cinta Papel Blanca', 'cinta-papel-blanca-36mm', 'Genérico', 32, 4288, 3001.6, 40, TRUE, 'Cinta de papel para enmascarar marca genérica. Ancho 36mm x 40 metros. Tamaño estándar para la mayoría de trabajos de pintura. Protección efectiva de superficies. Fácil desenrollado y aplicación.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-36mm.webp"}', NOW(), NOW()),
(82, 'Cinta Papel Blanca', 'cinta-papel-blanca-48mm', 'Genérico', 32, 5709, 3996.3, 35, TRUE, 'Cinta de papel para enmascarar marca genérica. Ancho 48mm x 40 metros. Ideal para proteger áreas grandes y zócalos. Máxima cobertura con una sola pasada. Adhesivo balanceado para remoción sin daños.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-48mm.webp"}', NOW(), NOW()),

-- Poximix Exterior (IDs 83-86)
(83, 'Poximix Exterior', 'poximix-exterior-05kg-akapol', 'Akapol', 27, 5160, 3612, 15, TRUE, 'Poximix Exterior es ideal para reparar grietas, agujeros y huecos en las paredes y techos del exterior del hogar. Resistente a la intemperie y condiciones climáticas adversas. Presentación de 0.5kg.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-05kg-poxipol.png"}', NOW(), NOW()),
(84, 'Poximix Exterior', 'poximix-exterior-125kg-akapol', 'Akapol', 27, 6850, 4795, 12, TRUE, 'Poximix Exterior es ideal para reparar grietas, agujeros y huecos en las paredes y techos del exterior del hogar. Resistente a la intemperie y condiciones climáticas adversas. Presentación de 1.25kg.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-125kg-poxipol.png"}', NOW(), NOW()),
(85, 'Poximix Exterior', 'poximix-exterior-3kg-akapol', 'Akapol', 27, 15086, 10560.2, 8, TRUE, 'Poximix Exterior es ideal para reparar grietas, agujeros y huecos en las paredes y techos del exterior del hogar. Resistente a la intemperie y condiciones climáticas adversas. Presentación de 3kg.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-3kg-poxipol.png"}', NOW(), NOW()),
(86, 'Poximix Exterior', 'poximix-exterior-5kg-akapol', 'Akapol', 27, 24131, 16891.7, 6, TRUE, 'Poximix Exterior es ideal para reparar grietas, agujeros y huecos en las paredes y techos del exterior del hogar. Resistente a la intemperie y condiciones climáticas adversas. Presentación de 5kg.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-5kg-poxipol.png"}', NOW(), NOW()),

-- Lijas al Agua (IDs 87-91)
(87, 'Lija al Agua', 'lija-al-agua-grano-40-el-galgo', 'El Galgo', 32, 1161, 812.7, 50, TRUE, 'Lija al agua de grano 40 marca El Galgo. Ideal para lijado grueso y preparación inicial de superficies. Excelente calidad y durabilidad para trabajos profesionales de pinturería y construcción.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-40.png"}', NOW(), NOW()),
(88, 'Lija al Agua', 'lija-al-agua-grano-50-el-galgo', 'El Galgo', 32, 1161, 812.7, 50, TRUE, 'Lija al agua de grano 50 marca El Galgo. Perfecta para lijado medio y preparación de superficies. Calidad profesional para acabados superiores en trabajos de pintura.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-50.png"}', NOW(), NOW()),
(89, 'Lija al Agua', 'lija-al-agua-grano-80-el-galgo', 'El Galgo', 32, 1161, 812.7, 50, TRUE, 'Lija al agua de grano 80 marca El Galgo. Ideal para lijado medio-fino y preparación de superficies antes del acabado. Excelente adherencia y resistencia al agua.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png"}', NOW(), NOW()),
(90, 'Lija al Agua', 'lija-al-agua-grano-120-el-galgo', 'El Galgo', 32, 1161, 812.7, 50, TRUE, 'Lija al agua de grano 120 marca El Galgo. Perfecta para lijado fino y preparación final de superficies. Ideal para trabajos de precisión y acabados de alta calidad.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-120.png"}', NOW(), NOW()),
(91, 'Lija al Agua', 'lija-al-agua-grano-180-el-galgo', 'El Galgo', 32, 1161, 812.7, 50, TRUE, 'Lija al agua de grano 180 marca El Galgo. Ideal para lijado extrafino y acabados de precisión. Perfecta para preparación final antes de aplicar pinturas o barnices de alta gama.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-180.png"}', NOW(), NOW()),

-- Accesorios varios (IDs 92-93)
(92, 'Bandeja Chata para Pintura', 'bandeja-chata-para-pintura', 'Genérico', 32, 2816, 1971.2, 30, TRUE, 'Bandeja chata profesional para pintura. Ideal para cargar rodillos y distribuir uniformemente la pintura. Fabricada en plástico resistente, fácil de limpiar y reutilizable. Indispensable para trabajos de pintura profesionales.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/bandeja-chata.png"}', NOW(), NOW()),
(93, 'Pinceleta para Obra V2 N40', 'pinceleta-para-obra-n40', 'Genérico', 32, 7846, 5492.2, 40, TRUE, 'Pinceleta profesional para obra y trabajos de construcción. Cerdas de alta calidad para aplicación uniforme de pinturas, barnices y tratamientos. Mango ergonómico para mayor comodidad durante trabajos prolongados.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pinceleta-obra.png"}', NOW(), NOW()),

-- Recuplast Frentes (IDs 94-97) - Productos base para variantes
(94, 'Recuplast Frentes', 'recuplast-frentes-1l-sinteplast', 'Sinteplast', 27, 18127, 12688.9, 10, TRUE, 'Látex impermeabilizante para exteriores de alta performance. Protege las paredes de la humedad, hongos y manchas, brindando una terminación uniforme y duradera. Ideal para frentes y muros expuestos a la intemperie. Disponible en colores blanco, cemento y gris.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-1l-sinteplast.webp"}', NOW(), NOW()),
(95, 'Recuplast Frentes', 'recuplast-frentes-4l-sinteplast', 'Sinteplast', 27, 54010, 37807, 8, TRUE, 'Látex impermeabilizante para exteriores de alta performance. Protege las paredes de la humedad, hongos y manchas, brindando una terminación uniforme y duradera. Ideal para frentes y muros expuestos a la intemperie. Disponible en colores blanco, cemento y gris.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.webp"}', NOW(), NOW()),
(96, 'Recuplast Frentes', 'recuplast-frentes-10l-sinteplast', 'Sinteplast', 27, 128702, 90091.4, 7, TRUE, 'Látex impermeabilizante para exteriores de alta performance. Protege las paredes de la humedad, hongos y manchas, brindando una terminación uniforme y duradera. Ideal para frentes y muros expuestos a la intemperie. Disponible en colores blanco, cemento y gris.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-10l-sinteplast.webp"}', NOW(), NOW()),
(97, 'Recuplast Frentes', 'recuplast-frentes-20l-sinteplast', 'Sinteplast', 27, 209935, 146954.5, 20, TRUE, 'Látex impermeabilizante para exteriores de alta performance. Protege las paredes de la humedad, hongos y manchas, brindando una terminación uniforme y duradera. Ideal para frentes y muros expuestos a la intemperie. Disponible en colores blanco, cemento y gris.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-20l-sinteplast.webp"}', NOW(), NOW()),

-- Sellador y Plavipint Fibrado (IDs 98-99)
(98, 'Sellador Multiuso Juntas y Grietas', 'sellador-multiuso-juntas-y-grietas-350gr-plavicon', 'Plavicon', 27, 8530, 5971, 25, TRUE, 'Masilla elástica multipropósito para sellar grietas y juntas en techos, paredes y muros exteriores. De gran adherencia, flexible y resistente a la intemperie. Ideal para reparaciones rápidas y duraderas. Color blanco, presentación de 350 g.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/sellador-multiuso-350gr-plavicon.webp"}', NOW(), NOW()),
(99, 'Plavipint Fibrado', 'plavipint-fibrado-plavicon', 'Plavicon', 27, 0, 0, 0, FALSE, 'Revestimiento impermeabilizante fibrado para techos y terrazas. Forma una película elástica y resistente que acompaña los movimientos de dilatación y contracción, evitando filtraciones y grietas. Ideal para superficies expuestas al sol y la lluvia, con excelente adherencia y durabilidad.', '{"main": "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-fibrado-plavicon.webp"}', NOW(), NOW());

-- =====================================================
-- INSERTAR VARIANTES PARA SINTÉTICO CONVERLUX 1L
-- =====================================================

INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
-- Sintético Converlux 1L - Todas las variantes de color
(73, '3474', 'sintetico-converlux-1l-aluminio', 'ALUMINIO', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '4477', 'sintetico-converlux-1l-amarillo', 'AMARILLO', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3938', 'sintetico-converlux-1l-amarillo-mediano', 'AMARILLO MEDIANO', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3492', 'sintetico-converlux-1l-azul-marino', 'AZUL MARINO', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3478', 'sintetico-converlux-1l-azul-traful', 'AZUL TRAFUL', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3476', 'sintetico-converlux-1l-bermellon', 'BERMELLON', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '638', 'sintetico-converlux-1l-blanco-brill', 'BLANCO BRILL', '1L', 15344, 10740.8, 28, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3396', 'sintetico-converlux-1l-blanco-sat', 'BLANCO SAT', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3711', 'sintetico-converlux-1l-blanco-mate', 'BLANCO MATE', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '4476', 'sintetico-converlux-1l-gris-perla', 'GRIS PERLA', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '971', 'sintetico-converlux-1l-gris', 'GRIS', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3477', 'sintetico-converlux-1l-marfil', 'MARFIL', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '951', 'sintetico-converlux-1l-marron', 'MARRON', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3934', 'sintetico-converlux-1l-naranja', 'NARANJA', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '984', 'sintetico-converlux-1l-negro-brill', 'NEGRO BRILL', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3945', 'sintetico-converlux-1l-negro-sat', 'NEGRO SAT', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '3712', 'sintetico-converlux-1l-negro-mate', 'NEGRO MATE', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '980', 'sintetico-converlux-1l-tostado', 'TOSTADO', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '994', 'sintetico-converlux-1l-verde-ingles', 'VERDE INGLES', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW()),
(73, '993', 'sintetico-converlux-1l-verde-noche', 'VERDE NOCHE', '1L', 15344, 10740.8, 28, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.webp', NOW(), NOW());

-- =====================================================
-- INSERTAR VARIANTES PARA SINTÉTICO CONVERLUX 4L
-- =====================================================

-- Variantes para Sintético Converlux 4L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(74, '4239', 'sintetico-converlux-4l-aluminio', 'ALUMINIO', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '4643', 'sintetico-converlux-4l-amarillo', 'AMARILLO', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3943', 'sintetico-converlux-4l-amarillo-mediano', 'AMARILLO MEDIANO', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3941', 'sintetico-converlux-4l-azul-marino', 'AZUL MARINO', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '4644', 'sintetico-converlux-4l-azul-traful', 'AZUL TRAFUL', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '4645', 'sintetico-converlux-4l-bermellon', 'BERMELLON', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3484', 'sintetico-converlux-4l-blanco-brill', 'BLANCO BRILL', '4L', 57422, 40195.4, 20, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3395', 'sintetico-converlux-4l-blanco-sat', 'BLANCO SAT', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3710', 'sintetico-converlux-4l-blanco-mate', 'BLANCO MATE', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '4646', 'sintetico-converlux-4l-gris-perla', 'GRIS PERLA', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3674', 'sintetico-converlux-4l-gris', 'GRIS', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3944', 'sintetico-converlux-4l-marfil', 'MARFIL', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3949', 'sintetico-converlux-4l-marron', 'MARRON', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3942', 'sintetico-converlux-4l-naranja', 'NARANJA', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3473', 'sintetico-converlux-4l-negro-brill', 'NEGRO BRILL', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3479', 'sintetico-converlux-4l-negro-sat', 'NEGRO SAT', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '4067', 'sintetico-converlux-4l-negro-mate', 'NEGRO MATE', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3940', 'sintetico-converlux-4l-tostado', 'TOSTADO', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3475', 'sintetico-converlux-4l-verde-ingles', 'VERDE INGLES', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW()),
(74, '3835', 'sintetico-converlux-4l-verde-noche', 'VERDE NOCHE', '4L', 57422, 40195.4, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.webp', NOW(), NOW());

-- =====================================================
-- INSERTAR VARIANTES PARA IMPREGNANTE DANZKE
-- =====================================================

-- Variantes para Impregnante Danzke 1L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(75, 'DANZKE-1001', 'impregnante-danzke-1l-natural', 'NATURAL', '1L', 23900, 16730, 25, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp', NOW(), NOW()),
(75, 'DANZKE-1002', 'impregnante-danzke-1l-caoba', 'CAOBA', '1L', 23900, 16730, 20, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp', NOW(), NOW()),
(75, 'DANZKE-1003', 'impregnante-danzke-1l-cedro', 'CEDRO', '1L', 23900, 16730, 18, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp', NOW(), NOW()),
(75, 'DANZKE-1004', 'impregnante-danzke-1l-nogal', 'NOGAL', '1L', 23900, 16730, 15, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp', NOW(), NOW()),
(75, 'DANZKE-1005', 'impregnante-danzke-1l-roble', 'ROBLE', '1L', 23900, 16730, 12, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-petrilac.webp', NOW(), NOW());

-- Variantes para Impregnante Danzke 4L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(76, 'DANZKE-4001', 'impregnante-danzke-4l-natural', 'NATURAL', '4L', 91500, 64050, 18, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp', NOW(), NOW()),
(76, 'DANZKE-4002', 'impregnante-danzke-4l-caoba', 'CAOBA', '4L', 91500, 64050, 15, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp', NOW(), NOW()),
(76, 'DANZKE-4003', 'impregnante-danzke-4l-cedro', 'CEDRO', '4L', 91500, 64050, 12, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp', NOW(), NOW()),
(76, 'DANZKE-4004', 'impregnante-danzke-4l-nogal', 'NOGAL', '4L', 91500, 64050, 10, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp', NOW(), NOW()),
(76, 'DANZKE-4005', 'impregnante-danzke-4l-roble', 'ROBLE', '4L', 91500, 64050, 8, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-4l-petrilac.webp', NOW(), NOW());

-- =====================================================
-- INSERTAR VARIANTES PARA RECUPLAST FRENTES
-- =====================================================

-- Variantes para Recuplast Frentes 1L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(94, 'RECUP-F1001', 'recuplast-frentes-1l-blanco', 'BLANCO', '1L', 18127, 12688.9, 10, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-1l-sinteplast.webp', NOW(), NOW()),
(94, 'RECUP-F1002', 'recuplast-frentes-1l-cemento', 'CEMENTO', '1L', 18127, 12688.9, 8, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-1l-sinteplast.webp', NOW(), NOW()),
(94, 'RECUP-F1003', 'recuplast-frentes-1l-gris', 'GRIS', '1L', 18127, 12688.9, 6, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-1l-sinteplast.webp', NOW(), NOW());

-- Variantes para Recuplast Frentes 4L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(95, 'RECUP-F4001', 'recuplast-frentes-4l-blanco', 'BLANCO', '4L', 54010, 37807, 8, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.webp', NOW(), NOW()),
(95, 'RECUP-F4002', 'recuplast-frentes-4l-cemento', 'CEMENTO', '4L', 54010, 37807, 6, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.webp', NOW(), NOW()),
(95, 'RECUP-F4003', 'recuplast-frentes-4l-gris', 'GRIS', '4L', 54010, 37807, 4, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.webp', NOW(), NOW());

-- Variantes para Recuplast Frentes 10L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(96, 'RECUP-F10001', 'recuplast-frentes-10l-blanco', 'BLANCO', '10L', 128702, 90091.4, 7, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-10l-sinteplast.webp', NOW(), NOW()),
(96, 'RECUP-F10002', 'recuplast-frentes-10l-cemento', 'CEMENTO', '10L', 128702, 90091.4, 5, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-10l-sinteplast.webp', NOW(), NOW()),
(96, 'RECUP-F10003', 'recuplast-frentes-10l-gris', 'GRIS', '10L', 128702, 90091.4, 3, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-10l-sinteplast.webp', NOW(), NOW());

-- Variantes para Recuplast Frentes 20L
INSERT INTO product_variants (product_id, aikon_id, variant_slug, color_name, measure, price_list, price_sale, stock, is_active, is_default, image_url, created_at, updated_at) VALUES
(97, 'RECUP-F20001', 'recuplast-frentes-20l-blanco', 'BLANCO', '20L', 209935, 146954.5, 20, TRUE, TRUE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-20l-sinteplast.webp', NOW(), NOW()),
(97, 'RECUP-F20002', 'recuplast-frentes-20l-cemento', 'CEMENTO', '20L', 209935, 146954.5, 15, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-20l-sinteplast.webp', NOW(), NOW()),
(97, 'RECUP-F20003', 'recuplast-frentes-20l-gris', 'GRIS', '20L', 209935, 146954.5, 10, TRUE, FALSE, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-20l-sinteplast.webp', NOW(), NOW());

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar productos insertados
SELECT 'Productos insertados:' as info, COUNT(*) as total FROM products;

-- Verificar variantes insertadas
SELECT 'Variantes insertadas:' as info, COUNT(*) as total FROM product_variants;

-- Verificar Sintético Converlux específicamente
SELECT 
    p.name,
    p.brand,
    COUNT(pv.id) as total_variantes,
    STRING_AGG(DISTINCT pv.measure, ', ') as medidas,
    STRING_AGG(DISTINCT pv.color_name, ', ' ORDER BY pv.color_name) as colores
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.name ILIKE '%sintético converlux%'
GROUP BY p.id, p.name, p.brand
ORDER BY p.id;

COMMIT;