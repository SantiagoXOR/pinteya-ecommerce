-- ===================================
-- DATOS DE PRUEBA ADICIONALES PARA PINTEYA
-- ===================================
-- Ejecutar DESPUÉS de migrate-products.sql

-- Insertar más categorías para testing
INSERT INTO categories (name, slug, parent_id, image_url) VALUES
('Gaming', 'gaming', 1, '/images/categories/gaming.jpg'),
('Audio', 'audio', 1, '/images/categories/audio.jpg'),
('Accesorios', 'accesorios', 1, '/images/categories/accessories.jpg'),
('Hombre', 'hombre', 2, '/images/categories/men.jpg'),
('Mujer', 'mujer', 2, '/images/categories/women.jpg'),
('Niños', 'ninos', 2, '/images/categories/kids.jpg'),
('Cocina', 'cocina', 3, '/images/categories/kitchen.jpg'),
('Decoración', 'decoracion', 3, '/images/categories/decoration.jpg'),
('Fútbol', 'futbol', 4, '/images/categories/football.jpg'),
('Fitness', 'fitness', 4, '/images/categories/fitness.jpg')
ON CONFLICT (slug) DO NOTHING;

-- Insertar productos adicionales para testing
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES

-- Productos de Gaming
('Razer DeathAdder V3', 'razer-deathadder-v3',
'Mouse gaming Razer DeathAdder V3. Sensor óptico de 30,000 DPI, switches ópticos y diseño ergonómico.',
120.00, 99.00, 25, 
(SELECT id FROM categories WHERE slug = 'gaming'),
'{"thumbnails": ["/images/products/mouse-1-sm.jpg", "/images/products/mouse-1-sm-2.jpg"], "previews": ["/images/products/mouse-1-bg.jpg", "/images/products/mouse-1-bg-2.jpg"]}'),

('Teclado Mecánico RGB', 'teclado-mecanico-rgb',
'Teclado mecánico gaming con switches Cherry MX Blue, retroiluminación RGB y teclas anti-ghosting.',
180.00, 150.00, 15,
(SELECT id FROM categories WHERE slug = 'gaming'),
'{"thumbnails": ["/images/products/keyboard-1-sm.jpg"], "previews": ["/images/products/keyboard-1-bg.jpg"]}'),

-- Productos de Audio
('Sony WH-1000XM4', 'sony-wh-1000xm4',
'Auriculares inalámbricos Sony con cancelación de ruido líder en la industria y 30 horas de batería.',
350.00, 299.00, 20,
(SELECT id FROM categories WHERE slug = 'audio'),
'{"thumbnails": ["/images/products/headphones-1-sm.jpg"], "previews": ["/images/products/headphones-1-bg.jpg"]}'),

-- Productos de Ropa Hombre
('Camiseta Básica Algodón', 'camiseta-basica-algodon',
'Camiseta básica de algodón 100%. Corte regular, disponible en varios colores. Perfecta para uso diario.',
25.00, 20.00, 100,
(SELECT id FROM categories WHERE slug = 'hombre'),
'{"thumbnails": ["/images/products/tshirt-1-sm.jpg"], "previews": ["/images/products/tshirt-1-bg.jpg"]}'),

('Jeans Slim Fit', 'jeans-slim-fit',
'Jeans de corte slim fit en denim de alta calidad. Cómodos y versátiles para cualquier ocasión.',
80.00, 65.00, 50,
(SELECT id FROM categories WHERE slug = 'hombre'),
'{"thumbnails": ["/images/products/jeans-1-sm.jpg"], "previews": ["/images/products/jeans-1-bg.jpg"]}'),

-- Productos de Ropa Mujer
('Vestido Floral Verano', 'vestido-floral-verano',
'Vestido floral ligero perfecto para el verano. Tela transpirable y diseño elegante.',
60.00, 45.00, 30,
(SELECT id FROM categories WHERE slug = 'mujer'),
'{"thumbnails": ["/images/products/dress-1-sm.jpg"], "previews": ["/images/products/dress-1-bg.jpg"]}'),

-- Productos de Cocina
('Set Cuchillos Profesional', 'set-cuchillos-profesional',
'Set de cuchillos profesionales de acero inoxidable. Incluye 6 cuchillos y taco de madera.',
150.00, 120.00, 25,
(SELECT id FROM categories WHERE slug = 'cocina'),
'{"thumbnails": ["/images/products/knives-1-sm.jpg"], "previews": ["/images/products/knives-1-bg.jpg"]}'),

('Cafetera Espresso', 'cafetera-espresso',
'Cafetera espresso automática con molinillo integrado. Prepara café de calidad barista en casa.',
400.00, 350.00, 10,
(SELECT id FROM categories WHERE slug = 'cocina'),
'{"thumbnails": ["/images/products/coffee-1-sm.jpg"], "previews": ["/images/products/coffee-1-bg.jpg"]}'),

-- Productos de Fitness
('Mancuernas Ajustables', 'mancuernas-ajustables',
'Set de mancuernas ajustables de 5 a 25kg cada una. Perfectas para entrenamiento en casa.',
200.00, 180.00, 15,
(SELECT id FROM categories WHERE slug = 'fitness'),
'{"thumbnails": ["/images/products/dumbbells-1-sm.jpg"], "previews": ["/images/products/dumbbells-1-bg.jpg"]}'),

('Esterilla Yoga Premium', 'esterilla-yoga-premium',
'Esterilla de yoga antideslizante de 6mm de grosor. Material ecológico y duradera.',
45.00, 35.00, 40,
(SELECT id FROM categories WHERE slug = 'fitness'),
'{"thumbnails": ["/images/products/yoga-mat-1-sm.jpg"], "previews": ["/images/products/yoga-mat-1-bg.jpg"]}')

ON CONFLICT (slug) DO NOTHING;

-- Verificar que los datos se insertaron correctamente
SELECT 
  'Categorías' as tipo,
  COUNT(*) as cantidad
FROM categories
UNION ALL
SELECT 
  'Productos' as tipo,
  COUNT(*) as cantidad
FROM products
UNION ALL
SELECT 
  'Productos con descuento' as tipo,
  COUNT(*) as cantidad
FROM products 
WHERE discounted_price IS NOT NULL AND discounted_price < price;

-- Mostrar resumen por categoría
SELECT 
  c.name as categoria,
  COUNT(p.id) as productos,
  AVG(p.price) as precio_promedio,
  MIN(p.price) as precio_min,
  MAX(p.price) as precio_max
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY productos DESC;
