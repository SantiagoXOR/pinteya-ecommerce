// ===================================
// CONTACT COMPONENT
// ===================================
// Componente de contacto para la página de contacto

'use client'

import React from 'react'
import { Mail, Phone, MapPin, Clock } from '@/lib/optimized-imports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WhatsAppQR } from '@/components/ui/whatsapp-qr'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { formatBusinessHours } from '@/lib/tenant/format-business-hours'

// ===================================
// INTERFACES
// ===================================

interface ContactInfo {
  icon: React.ReactNode
  title: string
  content: string
  link?: string
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

const Contact: React.FC = () => {
  // Obtener datos de contacto del tenant
  const tenant = useTenantSafe()
  const contactPhone = tenant?.contactPhone || getTenantWhatsAppNumber(tenant)
  const displayPhone = contactPhone.replace(/^549(\d{3})(\d{3})(\d{4})$/, '+54 9 $1 $2-$3')
  const supportEmail = tenant?.supportEmail || (tenant?.name ? `info@${tenant.slug}.com.ar` : 'info@pinteya.com.ar')
  const contactAddress = tenant?.contactAddress || `${tenant?.contactCity || 'Córdoba Capital'}, Argentina`
  const businessHoursText = formatBusinessHours(tenant?.businessHours)

  // Información de contacto (dinámica por tenant)
  const contactInfo: ContactInfo[] = [
    {
      icon: <Phone className='w-6 h-6' />,
      title: 'Teléfono',
      content: displayPhone,
      link: `tel:+${contactPhone}`,
    },
    {
      icon: <Mail className='w-6 h-6' />,
      title: 'Email',
      content: supportEmail,
      link: `mailto:${supportEmail}`,
    },
    {
      icon: <MapPin className='w-6 h-6' />,
      title: 'Dirección',
      content: contactAddress,
    },
    {
      icon: <Clock className='w-6 h-6' />,
      title: 'Horarios',
      content: businessHoursText,
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Contactanos</h1>
          <p className='text-xl text-gray-700 max-w-3xl mx-auto'>
            ¿Tenés alguna consulta sobre nuestros productos? ¿Necesitás asesoramiento técnico?
            Estamos acá para ayudarte.
          </p>
        </div>

        <div className='max-w-3xl mx-auto space-y-8'>
          {/* Información de contacto */}
          <div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>Información de Contacto</h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                {contactInfo.map((info, index) => (
                  <Card key={index} className='hover:shadow-md transition-shadow'>
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div className='flex-shrink-0 w-12 h-12 bg-blaze-orange-100 rounded-lg flex items-center justify-center text-blaze-orange-600'>
                          {info.icon}
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900 mb-1'>{info.title}</h3>
                          {info.link ? (
                            <a
                              href={info.link}
                              className='text-blaze-orange-600 hover:text-blaze-orange-700 transition-colors whitespace-pre-line'
                            >
                              {info.content}
                            </a>
                          ) : (
                            <p className='text-gray-700 whitespace-pre-line'>{info.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* QR de WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl text-gray-900'>Escaneá nuestro QR de WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col items-center'>
                <p className='text-gray-700 mb-4 text-center'>
                  Escaneá el código QR para contactarnos directamente por WhatsApp
                </p>
                <WhatsAppQR 
                  size={200} 
                  message="Hola! Me gustaría obtener más información sobre sus productos"
                />
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl text-gray-900'>¿Por qué elegirnos?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3 text-gray-700'>
                  <li className='flex items-center'>
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full mr-3'></div>
                    Asesoramiento técnico especializado
                  </li>
                  <li className='flex items-center'>
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full mr-3'></div>
                    Productos de primeras marcas
                  </li>
                  <li className='flex items-center'>
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full mr-3'></div>
                    Envíos a {tenant?.contactCity || 'Córdoba'} y alrededores
                  </li>
                  <li className='flex items-center'>
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full mr-3'></div>
                    Atención personalizada
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
