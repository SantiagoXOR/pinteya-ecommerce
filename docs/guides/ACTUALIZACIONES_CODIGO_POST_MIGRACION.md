# 🔧 ACTUALIZACIONES DE CÓDIGO POST-MIGRACIÓN
## Eliminación Dependencias Clerk + Consolidación user_profiles

**Fecha**: 13 de Septiembre, 2025  
**Objetivo**: Actualizar código para usar user_profiles como tabla principal  
**Tiempo estimado**: 2-3 horas  

---

## 📋 RESUMEN DE CAMBIOS REQUERIDOS

### **CAMBIOS ESTRUCTURALES**
- ✅ **Base de datos**: users → user_profiles (COMPLETADO)
- 🔄 **Tipos TypeScript**: Actualizar interfaces
- 🔄 **APIs**: Cambiar referencias de tabla
- 🔄 **Componentes**: Actualizar campos de usuario
- ❌ **Webhooks Clerk**: Eliminar completamente

---

## 🎯 ARCHIVOS A ACTUALIZAR

### **1. TIPOS TYPESCRIPT**

#### **src/types/database.ts**
```typescript
// ANTES (con Clerk)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;  // ← ELIMINAR
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;  // ← ELIMINAR
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;  // ← ELIMINAR
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// DESPUÉS (sin Clerk, usando user_profiles)
export interface Database {
  public: {
    Tables: {
      user_profiles: {  // ← CAMBIO DE NOMBRE
        Row: {
          id: string;
          email: string;
          first_name: string | null;  // ← NUEVO
          last_name: string | null;   // ← NUEVO
          role_id: string | null;     // ← NUEVO
          is_active: boolean;         // ← NUEVO
          metadata: any;              // ← NUEVO
          created_at: string;
          updated_at: string;         // ← NUEVO
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          role_id?: string | null;
          is_active?: boolean;
          metadata?: any;
          updated_at?: string;
        };
      };
    };
  };
}
```

### **2. APIS DE USUARIO**

#### **src/app/api/user/addresses/route.ts**
```typescript
// ANTES
const { data: user } = await supabaseAdmin
  .from('users')  // ← CAMBIAR
  .select('id')
  .eq('clerk_id', session.user.id)  // ← CAMBIAR
  .single();

// DESPUÉS
const { data: user } = await supabaseAdmin
  .from('user_profiles')  // ← NUEVO
  .select('id')
  .eq('id', session.user.id)  // ← DIRECTO POR ID
  .single();

// Auto-creación de usuario actualizada
if (!user && userError?.code === 'PGRST116') {
  const { data: newUser, error: createError } = await supabaseAdmin
    .from('user_profiles')  // ← CAMBIO
    .insert({
      id: session.user.id,
      email: session.user.email,
      first_name: session.user.name?.split(' ')[0] || null,  // ← NUEVO
      last_name: session.user.name?.split(' ').slice(1).join(' ') || null,  // ← NUEVO
      role_id: null,  // ← NUEVO
      is_active: true,  // ← NUEVO
      metadata: {  // ← NUEVO
        created_via: 'nextauth_auto',
        source: 'address_api',
        created_at: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
}
```

#### **src/app/api/user/profile/route.ts** (si existe)
```typescript
// Actualizar para usar user_profiles con nueva estructura
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')  // ← CAMBIO
    .select(`
      id,
      email,
      first_name,
      last_name,
      role_id,
      is_active,
      metadata,
      created_at,
      updated_at,
      user_roles (
        role_name,
        permissions
      )
    `)
    .eq('id', session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
```

### **3. COMPONENTES DE USUARIO**

#### **Actualizar componentes que muestran información de usuario**
```typescript
// ANTES
interface UserDisplayProps {
  user: {
    id: string;
    clerk_id: string;  // ← ELIMINAR
    email: string;
    name: string | null;
  };
}

// DESPUÉS
interface UserDisplayProps {
  user: {
    id: string;
    email: string;
    first_name: string | null;  // ← NUEVO
    last_name: string | null;   // ← NUEVO
    role_id: string | null;     // ← NUEVO
    is_active: boolean;         // ← NUEVO
  };
}

// Función helper para nombre completo
function getFullName(user: UserProfile): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.first_name || user.email.split('@')[0];
}
```

### **4. HOOKS Y UTILIDADES**

#### **src/hooks/useUser.ts** (si existe)
```typescript
// Actualizar hook para usar user_profiles
export function useUser() {
  const { data: session } = useSession();
  
  const { data: profile, error, isLoading } = useSWR(
    session?.user ? `/api/user/profile` : null,
    fetcher
  );

  return {
    user: profile?.profile,
    isLoading,
    error,
    isAuthenticated: !!session?.user
  };
}
```

---

## 🗑️ ARCHIVOS A ELIMINAR

### **1. WEBHOOKS CLERK**
```bash
# Eliminar completamente
rm src/app/api/webhooks/clerk/route.ts
```

### **2. SCRIPTS LEGACY**
```bash
# Eliminar scripts de migración Clerk
rm scripts/sync-admin-clerk.js
rm scripts/update-clerk-metadata.js
rm scripts/migrate-clerk-*.js
```

### **3. UTILIDADES CLERK**
```bash
# Buscar y eliminar archivos con referencias Clerk
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "clerk" | head -10
```

---

## 🔧 SCRIPTS DE ACTUALIZACIÓN AUTOMÁTICA

### **Script para actualizar imports**
```bash
# scripts/update-imports.sh
#!/bin/bash

echo "🔄 Actualizando imports de 'users' a 'user_profiles'..."

# Buscar y reemplazar en archivos TypeScript
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.from('\''users'\'')/\.from('\''user_profiles'\'')/g'

# Buscar y reemplazar referencias a clerk_id
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/clerk_id/id/g'

echo "✅ Imports actualizados"
```

### **Script para verificar referencias Clerk**
```bash
# scripts/check-clerk-references.sh
#!/bin/bash

echo "🔍 Buscando referencias a Clerk..."

# Buscar archivos con referencias Clerk
echo "Archivos con 'clerk':"
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "clerk" 2>/dev/null || echo "Ninguno encontrado"

echo "Archivos con 'Clerk':"
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "Clerk" 2>/dev/null || echo "Ninguno encontrado"

echo "Archivos con '@clerk':"
find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "@clerk" 2>/dev/null || echo "Ninguno encontrado"

echo "✅ Verificación completada"
```

---

## 🧪 PLAN DE TESTING

### **1. Tests de APIs**
```typescript
// __tests__/api/user/addresses.test.ts
describe('User Addresses API - Post Migration', () => {
  it('should create user automatically in user_profiles', async () => {
    // Mock NextAuth session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    // Test que el usuario se crea en user_profiles
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    
    // Verificar que se creó en user_profiles
    const user = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', 'test-user-id')
      .single();
    
    expect(user.data).toBeTruthy();
    expect(user.data.email).toBe('test@example.com');
    expect(user.data.first_name).toBe('Test');
    expect(user.data.last_name).toBe('User');
  });
});
```

### **2. Tests de Componentes**
```typescript
// __tests__/components/UserProfile.test.tsx
describe('UserProfile Component - Post Migration', () => {
  it('should display user name from first_name + last_name', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 'customer-role',
      is_active: true
    };

    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### **3. Tests de Integración**
```typescript
// __tests__/integration/user-flow.test.ts
describe('User Flow Integration - Post Migration', () => {
  it('should complete full user journey with user_profiles', async () => {
    // 1. Login con NextAuth
    // 2. Auto-creación en user_profiles
    // 3. Crear dirección
    // 4. Crear orden
    // 5. Verificar datos en user_profiles
  });
});
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### **Pre-Actualización**
- [ ] Backup de código actual creado
- [ ] Migración de base de datos completada exitosamente
- [ ] Tests existentes documentados

### **Durante Actualización**
- [ ] Tipos TypeScript actualizados
- [ ] APIs de usuario actualizadas
- [ ] Componentes de usuario actualizados
- [ ] Webhooks Clerk eliminados
- [ ] Scripts legacy eliminados

### **Post-Actualización**
- [ ] Funcionalidad de direcciones operativa
- [ ] Sistema de órdenes funcionando
- [ ] Autenticación NextAuth estable
- [ ] Tests actualizados y pasando
- [ ] Sin referencias a Clerk en código
- [ ] Logs de aplicación limpios

### **Verificación Final**
- [ ] Usuario puede crear cuenta
- [ ] Usuario puede gestionar direcciones
- [ ] Usuario puede crear órdenes
- [ ] Admin puede ver usuarios en user_profiles
- [ ] Métricas y analytics funcionando

---

## 🚀 ORDEN DE EJECUCIÓN

### **Fase 1: Preparación (30 min)**
1. Crear backup del código actual
2. Ejecutar scripts de verificación
3. Documentar estado actual

### **Fase 2: Actualización Core (1 hora)**
1. Actualizar tipos TypeScript
2. Actualizar APIs de usuario
3. Eliminar webhooks Clerk

### **Fase 3: Actualización UI (30 min)**
1. Actualizar componentes de usuario
2. Actualizar hooks y utilidades
3. Eliminar scripts legacy

### **Fase 4: Testing (1 hora)**
1. Ejecutar tests actualizados
2. Probar flujo completo de usuario
3. Verificar funcionalidades críticas

### **Fase 5: Verificación (30 min)**
1. Revisar logs de aplicación
2. Confirmar métricas funcionando
3. Documentar cambios completados

**Tiempo Total Estimado**: 3.5 horas

---

## 🎯 RESULTADO ESPERADO

### **Código Limpio**
- ✅ 0 referencias a Clerk
- ✅ user_profiles como tabla principal
- ✅ Estructura moderna de usuarios
- ✅ Compatibilidad total con NextAuth

### **Funcionalidad Preservada**
- ✅ Autenticación funcionando
- ✅ Gestión de direcciones operativa
- ✅ Sistema de órdenes estable
- ✅ Analytics sin interrupciones

### **Base para Futuro**
- ✅ Estructura escalable
- ✅ Roles de usuario implementados
- ✅ Metadata flexible
- ✅ Integración nativa con Supabase

**¡Pinteya E-commerce listo para crecer sin dependencias legacy!** 🚀
