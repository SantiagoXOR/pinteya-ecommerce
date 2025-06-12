-- ===================================
-- PINTEYA E-COMMERCE - TABLA PROFILES
-- ===================================

-- Crear tabla profiles ligada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Argentina',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentación
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario para Pinteya E-commerce';
COMMENT ON COLUMN public.profiles.id IS 'ID del usuario (referencia a auth.users)';
COMMENT ON COLUMN public.profiles.first_name IS 'Nombre del usuario';
COMMENT ON COLUMN public.profiles.last_name IS 'Apellido del usuario';
COMMENT ON COLUMN public.profiles.email IS 'Email del usuario';
COMMENT ON COLUMN public.profiles.phone IS 'Teléfono del usuario';
COMMENT ON COLUMN public.profiles.address IS 'Dirección del usuario';
COMMENT ON COLUMN public.profiles.city IS 'Ciudad del usuario';
COMMENT ON COLUMN public.profiles.postal_code IS 'Código postal del usuario';
COMMENT ON COLUMN public.profiles.country IS 'País del usuario (por defecto Argentina)';
