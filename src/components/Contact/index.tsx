// ===================================
// CONTACT COMPONENT
// ===================================
// Componente de contacto para la página de contacto

'use client'

import React from 'react'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ===================================
// INTERFACES
// ===================================

interface ContactInfo {
  icon: React.ReactNode
  title: string
  content: string
  link?: string
}

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

const Contact: React.FC = () => {
  const [formData, setFormData] = React.useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Información de contacto
  const contactInfo: ContactInfo[] = [
    {
      icon: <Phone className='w-6 h-6' />,
      title: 'Teléfono',
      content: '+54 9 351 341-1796',
      link: 'tel:+5493513411796',
    },
    {
      icon: <Mail className='w-6 h-6' />,
      title: 'Email',
      content: 'info@pinteya.com.ar',
      link: 'mailto:info@pinteya.com.ar',
    },
    {
      icon: <MapPin className='w-6 h-6' />,
      title: 'Dirección',
      content: 'Córdoba Capital, Argentina',
    },
    {
      icon: <Clock className='w-6 h-6' />,
      title: 'Horarios',
      content: 'Lun - Vie: 8:00 - 18:00\nSáb: 8:00 - 13:00',
    },
  ]

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Aquí se implementaría la lógica de envío
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Resetear formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })

      alert('Mensaje enviado correctamente. Te contactaremos pronto.')
    } catch (error) {
      alert('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Contactanos</h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            ¿Tenés alguna consulta sobre nuestros productos? ¿Necesitás asesoramiento técnico?
            Estamos acá para ayudarte.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
          {/* Información de contacto */}
          <div className='space-y-8'>
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
                            <p className='text-gray-600 whitespace-pre-line'>{info.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl text-gray-900'>¿Por qué elegirnos?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3 text-gray-600'>
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
                    Envíos a toda Córdoba
                  </li>
                  <li className='flex items-center'>
                    <div className='w-2 h-2 bg-blaze-orange-600 rounded-full mr-3'></div>
                    Atención personalizada
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de contacto */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl text-gray-900'>Envianos tu consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label
                        htmlFor='name'
                        className='block text-sm font-medium text-gray-700 mb-2'
                      >
                        Nombre *
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                        placeholder='Tu nombre'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='phone'
                        className='block text-sm font-medium text-gray-700 mb-2'
                      >
                        Teléfono
                      </label>
                      <input
                        type='tel'
                        id='phone'
                        name='phone'
                        value={formData.phone}
                        onChange={handleInputChange}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                        placeholder='Tu teléfono'
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                      Email *
                    </label>
                    <input
                      type='email'
                      id='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                      placeholder='tu@email.com'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='subject'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Asunto *
                    </label>
                    <input
                      type='text'
                      id='subject'
                      name='subject'
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                      placeholder='¿En qué te podemos ayudar?'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='message'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Mensaje *
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent resize-vertical'
                      placeholder='Contanos tu consulta en detalle...'
                    />
                  </div>

                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className='w-4 h-4 mr-2' />
                        Enviar mensaje
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
