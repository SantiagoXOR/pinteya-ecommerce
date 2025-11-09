-- =====================================================
-- MIGRACIÓN: Auto-sincronización de User Profiles
-- Fecha: 10 Enero 2025
-- Descripción: Trigger automático para crear user_profiles cuando
--              se crea un usuario en la tabla users (NextAuth)
-- =====================================================

-- Función que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION public.auto_create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id INTEGER;
BEGIN
  -- Obtener el ID del rol 'customer' (rol por defecto)
  SELECT id INTO customer_role_id
  FROM public.user_roles
  WHERE role_name = 'customer'
  LIMIT 1;

  -- Si no existe el rol customer, usar NULL (fallback)
  IF customer_role_id IS NULL THEN
    RAISE WARNING 'Customer role not found, creating user profile without role';
  END IF;

  -- Crear el perfil del usuario automáticamente
  INSERT INTO public.user_profiles (
    supabase_user_id,
    email,
    first_name,
    last_name,
    role_id,
    is_active,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.name, ' ', 1),  -- Primer nombre
    SUBSTRING(NEW.name FROM POSITION(' ' IN NEW.name) + 1), -- Resto del nombre como apellido
    customer_role_id,
    true,
    CASE WHEN NEW.emailVerified IS NOT NULL THEN true ELSE false END,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    supabase_user_id = EXCLUDED.supabase_user_id,
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    is_verified = CASE WHEN EXCLUDED.is_verified THEN true ELSE user_profiles.is_verified END,
    updated_at = NOW();

  RAISE LOG 'User profile auto-created for user: %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no bloquear la creación del usuario
    RAISE WARNING 'Error auto-creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentario en la función
COMMENT ON FUNCTION public.auto_create_user_profile() IS 
'Función trigger que crea automáticamente un user_profile cuando se inserta un usuario en la tabla users (NextAuth)';

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_auto_create_user_profile ON public.users;

-- Crear el trigger en la tabla users
CREATE TRIGGER trigger_auto_create_user_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_profile();

-- Comentario en el trigger
COMMENT ON TRIGGER trigger_auto_create_user_profile ON public.users IS
'Trigger que sincroniza automáticamente la creación de user_profiles con la tabla users de NextAuth';

-- =====================================================
-- MIGRACIÓN ONE-TIME: Sincronizar usuarios existentes
-- =====================================================

-- Crear perfiles para usuarios existentes que no tengan uno
DO $$
DECLARE
  customer_role_id INTEGER;
  users_synced INTEGER := 0;
BEGIN
  -- Obtener el ID del rol customer
  SELECT id INTO customer_role_id
  FROM public.user_roles
  WHERE role_name = 'customer'
  LIMIT 1;

  -- Insertar perfiles para usuarios sin perfil
  INSERT INTO public.user_profiles (
    supabase_user_id,
    email,
    first_name,
    last_name,
    role_id,
    is_active,
    is_verified,
    created_at,
    updated_at
  )
  SELECT 
    u.id,
    u.email,
    SPLIT_PART(u.name, ' ', 1),
    SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1),
    customer_role_id,
    true,
    CASE WHEN u.emailVerified IS NOT NULL THEN true ELSE false END,
    NOW(),
    NOW()
  FROM public.users u
  LEFT JOIN public.user_profiles up ON u.id = up.supabase_user_id
  WHERE up.id IS NULL
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS users_synced = ROW_COUNT;
  
  RAISE NOTICE 'Migración completada: % usuarios sincronizados', users_synced;
END $$;

-- =====================================================
-- LOGGING Y VERIFICACIÓN
-- =====================================================

-- Verificar que el trigger fue creado correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_auto_create_user_profile'
  ) THEN
    RAISE NOTICE '✅ Trigger auto_create_user_profile creado correctamente';
  ELSE
    RAISE WARNING '❌ Error: Trigger no fue creado';
  END IF;
END $$;

