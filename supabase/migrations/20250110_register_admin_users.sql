-- =====================================================
-- MIGRACIÓN: Registrar Usuarios Administradores
-- Fecha: 10 Enero 2025
-- Descripción: Registra los emails administrativos en user_profiles
--              con el rol 'admin'
-- =====================================================

-- Script idempotente: puede ejecutarse múltiples veces sin problemas

DO $$
DECLARE
  admin_role_id INTEGER;
  admin_emails TEXT[] := ARRAY[
    'santiago@xor.com.ar',
    'pinturasmascolor@gmail.com',
    'pinteya.app@gmail.com'
  ];
  email_to_process TEXT;
  profiles_updated INTEGER := 0;
BEGIN
  -- Obtener el ID del rol 'admin'
  SELECT id INTO admin_role_id
  FROM public.user_roles
  WHERE role_name = 'admin'
  LIMIT 1;

  -- Verificar que el rol admin existe
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Error: El rol "admin" no existe en la tabla user_roles';
  END IF;

  RAISE NOTICE 'ID del rol admin: %', admin_role_id;

  -- Procesar cada email de administrador
  FOREACH email_to_process IN ARRAY admin_emails
  LOOP
    -- Insertar o actualizar el perfil con rol admin
    -- Usar lógica de verificación primero para evitar problemas con ON CONFLICT
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = email_to_process) THEN
      -- Si existe, actualizar
      UPDATE public.user_profiles
      SET
        role_id = admin_role_id,
        is_active = true,
        is_verified = true,
        updated_at = NOW()
      WHERE email = email_to_process;
    ELSE
      -- Si no existe, insertar
      INSERT INTO public.user_profiles (
        email,
        role_id,
        is_active,
        is_verified,
        first_name,
        last_name,
        created_at,
        updated_at
      ) VALUES (
        email_to_process,
        admin_role_id,
        true,
        true, -- Los admins se consideran verificados
        'Admin', -- Nombre por defecto, se actualizará en el primer login
        'User',
        NOW(),
        NOW()
      );
    END IF;

    profiles_updated := profiles_updated + 1;
    RAISE NOTICE '✅ Admin registrado/actualizado: %', email_to_process;
  END LOOP;

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '   Total perfiles procesados: %', profiles_updated;
  RAISE NOTICE '====================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error en la migración de administradores: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICACIÓN: Listar todos los administradores
-- =====================================================

DO $$
DECLARE
  admin_record RECORD;
  admin_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'LISTA DE ADMINISTRADORES REGISTRADOS';
  RAISE NOTICE '====================================';

  FOR admin_record IN 
    SELECT 
      up.email,
      up.is_active,
      up.is_verified,
      ur.role_name,
      ur.display_name,
      up.created_at,
      up.updated_at
    FROM public.user_profiles up
    JOIN public.user_roles ur ON up.role_id = ur.id
    WHERE ur.role_name = 'admin'
    ORDER BY up.email
  LOOP
    admin_count := admin_count + 1;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin #%: %', admin_count, admin_record.email;
    RAISE NOTICE '  - Estado: % / Verificado: %', 
      CASE WHEN admin_record.is_active THEN 'Activo' ELSE 'Inactivo' END,
      CASE WHEN admin_record.is_verified THEN 'Sí' ELSE 'No' END;
    RAISE NOTICE '  - Rol: % (%)', admin_record.display_name, admin_record.role_name;
    RAISE NOTICE '  - Creado: %', admin_record.created_at;
    RAISE NOTICE '  - Actualizado: %', admin_record.updated_at;
  END LOOP;

  IF admin_count = 0 THEN
    RAISE WARNING 'No se encontraron administradores registrados';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Total de administradores: %', admin_count;
    RAISE NOTICE '====================================';
  END IF;
END $$;

-- =====================================================
-- FUNCIÓN HELPER: Agregar nuevo administrador
-- =====================================================

-- Función para agregar fácilmente nuevos administradores en el futuro
CREATE OR REPLACE FUNCTION public.add_admin_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  admin_role_id INTEGER;
BEGIN
  -- Validar formato de email
  IF user_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', user_email;
  END IF;

  -- Obtener el ID del rol admin
  SELECT id INTO admin_role_id
  FROM public.user_roles
  WHERE role_name = 'admin'
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Error: El rol "admin" no existe';
  END IF;

  -- Insertar o actualizar el perfil
  -- Usar lógica de verificación primero para evitar problemas con ON CONFLICT
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = user_email) THEN
    -- Si existe, actualizar
    UPDATE public.user_profiles
    SET
      role_id = admin_role_id,
      is_active = true,
      is_verified = true,
      updated_at = NOW()
    WHERE email = user_email;
  ELSE
    -- Si no existe, insertar
    INSERT INTO public.user_profiles (
      email,
      role_id,
      is_active,
      is_verified,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      user_email,
      admin_role_id,
      true,
      true,
      'Admin',
      'User',
      NOW(),
      NOW()
    );
  END IF;

  RAISE NOTICE '✅ Usuario admin agregado/actualizado: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentario en la función
COMMENT ON FUNCTION public.add_admin_user(TEXT) IS 
'Función helper para agregar un nuevo usuario administrador. Uso: SELECT public.add_admin_user(''email@example.com'');';

-- =====================================================
-- FUNCIÓN HELPER: Remover administrador
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_admin_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  customer_role_id INTEGER;
BEGIN
  -- Obtener el ID del rol customer
  SELECT id INTO customer_role_id
  FROM public.user_roles
  WHERE role_name = 'customer'
  LIMIT 1;

  IF customer_role_id IS NULL THEN
    RAISE EXCEPTION 'Error: El rol "customer" no existe';
  END IF;

  -- Actualizar el perfil a rol customer
  UPDATE public.user_profiles
  SET 
    role_id = customer_role_id,
    updated_at = NOW()
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_email;
  END IF;

  RAISE NOTICE '✅ Permisos de admin removidos para: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentario en la función
COMMENT ON FUNCTION public.remove_admin_user(TEXT) IS 
'Función helper para remover permisos de administrador de un usuario. Uso: SELECT public.remove_admin_user(''email@example.com'');';

-- =====================================================
-- DOCUMENTACIÓN
-- =====================================================

-- Ejemplos de uso:
-- 
-- 1. Agregar un nuevo administrador:
--    SELECT public.add_admin_user('nuevo.admin@example.com');
--
-- 2. Remover permisos de administrador:
--    SELECT public.remove_admin_user('usuario@example.com');
--
-- 3. Listar todos los administradores:
--    SELECT up.email, up.is_active, up.created_at
--    FROM user_profiles up
--    JOIN user_roles ur ON up.role_id = ur.id
--    WHERE ur.role_name = 'admin';

