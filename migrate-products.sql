-- ===================================
-- MIGRACIÓN DE PRODUCTOS DESDE shopData.ts
-- ===================================
-- Ejecutar DESPUÉS del esquema principal

-- Insertar productos basados en shopData.ts
INSERT INTO products (name, slug, description, price, discounted_price, stock, category_id, images) VALUES

-- Producto 1: Havit HV-G69 USB Gamepad
('Havit HV-G69 USB Gamepad', 'havit-hv-g69-usb-gamepad', 
'Gamepad USB de alta calidad para gaming. Compatible con PC y consolas. Diseño ergonómico y controles precisos.', 
59.00, 29.00, 50, 1,
'{"thumbnails": ["/images/products/product-1-sm-1.png", "/images/products/product-1-sm-2.png"], "previews": ["/images/products/product-1-bg-1.png", "/images/products/product-1-bg-2.png"]}'),

-- Producto 2: iPhone 14 Plus
('iPhone 14 Plus, 6/128GB', 'iphone-14-plus-6-128gb',
'iPhone 14 Plus con 6GB de RAM y 128GB de almacenamiento. Pantalla Super Retina XDR de 6.7 pulgadas. Cámara principal de 48MP.',
899.00, 799.00, 25, 1,
'{"thumbnails": ["/images/products/product-2-sm-1.png", "/images/products/product-2-sm-2.png"], "previews": ["/images/products/product-2-bg-1.png", "/images/products/product-2-bg-2.png"]}'),

-- Producto 3: ASUS FHD Gaming Laptop
('ASUS FHD Gaming Laptop', 'asus-fhd-gaming-laptop',
'Laptop gaming ASUS con pantalla FHD. Procesador de alta performance, tarjeta gráfica dedicada y diseño gaming.',
700.00, 650.00, 15, 1,
'{"thumbnails": ["/images/products/product-3-sm-1.png", "/images/products/product-3-sm-2.png"], "previews": ["/images/products/product-3-bg-1.png", "/images/products/product-3-bg-2.png"]}'),

-- Producto 4: Curology Product Set
('Curology Product Set', 'curology-product-set',
'Set completo de productos Curology para el cuidado de la piel. Incluye limpiador, tratamiento y humectante.',
500.00, 450.00, 30, 3,
'{"thumbnails": ["/images/products/product-4-sm-1.png", "/images/products/product-4-sm-2.png"], "previews": ["/images/products/product-4-bg-1.png", "/images/products/product-4-bg-2.png"]}'),

-- Producto 5: Kids Electric Car
('Kids Electric Car', 'kids-electric-car',
'Auto eléctrico para niños. Seguro, divertido y fácil de usar. Incluye control remoto para padres.',
960.00, 900.00, 10, 4,
'{"thumbnails": ["/images/products/product-5-sm-1.png", "/images/products/product-5-sm-2.png"], "previews": ["/images/products/product-5-bg-1.png", "/images/products/product-5-bg-2.png"]}'),

-- Producto 6: Jr. Zoom Soccer Cleats
('Jr. Zoom Soccer Cleats', 'jr-zoom-soccer-cleats',
'Botines de fútbol Jr. Zoom. Diseño profesional, comodidad superior y tracción optimizada para el campo.',
1160.00, 1100.00, 20, 4,
'{"thumbnails": ["/images/products/product-6-sm-1.png", "/images/products/product-6-sm-2.png"], "previews": ["/images/products/product-6-bg-1.png", "/images/products/product-6-bg-2.png"]}'),

-- Producto 7: GP11 Shooter USB Gamepad
('GP11 Shooter USB Gamepad', 'gp11-shooter-usb-gamepad',
'Gamepad USB GP11 especializado para juegos de disparos. Controles precisos y diseño ergonómico.',
660.00, 600.00, 35, 1,
'{"thumbnails": ["/images/products/product-7-sm-1.png", "/images/products/product-7-sm-2.png"], "previews": ["/images/products/product-7-bg-1.png", "/images/products/product-7-bg-2.png"]}'),

-- Producto 8: Quilted Satin Jacket
('Quilted Satin Jacket', 'quilted-satin-jacket',
'Chaqueta de satén acolchada. Estilo moderno y elegante, perfecta para ocasiones especiales.',
660.00, 600.00, 18, 2,
'{"thumbnails": ["/images/products/product-8-sm-1.png", "/images/products/product-8-sm-2.png"], "previews": ["/images/products/product-8-bg-1.png", "/images/products/product-8-bg-2.png"]}'),

-- Producto 9: Breed Dry Dog Food
('Breed Dry Dog Food', 'breed-dry-dog-food',
'Alimento seco premium para perros. Nutrición completa y balanceada para todas las razas.',
100.00, 90.00, 50, 3,
'{"thumbnails": ["/images/products/product-9-sm-1.png", "/images/products/product-9-sm-2.png"], "previews": ["/images/products/product-9-bg-1.png", "/images/products/product-9-bg-2.png"]}'),

-- Producto 10: CANON EOS DSLR Camera
('CANON EOS DSLR Camera', 'canon-eos-dslr-camera',
'Cámara DSLR Canon EOS profesional. Calidad de imagen excepcional y versatilidad para fotografía avanzada.',
360.00, 320.00, 12, 1,
'{"thumbnails": ["/images/products/product-10-sm-1.png", "/images/products/product-10-sm-2.png"], "previews": ["/images/products/product-10-bg-1.png", "/images/products/product-10-bg-2.png"]}'),

-- Producto 11: ASUS FHD Gaming Laptop (Variante)
('ASUS FHD Gaming Laptop Pro', 'asus-fhd-gaming-laptop-pro',
'Versión Pro del laptop gaming ASUS. Mayor rendimiento, más RAM y almacenamiento SSD.',
960.00, 900.00, 8, 1,
'{"thumbnails": ["/images/products/product-11-sm-1.png", "/images/products/product-11-sm-2.png"], "previews": ["/images/products/product-11-bg-1.png", "/images/products/product-11-bg-2.png"]}'),

-- Producto 12: Curology Product Set Deluxe
('Curology Product Set Deluxe', 'curology-product-set-deluxe',
'Set deluxe de productos Curology. Incluye productos adicionales para rutina completa de cuidado facial.',
375.00, 350.00, 22, 3,
'{"thumbnails": ["/images/products/product-12-sm-1.png", "/images/products/product-12-sm-2.png"], "previews": ["/images/products/product-12-bg-1.png", "/images/products/product-12-bg-2.png"]}')

ON CONFLICT (slug) DO NOTHING;

-- Verificar que los productos se insertaron correctamente
SELECT 
  p.id,
  p.name,
  p.price,
  p.discounted_price,
  p.stock,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.id;
