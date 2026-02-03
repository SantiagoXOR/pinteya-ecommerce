-- Agregar acciones focus e input para que el RPC insert_analytics_event_optimized
-- pueda persistir eventos focus/input con action_id correcto (evita FK violation).
INSERT INTO analytics_actions (id, name)
VALUES
    (14, 'focus'),
    (15, 'input')
ON CONFLICT (id) DO NOTHING;
