'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MessageCircle, Package, Truck, MapPin, Edit } from '@/lib/optimized-imports'

// ===================================
// TYPES
// ===================================

interface WhatsAppQuickActionsProps {
  phone: string
  orderNumber: string
  clientName: string
  total?: number
}

// ===================================
// MESSAGE TEMPLATES
// ===================================

const createMessageTemplates = (clientName: string, orderNumber: string, total?: number) => {
  const firstName = clientName.split(' ')[0] || 'Cliente'
  const formattedTotal = total 
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)
    : ''

  return [
    {
      id: 'order_received',
      label: 'Orden Recibida',
      icon: Package,
      message: `Hola ${firstName}! Recibimos tu pedido ${orderNumber} en Pinteya. Ya estamos trabajando en el. Te avisamos cuando este listo. Gracias por elegirnos!`,
    },
    {
      id: 'preparing',
      label: 'Preparando Pedido',
      icon: Package,
      message: `Hola ${firstName}! Tu pedido ${orderNumber} ya esta siendo preparado con mucho cuidado. Pronto te avisamos cuando este listo para enviar!`,
    },
    {
      id: 'dispatched',
      label: 'Pedido Despachado',
      icon: Truck,
      message: `Hola ${firstName}! Tu pedido ${orderNumber} ya salio en camino! Pronto lo tendras en tus manos. Cualquier duda, escribinos!`,
    },
    {
      id: 'arriving',
      label: 'Carrier Llegando',
      icon: MapPin,
      message: `Hola ${firstName}! El repartidor esta llegando a tu domicilio con tu pedido ${orderNumber}. Por favor, estate atento. Gracias!`,
    },
  ]
}

// ===================================
// UTILITIES
// ===================================

function normalizePhoneNumber(phone: string): string {
  // Remover todos los caracteres que no sean números
  let cleaned = phone.replace(/\D/g, '')
  
  // Si el número empieza con 0, removerlo (códigos de área argentinos)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Si no tiene código de país, agregar el de Argentina (54)
  if (!cleaned.startsWith('54')) {
    cleaned = '54' + cleaned
  }
  
  return cleaned
}

function openWhatsApp(phone: string, message?: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  const encodedMessage = message ? encodeURIComponent(message) : ''
  const url = message 
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/${normalizedPhone}`
  
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ===================================
// COMPONENT
// ===================================

export function WhatsAppQuickActions({
  phone,
  orderNumber,
  clientName,
  total,
}: WhatsAppQuickActionsProps) {
  const messageTemplates = createMessageTemplates(clientName, orderNumber, total)

  if (!phone) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600 transition-colors'
          title='Enviar mensaje por WhatsApp'
        >
          <MessageCircle className='h-3.5 w-3.5 text-green-600' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56'>
        <DropdownMenuLabel className='text-xs text-gray-500'>
          Mensajes Predeterminados
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {messageTemplates.map((template) => {
          const Icon = template.icon
          return (
            <DropdownMenuItem
              key={template.id}
              onClick={() => openWhatsApp(phone, template.message)}
              className='cursor-pointer'
            >
              <Icon className='mr-2 h-4 w-4 text-green-600' />
              <span>{template.label}</span>
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => openWhatsApp(phone)}
          className='cursor-pointer'
        >
          <Edit className='mr-2 h-4 w-4 text-gray-500' />
          <span>Mensaje Personalizado</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
