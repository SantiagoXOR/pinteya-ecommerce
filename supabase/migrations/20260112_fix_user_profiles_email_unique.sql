-- =====================================================
-- MIGRACIÓN: Asegurar constraint UNIQUE en email de user_profiles
-- Fecha: 12 Enero 2026
-- Descripción: Crear índice único explícito en email para que ON CONFLICT funcione
-- =====================================================

-- Eliminar índice existente si existe (puede no ser único)
DROP INDEX IF EXISTS public.idx_user_profiles_email;

-- Crear índice único explícito en email
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_unique_idx 
ON public.user_profiles(email);

-- Asegurar que la restricción UNIQUE existe
DO $$
BEGIN
  -- Verificar si ya existe una restricción UNIQUE en email
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.user_profiles'::regclass 
    AND conname LIKE '%email%' 
    AND contype = 'u'
  ) THEN
    -- Agregar constraint UNIQUE explícito si no existe
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_email_unique 
    UNIQUE (email);
  END IF;
END $$;

-- Comentario en el índice
COMMENT ON INDEX public.user_profiles_email_unique_idx IS 
'Índice único en email para soportar ON CONFLICT en triggers y queries';
