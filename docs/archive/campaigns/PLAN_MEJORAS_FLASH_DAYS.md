# Plan: Mejoras Modal Pintura Flash Days

## Objetivo
Implementar sistema completo de registro de participantes con guardado en base de datos y mensaje de WhatsApp mejorado con emojis.

## Problema Actual

### Flujo Actual (Incompleto)
```
Usuario ingresa número → Se valida → Se abre WhatsApp → ❌ NO se guarda en DB
```

**Problemas:**
- ❌ No se puede hacer el sorteo (no hay lista de participantes)
- ❌ No hay confirmación de participación
- ❌ No hay forma de evitar participaciones duplicadas
- ❌ Mensaje de WhatsApp muy básico

## Solución Propuesta

### Flujo Mejorado
```
Usuario ingresa número → 
  Se valida → 
  Se guarda en DB → 
  Se envía a WhatsApp con mensaje mejorado → 
  Se muestra confirmación ✅
```

---

## Implementación

### 1. Base de Datos - Tabla de Participantes

**Archivo:** `supabase/migrations/[timestamp]_create_flash_days_participants.sql`

**Esquema:**
```sql
CREATE TABLE IF NOT EXISTS public.flash_days_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) NOT NULL,
  phone_normalized VARCHAR(15) NOT NULL, -- Sin espacios ni guiones
  participated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45), -- Para prevenir fraude
  user_agent TEXT, -- Para analytics
  already_participated BOOLEAN DEFAULT FALSE, -- Flag si ya participó antes
  status VARCHAR(20) DEFAULT 'pending', -- pending, contacted, winner
  
  -- Constraints
  UNIQUE(phone_normalized), -- Un número solo participa una vez
  
  -- Indexes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_flash_days_phone ON public.flash_days_participants(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_flash_days_status ON public.flash_days_participants(status);
CREATE INDEX IF NOT EXISTS idx_flash_days_date ON public.flash_days_participants(participated_at);

-- RLS Policies (solo admin puede ver)
ALTER TABLE public.flash_days_participants ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer
CREATE POLICY "Admins can read participants" ON public.flash_days_participants
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo el sistema puede insertar
CREATE POLICY "System can insert participants" ON public.flash_days_participants
  FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_flash_days_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flash_days_participants_updated_at
  BEFORE UPDATE ON public.flash_days_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_days_participants_updated_at();
```

### 2. API Route - Guardar Participante

**Archivo:** `src/app/api/flash-days/participate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ParticipateRequest {
  phoneNumber: string
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber }: ParticipateRequest = await request.json()
    
    // Validar número
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 8 || cleanPhone.length > 10) {
      return NextResponse.json(
        { error: 'Número inválido' },
        { status: 400 }
      )
    }
    
    // Normalizar a formato argentino completo
    const normalizedPhone = `549${cleanPhone}` // 549 + área + número
    
    const supabase = await createClient()
    
    // Verificar si ya participó
    const { data: existing } = await supabase
      .from('flash_days_participants')
      .select('id, participated_at')
      .eq('phone_normalized', normalizedPhone)
      .single()
    
    if (existing) {
      return NextResponse.json({
        alreadyParticipated: true,
        message: '¡Ya estás participando! Te contactaremos por WhatsApp.',
        participatedAt: existing.participated_at
      })
    }
    
    // Obtener IP y User Agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Guardar participante
    const { data, error } = await supabase
      .from('flash_days_participants')
      .insert({
        phone_number: phoneNumber,
        phone_normalized: normalizedPhone,
        ip_address: ip,
        user_agent: userAgent,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving participant:', error)
      return NextResponse.json(
        { error: 'Error al registrar participación' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      participant: data,
      message: '¡Participación registrada! Te contactaremos por WhatsApp.'
    })
    
  } catch (error) {
    console.error('Error in participate endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### 3. Mejorar Componente WhatsAppPopup

**Cambios en `handleSubmit`:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    // Sanitizar y validar teléfono
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length < 8 || cleanPhone.length > 10) {
      alert('Por favor ingresá un número válido (sin 0 ni 15)')
      return
    }

    // 1. Guardar en base de datos
    const response = await fetch('/api/flash-days/participate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone })
    })

    const result = await response.json()

    // 2. Trackear en Analytics
    trackEvent('flash_days_phone_submitted', 'conversion', cleanPhone)

    // 3. Mensaje personalizado mejorado con emojis
    const message = encodeURIComponent(
      `🎨 ¡Hola desde Pinteya!

🎁 Quiero participar del sorteo *Pintura Flash Days*

✨ *Color & Ahorro*
🎯 ${PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards de $${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')}

📅 Fechas: ${PINTURA_FLASH_DAYS_CONFIG.startDate} al ${PINTURA_FLASH_DAYS_CONFIG.endDate}

📱 Mi número: ${cleanPhone}

¡Gracias! 🎨✨`
    )
    
    const whatsappUrl = `https://wa.me/${PINTURA_FLASH_DAYS_CONFIG.whatsappNumber}?text=${message}`

    trackEvent('flash_days_whatsapp_opened', 'conversion', 'redirect')

    // 4. Abrir WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

    // 5. Mostrar confirmación
    if (result.alreadyParticipated) {
      setConfirmationMessage('¡Ya estás participando! Te contactaremos pronto.')
    } else {
      setConfirmationMessage('¡Participación registrada! Revisá tu WhatsApp.')
    }
    
    setShowConfirmation(true)

    // 6. Cerrar popup después de 3 segundos
    setTimeout(() => {
      setIsOpen(false)
    }, 3000)

  } catch (error) {
    console.error('Error:', error)
    alert('Hubo un error. Intentá de nuevo.')
  } finally {
    setIsSubmitting(false)
  }
}
```

### 4. Agregar Estados al Componente

```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [showConfirmation, setShowConfirmation] = useState(false)
const [confirmationMessage, setConfirmationMessage] = useState('')
```

### 5. Mensaje de Confirmación Visual

```tsx
{showConfirmation && (
  <div className='absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-8 rounded-3xl'>
    <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4'>
      <CheckCircle className='w-12 h-12 text-green-600' />
    </div>
    <h3 className='text-2xl font-bold text-gray-900 mb-2 text-center'>
      ¡Listo!
    </h3>
    <p className='text-gray-600 text-center'>
      {confirmationMessage}
    </p>
  </div>
)}
```

### 6. Mejorar Mensaje de WhatsApp con Emojis

**Mensaje Actual (Básico):**
```
🎨 Hola! Quiero participar por las 3 Gift Cards 
de $75.000 del Pintura Flash Days
```

**Mensaje Mejorado (Con Emojis):**
```
🎨 ¡Hola desde Pinteya!

🎁 Quiero participar del sorteo *Pintura Flash Days*

✨ *Color & Ahorro*
🎯 3 Gift Cards de $75.000

📅 Fechas: 3 de noviembre al 5 de noviembre

📱 Mi número: [NÚMERO DEL USUARIO]

¡Gracias! 🎨✨
```

**Ventajas:**
- ✅ Más visual y atractivo
- ✅ Mejor organizado con saltos de línea
- ✅ Incluye toda la info relevante
- ✅ Usa *negritas* de WhatsApp
- ✅ Incluye número del usuario para verificación

---

## Panel Admin - Ver Participantes

**Archivo:** `src/app/admin/flash-days/page.tsx`

Panel para:
- Ver lista de participantes
- Exportar a Excel
- Realizar sorteo aleatorio
- Marcar ganadores

---

## Archivos a Crear/Modificar

### Nuevos
1. `supabase/migrations/[timestamp]_create_flash_days_participants.sql`
2. `src/app/api/flash-days/participate/route.ts`
3. `src/app/admin/flash-days/page.tsx` (opcional, para admin)

### Modificar
1. `src/components/Common/WhatsAppPopup.tsx`
   - Agregar estados (isSubmitting, showConfirmation)
   - Modificar handleSubmit (llamar API)
   - Mejorar mensaje WhatsApp
   - Agregar pantalla de confirmación

### Tests
1. `tests/e2e/pintura-flash-days-popup.spec.ts`
   - Agregar test de guardado en DB
   - Test de confirmación visual
   - Test de participación duplicada

---

## Flujo Completo Mejorado

```
1. Usuario ingresa número
   ↓
2. Click "Participar por WhatsApp"
   ↓
3. [NUEVO] Llamada a /api/flash-days/participate
   ↓
4. [NUEVO] Se guarda en DB (o detecta duplicado)
   ↓
5. Se abre WhatsApp con mensaje mejorado
   ↓
6. [NUEVO] Se muestra confirmación en pantalla
   ↓
7. Modal se cierra automáticamente (3s)
```

---

## Beneficios

### Para el Negocio
- ✅ **Lista de participantes** en DB para sorteo real
- ✅ **Prevención de duplicados** (un número = una participación)
- ✅ **Métricas completas** (cuántos participan)
- ✅ **Panel admin** para gestionar sorteo
- ✅ **Exportar contactos** para remarketing

### Para el Usuario
- ✅ **Confirmación visual** de participación
- ✅ **Mensaje WhatsApp profesional** con toda la info
- ✅ **Mejor experiencia** (sabe que está participando)
- ✅ **Transparencia** (puede verificar sus datos)

---

## Implementación Estimada

| Tarea | Tiempo | Archivos |
|-------|--------|----------|
| 1. Crear tabla DB | 5 min | 1 archivo |
| 2. Crear API route | 15 min | 1 archivo |
| 3. Modificar componente | 20 min | 1 archivo |
| 4. Mejorar mensaje WhatsApp | 10 min | 1 archivo |
| 5. Agregar confirmación visual | 15 min | 1 archivo |
| 6. Actualizar tests | 20 min | 2 archivos |
| 7. Panel admin (opcional) | 30 min | 1 archivo |
| **Total** | **1h 55min** | **7 archivos** |

---

## Próximos Pasos

1. ¿Querés que implemente todo esto?
2. ¿Querés el panel admin también?
3. ¿Algún otro dato que quieras capturar (nombre, email)?

Confirma para proceder con la implementación.

