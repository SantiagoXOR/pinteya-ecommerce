import type { Meta, StoryObj } from '@storybook/react'
import { Search, Mail, Lock, Eye, EyeOff, User, Phone, MapPin } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { useState } from 'react'

const meta = {
  title: 'Design System/Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component

Componente de input versátil con validaciones, estados y funcionalidades avanzadas para formularios de e-commerce.

## Características

- **3 variantes**: Default, Error, Success
- **3 tamaños**: sm, md, lg
- **Estados**: Normal, Error, Success, Disabled
- **Funcionalidades**: Labels, helper text, íconos, validaciones
- **Accesibilidad**: WCAG 2.1 AA compliant

## Funcionalidades

- **Labels automáticos**: Con indicador de campo requerido
- **Validaciones visuales**: Estados de error y éxito
- **Helper text**: Texto de ayuda y mensajes de error
- **Íconos**: Izquierda y derecha con interacciones
- **Tipos especializados**: Email, password, search, etc.

## Uso

\`\`\`tsx
import { Input } from '@/components/ui/input'

<Input
  label="Email"
  type="email"
  placeholder="tu@email.com"
  required
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Variante visual del input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
      description: 'Tipo de input HTML',
    },
    label: {
      control: 'text',
      description: 'Etiqueta del campo',
    },
    placeholder: {
      control: 'text',
      description: 'Texto placeholder',
    },
    helperText: {
      control: 'text',
      description: 'Texto de ayuda',
    },
    error: {
      control: 'text',
      description: 'Mensaje de error',
    },
    required: {
      control: 'boolean',
      description: 'Campo requerido',
    },
    disabled: {
      control: 'boolean',
      description: 'Campo deshabilitado',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// Input básico
export const Default: Story = {
  args: {
    placeholder: 'Ingresa tu texto...',
    variant: 'default',
    size: 'md',
  },
}

// Con label
export const WithLabel: Story = {
  args: {
    label: 'Nombre completo',
    placeholder: 'Juan Pérez',
    required: true,
  },
}

// Tamaños
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input size="sm" placeholder="Pequeño" label="Input pequeño" />
      <Input size="md" placeholder="Mediano" label="Input mediano" />
      <Input size="lg" placeholder="Grande" label="Input grande" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamaños disponibles para inputs.',
      },
    },
  },
}

// Estados
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input 
        label="Estado normal" 
        placeholder="Input normal" 
        helperText="Este es un texto de ayuda"
      />
      <Input 
        label="Estado de error" 
        placeholder="Input con error" 
        error="Este campo es requerido"
        value="texto inválido"
      />
      <Input 
        label="Estado de éxito" 
        variant="success" 
        placeholder="Input válido" 
        helperText="¡Perfecto!"
        value="texto válido"
      />
      <Input 
        label="Estado deshabilitado" 
        placeholder="Input deshabilitado" 
        disabled
        value="no editable"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes estados visuales del input: normal, error, éxito y deshabilitado.',
      },
    },
  },
}

// Con íconos
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input 
        label="Búsqueda" 
        placeholder="Buscar productos..." 
        leftIcon={<Search className="w-4 h-4" />}
      />
      <Input 
        label="Email" 
        type="email"
        placeholder="tu@email.com" 
        leftIcon={<Mail className="w-4 h-4" />}
      />
      <Input 
        label="Usuario" 
        placeholder="nombre_usuario" 
        leftIcon={<User className="w-4 h-4" />}
        rightIcon={<Button variant="ghost" size="icon-sm">✓</Button>}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs con íconos a la izquierda y/o derecha.',
      },
    },
  },
}

// Password con toggle
export const PasswordToggle: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false)
    
    return (
      <div className="w-80">
        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="Tu contraseña"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Input de contraseña con toggle para mostrar/ocultar.',
      },
    },
  },
}

// Tipos especializados
export const SpecializedTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input 
        label="Email" 
        type="email"
        placeholder="tu@email.com" 
        leftIcon={<Mail className="w-4 h-4" />}
        helperText="Usaremos este email para enviarte actualizaciones"
      />
      <Input 
        label="Teléfono" 
        type="tel"
        placeholder="+54 11 1234-5678" 
        leftIcon={<Phone className="w-4 h-4" />}
      />
      <Input 
        label="Código postal" 
        type="text"
        placeholder="1234" 
        leftIcon={<MapPin className="w-4 h-4" />}
        helperText="Para calcular el costo de envío"
      />
      <Input 
        label="Cantidad" 
        type="number"
        placeholder="1" 
        min="1"
        max="99"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs especializados para diferentes tipos de datos.',
      },
    },
  },
}

// Formulario de ejemplo
export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Información de contacto</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Nombre" 
            placeholder="Juan" 
            required
          />
          <Input 
            label="Apellido" 
            placeholder="Pérez" 
            required
          />
        </div>
        
        <Input 
          label="Email" 
          type="email"
          placeholder="juan@email.com" 
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
        
        <Input 
          label="Teléfono" 
          type="tel"
          placeholder="+54 11 1234-5678" 
          leftIcon={<Phone className="w-4 h-4" />}
          helperText="Para coordinar la entrega"
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dirección de envío</h3>
        
        <Input 
          label="Dirección" 
          placeholder="Av. Corrientes 1234" 
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Ciudad" 
            placeholder="Córdoba" 
            required
          />
          <Input 
            label="Código postal" 
            placeholder="5000" 
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />
        </div>
      </div>
      
      <Button variant="primary" fullWidth size="lg">
        Continuar con el pedido
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de formulario completo usando diferentes tipos de inputs.',
      },
    },
  },
}

// Búsqueda avanzada
export const SearchExample: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input 
        label="Buscar productos" 
        placeholder="Ej: pintura blanca interior" 
        leftIcon={<Search className="w-4 h-4" />}
        rightIcon={
          <Button variant="primary" size="sm">
            Buscar
          </Button>
        }
        helperText="Busca por nombre, marca o categoría"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Precio mínimo" 
          type="number"
          placeholder="1000" 
          helperText="En pesos argentinos"
        />
        <Input 
          label="Precio máximo" 
          type="number"
          placeholder="10000" 
          helperText="En pesos argentinos"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de búsqueda avanzada con filtros de precio.',
      },
    },
  },
}

// Validaciones en tiempo real
export const ValidationExample: Story = {
  render: () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    
    const isValidEmail = email.includes('@') && email.includes('.')
    const isValidPassword = password.length >= 8
    
    return (
      <div className="space-y-4 w-80">
        <Input 
          label="Email" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com" 
          leftIcon={<Mail className="w-4 h-4" />}
          variant={email && !isValidEmail ? 'error' : email && isValidEmail ? 'success' : 'default'}
          error={email && !isValidEmail ? 'Email inválido' : undefined}
          helperText={email && isValidEmail ? '¡Email válido!' : 'Ingresa un email válido'}
          required
        />
        
        <Input 
          label="Contraseña" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres" 
          leftIcon={<Lock className="w-4 h-4" />}
          variant={password && !isValidPassword ? 'error' : password && isValidPassword ? 'success' : 'default'}
          error={password && !isValidPassword ? 'La contraseña debe tener al menos 8 caracteres' : undefined}
          helperText={password && isValidPassword ? '¡Contraseña válida!' : 'Mínimo 8 caracteres'}
          required
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de validación en tiempo real con feedback visual.',
      },
    },
  },
}









