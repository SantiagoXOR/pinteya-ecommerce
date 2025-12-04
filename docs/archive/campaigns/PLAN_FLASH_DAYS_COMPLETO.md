# Plan Completo: Sistema de Participación Pintura Flash Days

## 🎯 Objetivo
Implementar sistema completo de registro de participantes con:
- ✅ Guardado en base de datos
- ✅ Captura automática de metadata (sin pedir al usuario)
- ✅ Mensaje WhatsApp mejorado con emojis
- ✅ Panel admin para gestionar sorteo

---

## 📊 Metadata que Capturaremos Automáticamente

### Sin Pedir al Usuario
1. **IP Address** - Para prevenir fraude
2. **User Agent** - Navegador/dispositivo
3. **Referrer** - De dónde viene
4. **Session ID** - Identificador de sesión
5. **Device Type** - Mobile/Desktop
6. **Timestamp** - Fecha/hora exacta
7. **UTM Parameters** - Si viene de campaña
8. **Browser Language** - Idioma del navegador
9. **Screen Resolution** - Tamaño de pantalla
10. **Time Zone** - Zona horaria

### Esquema de Tabla Completo

```sql
CREATE TABLE public.flash_days_participants (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos del teléfono
  phone_number VARCHAR(15) NOT NULL,
  phone_normalized VARCHAR(15) NOT NULL,
  
  -- Metadata capturada automáticamente
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  session_id VARCHAR(255),
  device_type VARCHAR(20), -- mobile, desktop, tablet
  browser_language VARCHAR(10),
  screen_resolution VARCHAR(20),
  timezone VARCHAR(50),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Estado del participante
  status VARCHAR(20) DEFAULT 'pending', -- pending, contacted, winner, duplicate
  already_participated BOOLEAN DEFAULT FALSE,
  whatsapp_opened BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  participated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  whatsapp_opened_at TIMESTAMP WITH TIME ZONE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Constraints
  UNIQUE(phone_normalized)
);
```

---

## 🔧 Implementación

### 1. Migración de Base de Datos

**Archivo:** `supabase/migrations/20251101_create_flash_days_participants.sql`

### 2. API Route - Participate

**Archivo:** `src/app/api/flash-days/participate/route.ts`

**Funcionalidad:**
- Validar número de teléfono
- Capturar metadata automáticamente
- Verificar duplicados
- Guardar en DB
- Retornar éxito/duplicado

### 3. Actualizar Componente WhatsAppPopup

**Archivo:** `src/components/Common/WhatsAppPopup.tsx`

**Cambios:**
- Agregar estados: `isSubmitting`, `showConfirmation`
- Modificar `handleSubmit` para llamar API
- Capturar metadata del cliente
- Mejorar mensaje WhatsApp con emojis
- Mostrar pantalla de confirmación
- Manejo de duplicados

### 4. Mensaje WhatsApp Mejorado

**Nuevo mensaje:**
```
🎨 ¡Hola desde Pinteya!

🎁 Quiero participar del sorteo *Pintura Flash Days*

✨ *Color & Ahorro*
🎯 3 Gift Cards de $75.000 cada una

📅 Válido: 3 al 5 de noviembre

📱 Mi WhatsApp: [NÚMERO]

🏆 ¡Quiero ser una de las 3 ganadoras!

Saludos! 🎨✨
```

### 5. Panel Admin - Gestión de Sorteo

**Archivo:** `src/app/admin/flash-days/page.tsx`

**Funcionalidades:**
- 📊 Dashboard con métricas
  - Total de participantes
  - Participantes por día
  - Participantes por dispositivo
  - Tasa de conversión
  
- 📋 Lista de participantes
  - Tabla con todos los datos
  - Filtros (fecha, status, dispositivo)
  - Búsqueda por número
  - Ordenamiento
  
- 🎲 Realizar sorteo
  - Botón "Sortear Ganadores"
  - Selección aleatoria de 3 ganadores
  - Marcar como winners en DB
  - Exportar lista de ganadores
  
- 📤 Exportar datos
  - Excel con todos los participantes
  - CSV para email marketing
  - Lista de ganadores
  
- 📞 Gestión de contacto
  - Marcar como "contactado"
  - Agregar notas
  - Ver historial

### 6. API Routes Adicionales

**Archivo:** `src/app/api/flash-days/participants/route.ts`
- GET: Listar participantes (solo admin)
- Paginación, filtros, búsqueda

**Archivo:** `src/app/api/flash-days/raffle/route.ts`
- POST: Realizar sorteo aleatorio
- Marcar ganadores en DB
- Retornar lista de ganadores

---

## 📊 Metadata Capturada Automáticamente

### En el Frontend (Cliente)
```typescript
const metadata = {
  deviceType: isMobile ? 'mobile' : 'desktop',
  screenResolution: `${window.screen.width}x${window.screen.height}`,
  browserLanguage: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  referrer: document.referrer,
  
  // UTM parameters de la URL
  utmSource: new URLSearchParams(window.location.search).get('utm_source'),
  utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
  utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
}
```

### En el Backend (Servidor)
```typescript
const metadata = {
  ipAddress: request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip'),
  userAgent: request.headers.get('user-agent'),
  sessionId: cookies.get('sessionId'),
}
```

---

## 🎨 Componente de Confirmación

```tsx
{showConfirmation && (
  <div className='absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-8 rounded-3xl animate-fadeIn'>
    <div className='w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6'>
      <CheckCircle className='w-16 h-16 text-green-600' />
    </div>
    
    <h3 className='text-2xl md:text-3xl font-black text-gray-900 mb-3 text-center'>
      {isDuplicate ? '¡Ya estás participando!' : '¡Participación Registrada!'}
    </h3>
    
    <p className='text-gray-600 text-center text-base md:text-lg mb-6 max-w-md'>
      {isDuplicate 
        ? 'Tu número ya está en el sorteo. Te contactaremos por WhatsApp cuando tengamos los ganadores.' 
        : 'Tu participación fue registrada exitosamente. Abrimos WhatsApp para confirmar tu interés.'}
    </p>
    
    <div className='flex items-center gap-2 text-purple-600'>
      <MessageCircle className='w-5 h-5' />
      <span className='font-medium'>Revisá tu WhatsApp</span>
    </div>
  </div>
)}
```

---

## 📋 Archivos a Crear (6 nuevos)

1. `supabase/migrations/20251101_create_flash_days_participants.sql`
2. `src/app/api/flash-days/participate/route.ts`
3. `src/app/api/flash-days/participants/route.ts`
4. `src/app/api/flash-days/raffle/route.ts`
5. `src/app/admin/flash-days/page.tsx`
6. `src/app/admin/flash-days/components/ParticipantsList.tsx`

## 📝 Archivos a Modificar (2)

1. `src/components/Common/WhatsAppPopup.tsx`
2. `tests/e2e/pintura-flash-days-popup.spec.ts`

---

## 🎲 Panel Admin - Features

### Dashboard
```
┌─────────────────────────────────────┐
│ Pintura Flash Days - Sorteo         │
├─────────────────────────────────────┤
│                                     │
│  📊 Total Participantes: 1,247      │
│  📱 Nuevos hoy: 342                 │
│  🏆 Ganadores: 0/3                  │
│  📈 Tasa conversión: 8.5%           │
│                                     │
├─────────────────────────────────────┤
│  🎲 [Realizar Sorteo]               │
│  📤 [Exportar Excel]                │
│  📋 [Ver Participantes]             │
└─────────────────────────────────────┘
```

### Tabla de Participantes
- Número de teléfono
- Fecha de participación
- Dispositivo (mobile/desktop)
- IP
- Status (pending/contacted/winner)
- Acciones (marcar contactado, agregar nota)

### Sorteo
- Botón "Sortear 3 Ganadores"
- Selección aleatoria
- Confirmación antes de ejecutar
- Marca ganadores en DB
- Muestra resultados

---

## 🔒 Seguridad y Privacidad

### RLS Policies
```sql
-- Solo admins pueden ver participantes
CREATE POLICY "Admins can read participants"
  ON flash_days_participants FOR SELECT
  USING (auth.role() = 'authenticated' AND is_admin());

-- Sistema puede insertar (público)
CREATE POLICY "Anyone can participate"
  ON flash_days_participants FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden actualizar (marcar ganadores)
CREATE POLICY "Admins can update participants"
  ON flash_days_participants FOR UPDATE
  USING (auth.role() = 'authenticated' AND is_admin());
```

### Rate Limiting
- Máximo 3 intentos por IP por hora
- Prevenir spam/fraude

---

## ✅ Confirmá para Implementar

El plan incluye:
- ✅ Tabla en Supabase con metadata automática
- ✅ API para guardar participantes
- ✅ Mensaje WhatsApp mejorado con emojis
- ✅ Confirmación visual
- ✅ Panel admin completo
- ✅ Exportar a Excel
- ✅ Sistema de sorteo
- ✅ Tests actualizados

¿Procedo con la implementación?

