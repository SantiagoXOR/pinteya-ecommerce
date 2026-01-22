-- ============================================================================
-- MIGRACIÓN: Agregar tenant_id a System Settings
-- ============================================================================
-- Descripción: Agrega la columna tenant_id a la tabla system_settings
-- para que cada tenant tenga sus propias configuraciones
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'system_settings' 
      AND table_schema = 'public'
      AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE system_settings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_system_settings_tenant ON system_settings(tenant_id);
      
      -- Actualizar constraint UNIQUE de key para incluir tenant_id
      -- Primero eliminar el constraint único existente si existe
      ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_key_key;
      ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_key_unique;
      
      -- Crear nuevo constraint único para (key, tenant_id)
      ALTER TABLE system_settings ADD CONSTRAINT system_settings_key_tenant_unique UNIQUE (key, tenant_id);
    END IF;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN system_settings.tenant_id IS 'Tenant al que pertenece esta configuración';
