-- Tipo de evento para vistas de categoría (panel Analytics > Categorías)
INSERT INTO analytics_event_types (id, name, description)
VALUES (15, 'view_category', 'Vista de categoría desde home o filtros')
ON CONFLICT (id) DO NOTHING;
