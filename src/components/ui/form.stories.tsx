import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Mail, User, MessageSquare, CreditCard, Truck, Package } from 'lucide-react'
import { 
  Form, 
  FormSection, 
  FormRow, 
  FormField, 
  FormActions, 
  FormMessage,
  useForm 
} from './form'
import { Input } from './input'
import { Textarea } from './textarea'
import { Checkbox, CheckboxGroup } from './checkbox'
import { RadioGroup, RadioGroupItem, ShippingMethodRadio, PaymentMethodRadio } from './radio-group'
import { SelectField, SelectItem } from './select'
import { Button } from './button'

const meta = {
  title: 'UI/Form Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Form Components

Sistema completo de componentes de formulario para e-commerce con validación, estados y casos de uso específicos.

## Componentes

- **Form**: Contenedor principal del formulario
- **FormSection**: Secciones para agrupar campos relacionados
- **FormRow**: Filas para organizar campos en columnas
- **FormField**: Contenedor genérico para campos
- **FormActions**: Área para botones de acción
- **FormMessage**: Mensajes de estado del formulario
- **Input**: Campo de entrada de texto con variantes
- **Textarea**: Área de texto con auto-resize y contador
- **Checkbox**: Checkbox con variantes y grupos
- **RadioGroup**: Grupos de radio buttons con cards
- **Select**: Select dropdown con búsqueda
- **useForm**: Hook para manejo de estado y validación

## Características

- **Validación**: Sistema de validación integrado
- **Accesibilidad**: WCAG 2.1 AA compliant
- **Responsive**: Layouts adaptativos
- **E-commerce ready**: Componentes específicos para tienda
- **TypeScript**: Completamente tipado
- **Estados**: Loading, error, success, disabled

## Casos de Uso

- Formularios de contacto
- Checkout de e-commerce
- Registro de usuarios
- Reseñas de productos
- Configuración de cuenta
- Filtros de búsqueda

## Paleta de Colores

Utiliza la paleta Tahiti Gold del Design System para consistencia visual.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

// Formulario básico
export const BasicForm: Story = {
  render: () => {
    const { values, errors, isSubmitting, handleSubmit, register } = useForm({
      defaultValues: { name: '', email: '', message: '' },
      onSubmit: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Formulario enviado: ${JSON.stringify(data, null, 2)}`)
      },
      validate: (data) => {
        const errors: Record<string, string> = {}
        if (!data.name) errors.name = 'Nombre requerido'
        if (!data.email) errors.email = 'Email requerido'
        if (!data.message) errors.message = 'Mensaje requerido'
        return Object.keys(errors).length > 0 ? errors : null
      }
    })

    return (
      <div className="w-full max-w-md">
        <Form onSubmit={handleSubmit}>
          <FormSection title="Contacto" description="Envíanos un mensaje">
            <Input
              label="Nombre"
              placeholder="Tu nombre completo"
              leftIcon={<User className="h-4 w-4" />}
              {...register('name')}
              required
            />
            
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              leftIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              required
            />
            
            <Textarea
              label="Mensaje"
              placeholder="Escribe tu mensaje aquí..."
              {...register('message')}
              required
            />
            
            <FormActions>
              <Button type="submit" loading={isSubmitting}>
                Enviar Mensaje
              </Button>
            </FormActions>
          </FormSection>
        </Form>
      </div>
    )
  },
}

// Formulario con múltiples secciones
export const MultiSectionForm: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Form>
        <FormSection 
          title="Información Personal" 
          description="Datos básicos del usuario"
        >
          <FormRow columns={2}>
            <Input label="Nombre" placeholder="Juan" required />
            <Input label="Apellido" placeholder="Pérez" required />
          </FormRow>
          
          <FormRow columns={2}>
            <Input label="Email" type="email" placeholder="juan@email.com" required />
            <Input label="Teléfono" placeholder="+54 11 1234-5678" />
          </FormRow>
        </FormSection>

        <FormSection 
          title="Dirección" 
          description="Información de envío"
        >
          <Input label="Dirección" placeholder="Av. Corrientes 1234" required />
          
          <FormRow columns={3}>
            <Input label="Ciudad" placeholder="Buenos Aires" required />
            <Input label="Provincia" placeholder="CABA" required />
            <Input label="Código Postal" placeholder="1043" required />
          </FormRow>
        </FormSection>

        <FormActions align="between">
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar Información</Button>
        </FormActions>
      </Form>
    </div>
  ),
}

// Checkbox y Radio Groups
export const CheckboxAndRadio: Story = {
  render: () => {
    const [shippingMethod, setShippingMethod] = useState('standard')
    const [paymentMethod, setPaymentMethod] = useState('mercadopago')
    
    const shippingMethods = [
      {
        id: 'standard',
        name: 'Envío Estándar',
        description: '5-7 días hábiles',
        price: 'Gratis',
        icon: <Package className="h-4 w-4" />,
      },
      {
        id: 'express',
        name: 'Envío Express',
        description: '2-3 días hábiles',
        price: '$1.500',
        badge: 'Rápido',
        icon: <Truck className="h-4 w-4" />,
      },
    ]

    const paymentMethods = [
      {
        id: 'mercadopago',
        name: 'MercadoPago',
        description: 'Tarjetas, efectivo, transferencia',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        id: 'transfer',
        name: 'Transferencia Bancaria',
        description: '5% de descuento',
        badge: 'Descuento',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ]

    return (
      <div className="w-full max-w-lg space-y-6">
        <CheckboxGroup 
          label="Preferencias de Marketing"
          description="Selecciona las comunicaciones que deseas recibir"
        >
          <Checkbox label="Newsletter semanal" description="Ofertas y novedades" />
          <Checkbox label="Promociones especiales" description="Descuentos exclusivos" />
          <Checkbox label="Notificaciones de stock" description="Cuando lleguen productos" />
        </CheckboxGroup>

        <ShippingMethodRadio
          methods={shippingMethods}
          value={shippingMethod}
          onValueChange={setShippingMethod}
        />

        <PaymentMethodRadio
          methods={paymentMethods}
          value={paymentMethod}
          onValueChange={setPaymentMethod}
        />
      </div>
    )
  },
}

// Select y Textarea avanzados
export const AdvancedFields: Story = {
  render: () => {
    const [category, setCategory] = useState('')
    const [rating, setRating] = useState('')

    return (
      <div className="w-full max-w-md space-y-6">
        <SelectField
          label="Categoría de Producto"
          description="Selecciona la categoría que mejor describe tu consulta"
          placeholder="Elegir categoría..."
          value={category}
          onValueChange={setCategory}
          required
        >
          <SelectItem value="pinturas">Pinturas</SelectItem>
          <SelectItem value="herramientas">Herramientas</SelectItem>
          <SelectItem value="accesorios">Accesorios</SelectItem>
          <SelectItem value="otros">Otros</SelectItem>
        </SelectField>

        <SelectField
          label="Calificación"
          placeholder="¿Cómo calificarías el producto?"
          value={rating}
          onValueChange={setRating}
        >
          <SelectItem value="5">⭐⭐⭐⭐⭐ Excelente</SelectItem>
          <SelectItem value="4">⭐⭐⭐⭐ Muy bueno</SelectItem>
          <SelectItem value="3">⭐⭐⭐ Bueno</SelectItem>
          <SelectItem value="2">⭐⭐ Regular</SelectItem>
          <SelectItem value="1">⭐ Malo</SelectItem>
        </SelectField>

        <Textarea
          label="Reseña del Producto"
          placeholder="Comparte tu experiencia con este producto..."
          description="Ayuda a otros compradores con tu opinión"
          maxLength={500}
          showCharCount
          autoResize
        />
      </div>
    )
  },
}

// Estados de formulario
export const FormStates: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <FormMessage variant="info">
        <strong>Información:</strong> Completa todos los campos requeridos.
      </FormMessage>

      <FormMessage variant="success">
        <strong>¡Éxito!</strong> Tu formulario se envió correctamente.
      </FormMessage>

      <FormMessage variant="warning">
        <strong>Advertencia:</strong> Algunos campos necesitan revisión.
      </FormMessage>

      <FormMessage variant="error">
        <strong>Error:</strong> Hubo un problema al enviar el formulario.
      </FormMessage>

      <div className="space-y-4">
        <Input label="Campo Normal" placeholder="Estado normal" />
        <Input label="Campo con Error" placeholder="Estado de error" error="Este campo es requerido" />
        <Input label="Campo Exitoso" placeholder="Estado exitoso" variant="success" />
        <Input label="Campo Deshabilitado" placeholder="Estado deshabilitado" disabled />
      </div>
    </div>
  ),
}

// Formulario de checkout completo
export const CheckoutForm: Story = {
  render: () => {
    const [sameAsShipping, setSameAsShipping] = useState(true)
    
    return (
      <div className="w-full max-w-4xl">
        <Form>
          <FormSection 
            title="Información de Envío"
            description="Datos para la entrega de tu pedido"
          >
            <FormRow columns={2}>
              <Input label="Nombre" placeholder="Juan" required />
              <Input label="Apellido" placeholder="Pérez" required />
            </FormRow>
            
            <Input label="Dirección" placeholder="Av. Corrientes 1234" required />
            
            <FormRow columns={3}>
              <Input label="Ciudad" placeholder="Buenos Aires" required />
              <SelectField label="Provincia" placeholder="Seleccionar..." required>
                <SelectItem value="caba">CABA</SelectItem>
                <SelectItem value="bsas">Buenos Aires</SelectItem>
                <SelectItem value="cordoba">Córdoba</SelectItem>
              </SelectField>
              <Input label="CP" placeholder="1043" required />
            </FormRow>
          </FormSection>

          <FormSection title="Información de Facturación">
            <Checkbox 
              label="Usar la misma dirección para facturación"
              checked={sameAsShipping}
              onCheckedChange={(checked) => setSameAsShipping(checked === true)}
            />
            
            {!sameAsShipping && (
              <div className="space-y-4 mt-4">
                <Input label="Dirección de Facturación" placeholder="Dirección diferente" />
                <FormRow columns={3}>
                  <Input label="Ciudad" placeholder="Ciudad" />
                  <SelectField label="Provincia" placeholder="Provincia">
                    <SelectItem value="caba">CABA</SelectItem>
                    <SelectItem value="bsas">Buenos Aires</SelectItem>
                  </SelectField>
                  <Input label="CP" placeholder="CP" />
                </FormRow>
              </div>
            )}
          </FormSection>

          <FormSection title="Comentarios Adicionales">
            <Textarea
              label="Instrucciones de Entrega (Opcional)"
              placeholder="Ej: Tocar timbre, dejar en portería, etc."
              helperText="Cualquier información adicional para el repartidor"
            />
          </FormSection>

          <FormActions align="between">
            <Button variant="outline">Volver al Carrito</Button>
            <Button size="lg">Continuar al Pago</Button>
          </FormActions>
        </Form>
      </div>
    )
  },
}
