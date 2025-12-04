-- Migración completa y correcta del CSV productos_pinteya.csv
-- Este script incluye TODOS los productos y variantes del CSV

-- Limpiar tablas existentes
TRUNCATE TABLE product_variants RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE product_variants_id_seq RESTART WITH 1;

-- Insertar todos los productos base del CSV
INSERT INTO products (id, name, slug, description, price, discounted_price, brand_id, stock, category_id, image_ids, is_active, is_featured) VALUES
-- Productos simples (sin variantes)
(1, 'Pincel Persianero', 'pincel-persianero-elefante', 'Pincel persianero de alta calidad marca Elefante', 2500.00, 2250.00, 1, 50, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(2, 'Rodillo 22cm Lanar Elefante', 'rodillo-22cm-lanar-elefante', 'Rodillo de 22cm con pelo lanar marca Elefante', 3200.00, 2880.00, 1, 30, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(3, 'Plavipint Techos Poliuretánico', 'plavipint-techos-poliuretanico-sinteplast', 'Pintura para techos poliuretánica Plavipint marca Sinteplast', 8500.00, 7650.00, 2, 25, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(4, 'Membrana Performa', 'membrana-performa-sinteplast', 'Membrana impermeabilizante Performa marca Sinteplast', 12000.00, 10800.00, 2, 20, 3, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(5, 'Látex Frentes', 'latex-frentes-sinteplast', 'Látex para frentes marca Sinteplast', 6800.00, 6120.00, 2, 40, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(6, 'Látex Interior', 'latex-interior-sinteplast', 'Látex para interiores marca Sinteplast', 5900.00, 5310.00, 2, 35, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(7, 'Cielorraso', 'cielorraso-sinteplast', 'Pintura para cielorraso marca Sinteplast', 5200.00, 4680.00, 2, 30, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(8, 'Látex Muros', 'latex-muros-sinteplast', 'Látex para muros marca Sinteplast', 6200.00, 5580.00, 2, 25, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(9, 'Recuplast Interior', 'recuplast-interior-sinteplast', 'Recuplast para interiores marca Sinteplast', 7800.00, 7020.00, 2, 20, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(10, 'Recuplast Baño y Cocina Antihumedad', 'recuplast-bano-cocina-antihumedad-sinteplast', 'Recuplast antihumedad para baño y cocina marca Sinteplast', 8900.00, 8010.00, 2, 15, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(11, 'Poximix Interior', 'poximix-interior-sinteplast', 'Poximix para interiores marca Sinteplast', 9200.00, 8280.00, 2, 18, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),

-- Productos con variantes múltiples
(12, 'Sintético Converlux', 'sintetico-converlux-petrilac', 'Sintético Converlux marca Petrilac disponible en múltiples colores y medidas', 0.00, 0.00, 3, 0, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(13, 'Barniz Campbell', 'barniz-campbell-petrilac', 'Barniz Campbell marca Petrilac', 4800.00, 4320.00, 3, 25, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(14, 'Cinta Papel Blanca', 'cinta-papel-blanca-varios', 'Cinta de papel blanca disponible en varios anchos', 0.00, 0.00, 4, 0, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(15, 'Poximix Exterior', 'poximix-exterior-sinteplast', 'Poximix para exteriores marca Sinteplast disponible en múltiples medidas', 0.00, 0.00, 2, 0, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(16, 'Lija al Agua', 'lija-al-agua-varios', 'Lija al agua disponible en múltiples granos', 0.00, 0.00, 4, 0, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(17, 'Bandeja Chata para Pintura', 'bandeja-chata-pintura-varios', 'Bandeja chata para pintura', 1800.00, 1620.00, 4, 40, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(18, 'Pinceleta para Obra V2 N40', 'pinceleta-obra-v2-n40-varios', 'Pinceleta para obra V2 N40', 2200.00, 1980.00, 4, 35, 1, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(19, 'Impregnante Danzke', 'impregnante-danzke-petrilac', 'Impregnante Danzke marca Petrilac disponible en múltiples colores y medidas', 0.00, 0.00, 3, 0, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(20, 'Recuplast Frentes', 'recuplast-frentes-sinteplast', 'Recuplast para frentes marca Sinteplast disponible en múltiples colores y medidas', 0.00, 0.00, 2, 0, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(21, 'Sellador Multiuso Juntas y Grietas', 'sellador-multiuso-juntas-grietas-varios', 'Sellador multiuso para juntas y grietas', 3500.00, 3150.00, 4, 30, 3, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false),
(22, 'Plavipint Fibrado', 'plavipint-fibrado-sinteplast', 'Plavipint Fibrado marca Sinteplast', 9800.00, 8820.00, 2, 12, 2, ARRAY['https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'], true, false);

-- Actualizar la secuencia de productos
SELECT setval('products_id_seq', 22, true);

-- Insertar todas las variantes de productos del CSV

-- Variantes de Sintético Converlux 1L (producto_id: 12)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(12, 'AIKON-SINT-CONV-1L-BLANCO', 'Blanco', '1L', 8500.00, 7650.00, 15, 'sintetico-converlux-1l-blanco', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-NEGRO', 'Negro', '1L', 8500.00, 7650.00, 12, 'sintetico-converlux-1l-negro', '#000000', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-ROJO', 'Rojo', '1L', 8500.00, 7650.00, 10, 'sintetico-converlux-1l-rojo', '#FF0000', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-AZUL', 'Azul', '1L', 8500.00, 7650.00, 8, 'sintetico-converlux-1l-azul', '#0000FF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-VERDE', 'Verde', '1L', 8500.00, 7650.00, 14, 'sintetico-converlux-1l-verde', '#00FF00', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-AMARILLO', 'Amarillo', '1L', 8500.00, 7650.00, 11, 'sintetico-converlux-1l-amarillo', '#FFFF00', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-NARANJA', 'Naranja', '1L', 8500.00, 7650.00, 9, 'sintetico-converlux-1l-naranja', '#FFA500', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-VIOLETA', 'Violeta', '1L', 8500.00, 7650.00, 7, 'sintetico-converlux-1l-violeta', '#8A2BE2', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-ROSA', 'Rosa', '1L', 8500.00, 7650.00, 13, 'sintetico-converlux-1l-rosa', '#FFC0CB', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-MARRON', 'Marrón', '1L', 8500.00, 7650.00, 6, 'sintetico-converlux-1l-marron', '#8B4513', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-GRIS', 'Gris', '1L', 8500.00, 7650.00, 16, 'sintetico-converlux-1l-gris', '#808080', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-BEIGE', 'Beige', '1L', 8500.00, 7650.00, 18, 'sintetico-converlux-1l-beige', '#F5F5DC', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-CELESTE', 'Celeste', '1L', 8500.00, 7650.00, 5, 'sintetico-converlux-1l-celeste', '#87CEEB', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-TURQUESA', 'Turquesa', '1L', 8500.00, 7650.00, 4, 'sintetico-converlux-1l-turquesa', '#40E0D0', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-SALMON', 'Salmón', '1L', 8500.00, 7650.00, 3, 'sintetico-converlux-1l-salmon', '#FA8072', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-CORAL', 'Coral', '1L', 8500.00, 7650.00, 2, 'sintetico-converlux-1l-coral', '#FF7F50', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-LAVANDA', 'Lavanda', '1L', 8500.00, 7650.00, 1, 'sintetico-converlux-1l-lavanda', '#E6E6FA', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-DORADO', 'Dorado', '1L', 8500.00, 7650.00, 8, 'sintetico-converlux-1l-dorado', '#FFD700', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-PLATEADO', 'Plateado', '1L', 8500.00, 7650.00, 7, 'sintetico-converlux-1l-plateado', '#C0C0C0', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-1L-BRONCE', 'Bronce', '1L', 8500.00, 7650.00, 6, 'sintetico-converlux-1l-bronce', '#CD7F32', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Sintético Converlux 4L (producto_id: 12)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(12, 'AIKON-SINT-CONV-4L-BLANCO', 'Blanco', '4L', 28500.00, 25650.00, 8, 'sintetico-converlux-4l-blanco', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-NEGRO', 'Negro', '4L', 28500.00, 25650.00, 6, 'sintetico-converlux-4l-negro', '#000000', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-ROJO', 'Rojo', '4L', 28500.00, 25650.00, 5, 'sintetico-converlux-4l-rojo', '#FF0000', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-AZUL', 'Azul', '4L', 28500.00, 25650.00, 4, 'sintetico-converlux-4l-azul', '#0000FF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-VERDE', 'Verde', '4L', 28500.00, 25650.00, 7, 'sintetico-converlux-4l-verde', '#00FF00', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-AMARILLO', 'Amarillo', '4L', 28500.00, 25650.00, 3, 'sintetico-converlux-4l-amarillo', '#FFFF00', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-NARANJA', 'Naranja', '4L', 28500.00, 25650.00, 2, 'sintetico-converlux-4l-naranja', '#FFA500', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-VIOLETA', 'Violeta', '4L', 28500.00, 25650.00, 1, 'sintetico-converlux-4l-violeta', '#8A2BE2', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-ROSA', 'Rosa', '4L', 28500.00, 25650.00, 9, 'sintetico-converlux-4l-rosa', '#FFC0CB', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-MARRON', 'Marrón', '4L', 28500.00, 25650.00, 10, 'sintetico-converlux-4l-marron', '#8B4513', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-GRIS', 'Gris', '4L', 28500.00, 25650.00, 11, 'sintetico-converlux-4l-gris', '#808080', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-BEIGE', 'Beige', '4L', 28500.00, 25650.00, 12, 'sintetico-converlux-4l-beige', '#F5F5DC', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-CELESTE', 'Celeste', '4L', 28500.00, 25650.00, 13, 'sintetico-converlux-4l-celeste', '#87CEEB', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-TURQUESA', 'Turquesa', '4L', 28500.00, 25650.00, 14, 'sintetico-converlux-4l-turquesa', '#40E0D0', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-SALMON', 'Salmón', '4L', 28500.00, 25650.00, 15, 'sintetico-converlux-4l-salmon', '#FA8072', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-CORAL', 'Coral', '4L', 28500.00, 25650.00, 16, 'sintetico-converlux-4l-coral', '#FF7F50', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-LAVANDA', 'Lavanda', '4L', 28500.00, 25650.00, 17, 'sintetico-converlux-4l-lavanda', '#E6E6FA', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-DORADO', 'Dorado', '4L', 28500.00, 25650.00, 18, 'sintetico-converlux-4l-dorado', '#FFD700', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-PLATEADO', 'Plateado', '4L', 28500.00, 25650.00, 19, 'sintetico-converlux-4l-plateado', '#C0C0C0', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(12, 'AIKON-SINT-CONV-4L-BRONCE', 'Bronce', '4L', 28500.00, 25650.00, 20, 'sintetico-converlux-4l-bronce', '#CD7F32', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Cinta Papel Blanca (producto_id: 14)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(14, 'AIKON-CINTA-18MM', 'Blanco', '18mm', 850.00, 765.00, 100, 'cinta-papel-blanca-18mm', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(14, 'AIKON-CINTA-24MM', 'Blanco', '24mm', 950.00, 855.00, 80, 'cinta-papel-blanca-24mm', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(14, 'AIKON-CINTA-36MM', 'Blanco', '36mm', 1200.00, 1080.00, 60, 'cinta-papel-blanca-36mm', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(14, 'AIKON-CINTA-48MM', 'Blanco', '48mm', 1450.00, 1305.00, 40, 'cinta-papel-blanca-48mm', '#FFFFFF', 'Mate', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Poximix Exterior (producto_id: 15)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(15, 'AIKON-POXI-EXT-1L', 'Blanco', '1L', 12500.00, 11250.00, 20, 'poximix-exterior-1l', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(15, 'AIKON-POXI-EXT-4L', 'Blanco', '4L', 42000.00, 37800.00, 15, 'poximix-exterior-4l', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(15, 'AIKON-POXI-EXT-10L', 'Blanco', '10L', 95000.00, 85500.00, 8, 'poximix-exterior-10l', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(15, 'AIKON-POXI-EXT-20L', 'Blanco', '20L', 180000.00, 162000.00, 5, 'poximix-exterior-20l', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Lija al Agua (producto_id: 16)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(16, 'AIKON-LIJA-220', 'Gris', '220', 450.00, 405.00, 200, 'lija-al-agua-220', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(16, 'AIKON-LIJA-320', 'Gris', '320', 480.00, 432.00, 180, 'lija-al-agua-320', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(16, 'AIKON-LIJA-400', 'Gris', '400', 520.00, 468.00, 160, 'lija-al-agua-400', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(16, 'AIKON-LIJA-600', 'Gris', '600', 580.00, 522.00, 140, 'lija-al-agua-600', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(16, 'AIKON-LIJA-800', 'Gris', '800', 620.00, 558.00, 120, 'lija-al-agua-800', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(16, 'AIKON-LIJA-1000', 'Gris', '1000', 680.00, 612.00, 100, 'lija-al-agua-1000', '#808080', 'Rugoso', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Impregnante Danzke 1L (producto_id: 19)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(19, 'AIKON-DANZKE-1L-NATURAL', 'Natural', '1L', 7800.00, 7020.00, 25, 'impregnante-danzke-1l-natural', '#D2B48C', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-1L-CAOBA', 'Caoba', '1L', 7800.00, 7020.00, 20, 'impregnante-danzke-1l-caoba', '#8B4513', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-1L-NOGAL', 'Nogal', '1L', 7800.00, 7020.00, 18, 'impregnante-danzke-1l-nogal', '#654321', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-1L-CEDRO', 'Cedro', '1L', 7800.00, 7020.00, 22, 'impregnante-danzke-1l-cedro', '#DEB887', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-1L-ROBLE', 'Roble', '1L', 7800.00, 7020.00, 15, 'impregnante-danzke-1l-roble', '#A0522D', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Impregnante Danzke 4L (producto_id: 19)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(19, 'AIKON-DANZKE-4L-NATURAL', 'Natural', '4L', 26500.00, 23850.00, 12, 'impregnante-danzke-4l-natural', '#D2B48C', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-4L-CAOBA', 'Caoba', '4L', 26500.00, 23850.00, 10, 'impregnante-danzke-4l-caoba', '#8B4513', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-4L-NOGAL', 'Nogal', '4L', 26500.00, 23850.00, 8, 'impregnante-danzke-4l-nogal', '#654321', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-4L-CEDRO', 'Cedro', '4L', 26500.00, 23850.00, 14, 'impregnante-danzke-4l-cedro', '#DEB887', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(19, 'AIKON-DANZKE-4L-ROBLE', 'Roble', '4L', 26500.00, 23850.00, 6, 'impregnante-danzke-4l-roble', '#A0522D', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Variantes de Recuplast Frentes (producto_id: 20)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, variant_slug, color_hex, finish, variant_image_url) VALUES
(20, 'AIKON-RECUP-FRENTES-1L-BLANCO', 'Blanco', '1L', 9200.00, 8280.00, 30, 'recuplast-frentes-1l-blanco', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-1L-MARFIL', 'Marfil', '1L', 9200.00, 8280.00, 25, 'recuplast-frentes-1l-marfil', '#FFFFF0', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-1L-BEIGE', 'Beige', '1L', 9200.00, 8280.00, 20, 'recuplast-frentes-1l-beige', '#F5F5DC', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-1L-GRIS-CLARO', 'Gris Claro', '1L', 9200.00, 8280.00, 18, 'recuplast-frentes-1l-gris-claro', '#D3D3D3', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-4L-BLANCO', 'Blanco', '4L', 31500.00, 28350.00, 15, 'recuplast-frentes-4l-blanco', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-4L-MARFIL', 'Marfil', '4L', 31500.00, 28350.00, 12, 'recuplast-frentes-4l-marfil', '#FFFFF0', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-4L-BEIGE', 'Beige', '4L', 31500.00, 28350.00, 10, 'recuplast-frentes-4l-beige', '#F5F5DC', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-4L-GRIS-CLARO', 'Gris Claro', '4L', 31500.00, 28350.00, 8, 'recuplast-frentes-4l-gris-claro', '#D3D3D3', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-10L-BLANCO', 'Blanco', '10L', 72000.00, 64800.00, 6, 'recuplast-frentes-10l-blanco', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-10L-MARFIL', 'Marfil', '10L', 72000.00, 64800.00, 4, 'recuplast-frentes-10l-marfil', '#FFFFF0', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-10L-BEIGE', 'Beige', '10L', 72000.00, 64800.00, 3, 'recuplast-frentes-10l-beige', '#F5F5DC', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-10L-GRIS-CLARO', 'Gris Claro', '10L', 72000.00, 64800.00, 2, 'recuplast-frentes-10l-gris-claro', '#D3D3D3', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-20L-BLANCO', 'Blanco', '20L', 135000.00, 121500.00, 3, 'recuplast-frentes-20l-blanco', '#FFFFFF', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-20L-MARFIL', 'Marfil', '20L', 135000.00, 121500.00, 2, 'recuplast-frentes-20l-marfil', '#FFFFF0', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-20L-BEIGE', 'Beige', '20L', 135000.00, 121500.00, 1, 'recuplast-frentes-20l-beige', '#F5F5DC', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg'),
(20, 'AIKON-RECUP-FRENTES-20L-GRIS-CLARO', 'Gris Claro', '20L', 135000.00, 121500.00, 1, 'recuplast-frentes-20l-gris-claro', '#D3D3D3', 'Satinado', 'https://acdn.mitiendanube.com/stores/001/151/509/products/img_20191203_1216111-4f0b5b8b4e0c1b8b8f15756043081-1024-1024.jpg');

-- Actualizar la secuencia de product_variants
SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants), true);

-- Verificación final
SELECT 
    'Productos insertados' as tipo,
    COUNT(*) as cantidad
FROM products
UNION ALL
SELECT 
    'Variantes insertadas' as tipo,
    COUNT(*) as cantidad
FROM product_variants;