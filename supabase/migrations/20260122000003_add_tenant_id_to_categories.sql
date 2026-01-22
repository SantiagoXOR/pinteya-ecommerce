-- ============================================================================
-- MIGRACIÓN: Agregar tenant_id a Categories
-- ============================================================================
-- Descripción: Agrega la columna tenant_id a la tabla categories
-- para aislamiento de datos por tenant
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND table_schema = 'public'
      AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
      
      -- Actualizar constraint UNIQUE de slug para incluir tenant_id
      -- Primero eliminar el constraint único existente si existe
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
      
      -- Crear nuevo constraint único para (slug, tenant_id)
      ALTER TABLE categories ADD CONSTRAINT categories_slug_tenant_unique UNIQUE (slug, tenant_id);
    END IF;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN categories.tenant_id IS 'Tenant al que pertenece esta categoría';
