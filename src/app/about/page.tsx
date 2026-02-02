/**
 * Página Acerca de Nosotros - Pinteya E-commerce
 * Información sobre la empresa, misión, visión y valores
 */

'use client'

import React from 'react'
// ⚡ OPTIMIZACIÓN: Usar lazy loader de framer-motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
import { Building2, Users, Target, Award, MapPin, Phone, Mail, Clock } from '@/lib/optimized-imports'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { formatBusinessHours } from '@/lib/tenant/format-business-hours'

const AboutPage = () => {
  // ⚡ MULTITENANT: Obtener datos del tenant
  const tenant = useTenantSafe()
  const tenantName = tenant?.name || 'Pinteya'
  const contactPhone = tenant?.contactPhone || getTenantWhatsAppNumber(tenant)
  const displayPhone = contactPhone.replace(/^549(\d{3})(\d{3})(\d{4})$/, '+54 9 $1 $2-$3')
  const supportEmail = tenant?.supportEmail || `info@${tenant?.slug || 'pinteya'}.com`
  const contactAddress = tenant?.contactAddress || 'Córdoba, Argentina'
  const contactCity = tenant?.contactCity || 'Córdoba'
  const businessHoursText = formatBusinessHours(tenant?.businessHours)
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-blaze-orange-600 to-blaze-orange-500 text-white py-20'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <h1 className='text-4xl md:text-6xl font-bold mb-6'>Acerca de {tenantName}</h1>
            <p className='text-xl md:text-2xl max-w-3xl mx-auto'>
              Tu socio de confianza en pinturería, ferretería y materiales de construcción
            </p>
          </motion.div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='grid md:grid-cols-2 gap-12 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>Nuestra Historia</h2>
              <p className='text-gray-700 mb-4'>
                {tenantName} nace de la pasión por brindar soluciones completas en pinturería y
                ferretería. Con años de experiencia en el sector, nos hemos consolidado como una
                empresa líder en la distribución de productos de calidad.
              </p>
              <p className='text-gray-700'>
                Nuestro compromiso es ofrecer productos de las mejores marcas, asesoramiento
                especializado y un servicio excepcional que supere las expectativas de nuestros
                clientes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-gray-50 p-8 rounded-lg'
            >
              <Building2 className='w-16 h-16 text-blaze-orange-600 mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Empresa Establecida</h3>
              <p className='text-gray-700'>
                Con presencia sólida en el mercado argentino, ofreciendo productos de calidad y
                servicio personalizado.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className='py-16 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>Nuestros Valores</h2>
            <p className='text-gray-700 max-w-2xl mx-auto'>
              Los principios que guían nuestro trabajo diario y nuestra relación con los clientes
            </p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='text-center'
            >
              <Target className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Calidad</h3>
              <p className='text-gray-700'>
                Seleccionamos cuidadosamente productos de las mejores marcas para garantizar
                resultados excepcionales.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='text-center'
            >
              <Users className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Servicio</h3>
              <p className='text-gray-700'>
                Nuestro equipo especializado brinda asesoramiento personalizado para cada proyecto y
                necesidad.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center'
            >
              <Award className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Confianza</h3>
              <p className='text-gray-700'>
                Construimos relaciones duraderas basadas en la transparencia, honestidad y
                cumplimiento de compromisos.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className='py-16'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>Contáctanos</h2>
            <p className='text-gray-700'>Estamos aquí para ayudarte con tus proyectos</p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='text-center'
            >
              <MapPin className='w-8 h-8 text-blaze-orange-600 mx-auto mb-2' />
              <h4 className='font-semibold text-gray-900 mb-1'>Ubicación</h4>
              <p className='text-gray-700 text-sm'>{contactAddress}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='text-center'
            >
              <Phone className='w-8 h-8 text-blaze-orange-600 mx-auto mb-2' />
              <h4 className='font-semibold text-gray-900 mb-1'>Teléfono</h4>
              <p className='text-gray-700 text-sm'>{displayPhone}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='text-center'
            >
              <Mail className='w-8 h-8 text-blaze-orange-600 mx-auto mb-2' />
              <h4 className='font-semibold text-gray-900 mb-1'>Email</h4>
              <p className='text-gray-700 text-sm'>{supportEmail}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='text-center'
            >
              <Clock className='w-8 h-8 text-blaze-orange-600 mx-auto mb-2' />
              <h4 className='font-semibold text-gray-900 mb-1'>Horarios</h4>
              <p className='text-gray-700 text-sm'>{businessHoursText}</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
