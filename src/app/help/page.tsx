/**
 * Página de Ayuda - Pinteya E-commerce
 * Centro de ayuda con preguntas frecuentes y soporte
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  ShoppingCart,
  CreditCard,
  Truck,
  RefreshCw,
} from '@/lib/optimized-imports'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '¿Cómo puedo realizar un pedido?',
    answer:
      'Puedes realizar un pedido navegando por nuestro catálogo, agregando productos al carrito y siguiendo el proceso de checkout. También puedes contactarnos directamente para pedidos especiales.',
    category: 'pedidos',
  },
  {
    id: '2',
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Aceptamos tarjetas de crédito, débito, transferencias bancarias y MercadoPago. También ofrecemos opciones de financiamiento para compras mayores.',
    category: 'pagos',
  },
  {
    id: '3',
    question: '¿Hacen envíos a todo el país?',
    answer:
      'Sí, realizamos envíos a toda Argentina. Los tiempos de entrega varían según la ubicación. Consulta los costos y tiempos en el checkout.',
    category: 'envios',
  },
  {
    id: '4',
    question: '¿Puedo devolver un producto?',
    answer:
      'Sí, aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre que el producto esté en condiciones originales.',
    category: 'devoluciones',
  },
  {
    id: '5',
    question: '¿Ofrecen asesoramiento técnico?',
    answer:
      'Sí, nuestro equipo de especialistas puede asesorarte sobre la elección de productos, técnicas de aplicación y cálculo de materiales.',
    category: 'asesoramiento',
  },
  {
    id: '6',
    question: '¿Tienen garantía los productos?',
    answer:
      'Todos nuestros productos cuentan con la garantía del fabricante. La duración varía según el producto y la marca.',
    category: 'garantias',
  },
]

const categories = [
  { id: 'todos', name: 'Todos', icon: HelpCircle },
  { id: 'pedidos', name: 'Pedidos', icon: ShoppingCart },
  { id: 'pagos', name: 'Pagos', icon: CreditCard },
  { id: 'envios', name: 'Envíos', icon: Truck },
  { id: 'devoluciones', name: 'Devoluciones', icon: RefreshCw },
]

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todos' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-blaze-orange-600 to-blaze-orange-500 text-white py-20'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <HelpCircle className='w-16 h-16 mx-auto mb-6' />
            <h1 className='text-4xl md:text-6xl font-bold mb-6'>Centro de Ayuda</h1>
            <p className='text-xl md:text-2xl max-w-3xl mx-auto'>
              Encuentra respuestas a tus preguntas o contáctanos para ayuda personalizada
            </p>
          </motion.div>
        </div>
      </section>

      {/* Búsqueda */}
      <section className='py-12 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='max-w-2xl mx-auto'
          >
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Buscar en preguntas frecuentes...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categorías */}
      <section className='py-8'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-wrap justify-center gap-4'>
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blaze-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className='w-4 h-4' />
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className='py-12'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className='text-3xl font-bold text-center mb-12'
            >
              Preguntas Frecuentes
            </motion.h2>

            <div className='space-y-4'>
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className='border border-gray-200 rounded-lg overflow-hidden'
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className='w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors'
                  >
                    <span className='font-semibold text-gray-900'>{faq.question}</span>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className='w-5 h-5 text-gray-500' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-gray-500' />
                    )}
                  </button>

                  {expandedFAQ === faq.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className='px-6 py-4 bg-gray-50 border-t border-gray-200'
                    >
                      <p className='text-gray-700'>{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-12'
              >
                <p className='text-gray-500 text-lg'>
                  No se encontraron preguntas que coincidan con tu búsqueda.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className='py-16 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              ¿No encontraste lo que buscabas?
            </h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Nuestro equipo de soporte está aquí para ayudarte
            </p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-8 max-w-4xl mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='text-center p-6 bg-white rounded-lg shadow-sm'
            >
              <MessageCircle className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Chat en Vivo</h3>
              <p className='text-gray-600 mb-4'>Chatea con nuestro equipo de soporte</p>
              <button className='bg-blaze-orange-600 text-white px-6 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors'>
                Iniciar Chat
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='text-center p-6 bg-white rounded-lg shadow-sm'
            >
              <Phone className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Teléfono</h3>
              <p className='text-gray-600 mb-4'>Llámanos para soporte inmediato</p>
              <a
                href='tel:+543511234567'
                className='bg-blaze-orange-600 text-white px-6 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors inline-block'
              >
                +54 351 XXX-XXXX
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center p-6 bg-white rounded-lg shadow-sm'
            >
              <Mail className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Email</h3>
              <p className='text-gray-600 mb-4'>Envíanos un mensaje detallado</p>
              <a
                href='mailto:soporte@pinteya.com'
                className='bg-blaze-orange-600 text-white px-6 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors inline-block'
              >
                Enviar Email
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HelpPage
