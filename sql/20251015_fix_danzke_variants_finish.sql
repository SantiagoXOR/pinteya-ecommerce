-- Alinear el campo finish de product_variants con el finish implícito en el slug del producto padre
-- Casos objetivo: familia "impregnante-danzke" en Petrilac

-- Brillante
UPDATE product_variants pv
SET finish = 'Brillante', updated_at = NOW()
FROM products p
WHERE pv.product_id = p.id
  AND p.slug ILIKE 'impregnante-danzke-%-brillante-petrilac'
  AND pv.is_active = TRUE
  AND (pv.finish IS DISTINCT FROM 'Brillante' OR pv.finish IS NULL);

-- Satinado
UPDATE product_variants pv
SET finish = 'Satinado', updated_at = NOW()
FROM products p
WHERE pv.product_id = p.id
  AND p.slug ILIKE 'impregnante-danzke-%-satinado-petrilac'
  AND pv.is_active = TRUE
  AND (pv.finish IS DISTINCT FROM 'Satinado' OR pv.finish IS NULL);

-- Opcional: normalizar capitalización general (por si existen registros antiguos)
UPDATE product_variants
SET finish = CASE
  WHEN finish ILIKE 'brill%' THEN 'Brillante'
  WHEN finish ILIKE 'satin%' THEN 'Satinado'
  ELSE finish
END,
updated_at = NOW()
WHERE is_active = TRUE
  AND (finish ILIKE 'brill%' OR finish ILIKE 'satin%');


