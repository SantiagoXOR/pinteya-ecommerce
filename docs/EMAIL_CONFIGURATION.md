# Configuración de Emails Personalizados - Pinteya E-commerce

## 🎯 Objetivo

Configurar un sistema completo de emails personalizados usando el dominio `@pinteya.com` con **Resend** como proveedor de servicios de email.

## 📧 Características Implementadas

### ✅ Plantillas de Email

- **Email de Bienvenida**: Para nuevos usuarios registrados
- **Confirmación de Pedido**: Para pedidos completados
- **Recuperación de Contraseña**: Para reset de contraseñas

### ✅ Funcionalidades

- Diseño responsive con colores de marca Pinteya
- Plantillas HTML y texto plano
- Configuración centralizada
- API de testing
- Hook React para integración
- Componente de administración

## 🚀 Configuración Paso a Paso

### 1. Crear Cuenta en Resend

1. Visita [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Configurar Dominio en Resend

1. En el dashboard de Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa `pinteya.com`
4. Copia los registros DNS proporcionados

### 3. Configurar DNS

Agrega estos registros en tu proveedor de DNS (donde tienes configurado pinteya.com):

```
Tipo: MX
Nombre: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10

Tipo: TXT
Nombre: @
Valor: "v=spf1 include:amazonses.com ~all"

Tipo: TXT
Nombre: _dmarc
Valor: "v=DMARC1; p=quarantine; rua=mailto:dmarc@pinteya.com"

Tipo: CNAME
Nombre: [valor-proporcionado-por-resend]
Valor: [valor-proporcionado-por-resend]
```

### 4. Obtener API Key

1. En Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre: "Pinteya Production"
4. Selecciona permisos: **Send emails**
5. Copia la API Key generada

### 5. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_tu-api-key-aqui
RESEND_FROM_EMAIL=noreply@pinteya.com
RESEND_SUPPORT_EMAIL=soporte@pinteya.com
```

### 6. Verificar Configuración

1. Ejecuta el proyecto: `npm run dev`
2. Visita: `http://localhost:3001/admin/email-test`
3. Verifica que la configuración aparezca como "Configurado ✅"

## 🧪 Testing

### Página de Testing

Visita `/admin/email-test` para:

- Verificar configuración del servicio
- Enviar emails de prueba
- Probar diferentes plantillas

### API de Testing

```bash
# Verificar configuración
GET /api/email/test

# Enviar email de prueba
POST /api/email/test
{
  "type": "welcome",
  "email": "test@example.com",
  "userName": "Juan Pérez"
}
```

### Tipos de Email Disponibles

- `welcome`: Email de bienvenida
- `order`: Confirmación de pedido
- `reset`: Recuperación de contraseña

## 🔧 Integración en Componentes

### Hook useEmail

```typescript
import { useEmail } from '@/hooks/useEmail';

function MyComponent() {
  const { sendWelcomeEmail, loading, error } = useEmail();

  const handleWelcome = async () => {
    try {
      await sendWelcomeEmail('user@example.com', 'Juan Pérez');
      console.log('Email enviado!');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <button onClick={handleWelcome} disabled={loading}>
      {loading ? 'Enviando...' : 'Enviar Bienvenida'}
    </button>
  );
}
```

### Funciones Directas

```typescript
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/lib/email'

// Email de bienvenida
await sendWelcomeEmail({
  userName: 'Juan Pérez',
  userEmail: 'juan@example.com',
})

// Email de confirmación de pedido
await sendOrderConfirmationEmail({
  userName: 'Juan Pérez',
  userEmail: 'juan@example.com',
  orderNumber: 'ORD-001',
  orderTotal: '$25.990',
  orderItems: [
    { name: 'Pintura Blanca', quantity: 2, price: '$15.990' },
    { name: 'Rodillo', quantity: 1, price: '$9.990' },
  ],
})
```

## 📁 Estructura de Archivos

```
lib/
├── email.ts                    # Configuración y funciones de email
├── env-config.ts              # Variables de entorno (actualizado)

src/
├── app/
│   └── api/
│       └── email/
│           └── test/
│               └── route.ts    # API de testing
├── hooks/
│   └── useEmail.ts            # Hook React para emails
├── components/
│   └── admin/
│       └── EmailTester.tsx    # Componente de testing
└── app/
    └── admin/
        └── email-test/
            └── page.tsx       # Página de administración

docs/
└── EMAIL_CONFIGURATION.md    # Esta documentación
```

## 🎨 Diseño de Emails

### Colores de Marca

- **Primario**: `#ea5a17` (Blaze Orange)
- **Secundario**: `#fc9d04` (Tahiti Gold)
- **Fondo**: `#f9f9f9`
- **Texto**: `#333333`

### Elementos Incluidos

- Header con logo y colores de marca
- Contenido responsive
- Botones de acción estilizados
- Footer con información de la empresa
- Versión texto plano para compatibilidad

## 🔒 Seguridad

### Buenas Prácticas Implementadas

- API Key almacenada en variables de entorno
- Validación de parámetros en APIs
- Manejo de errores robusto
- Rate limiting (implementar en producción)
- Logs de auditoría

### Configuración de Producción

```bash
# Variables de entorno en Vercel
RESEND_API_KEY=re_production-key
RESEND_FROM_EMAIL=noreply@pinteya.com
RESEND_SUPPORT_EMAIL=soporte@pinteya.com
```

## 📊 Monitoreo

### Métricas Disponibles

- Emails enviados exitosamente
- Errores de envío
- Tipos de email más utilizados
- Tiempo de respuesta del servicio

### Logs

Los logs incluyen:

- Timestamp del envío
- Tipo de email
- Destinatario (parcialmente oculto)
- Estado del envío
- Message ID de Resend

## 🚀 Próximos Pasos

### Funcionalidades Futuras

- [ ] Templates dinámicos desde base de datos
- [ ] Programación de emails
- [ ] Segmentación de usuarios
- [ ] A/B testing de templates
- [ ] Analytics de apertura y clicks
- [ ] Integración con marketing automation

### Optimizaciones

- [ ] Cache de templates
- [ ] Queue de emails para alto volumen
- [ ] Retry logic para fallos
- [ ] Webhooks de Resend para tracking

## 🆘 Troubleshooting

### Problemas Comunes

**Error: "RESEND_API_KEY no está configurado"**

- Verifica que la variable esté en `.env.local`
- Reinicia el servidor de desarrollo

**Email no llega**

- Revisa la carpeta de spam
- Verifica que el dominio esté verificado en Resend
- Comprueba los registros DNS

**Error de DNS**

- Espera hasta 24 horas para propagación DNS
- Verifica registros con herramientas como `dig` o `nslookup`

**API Key inválida**

- Regenera la API Key en Resend
- Verifica que tenga permisos de "Send emails"

## 📞 Soporte

Para problemas con la configuración de emails:

1. Revisa los logs en `/api/email/test`
2. Verifica la configuración en `/admin/email-test`
3. Consulta la documentación de Resend
4. Contacta al equipo de desarrollo

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y funcionando
