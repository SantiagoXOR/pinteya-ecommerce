/**
 * Política de Devoluciones - Pinteya E-commerce
 * Página requerida por Google Merchant Center
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  PackageCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

const PoliticaDevolucionesPage = () => {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='bg-gradient-to-r from-blaze-orange-600 to-blaze-orange-500 text-white py-16'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <RefreshCw className='w-16 h-16 mx-auto mb-6' />
            <h1 className='text-4xl md:text-5xl font-bold mb-4'>Política de Devoluciones</h1>
            <p className='text-xl max-w-3xl mx-auto'>
              Tu satisfacción es nuestra prioridad. Conoce nuestras condiciones de devolución y
              cambio de productos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Información Destacada */}
      <section className='py-12 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <div className='grid md:grid-cols-3 gap-6 max-w-5xl mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='bg-white p-6 rounded-lg shadow-sm text-center'
            >
              <Clock className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>30 Días</h3>
              <p className='text-gray-600'>
                Tienes hasta 30 días corridos desde la recepción para solicitar una devolución
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='bg-white p-6 rounded-lg shadow-sm text-center'
            >
              <PackageCheck className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Estado Original</h3>
              <p className='text-gray-600'>
                El producto debe estar sin usar, con etiquetas y en su embalaje original
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className='bg-white p-6 rounded-lg shadow-sm text-center'
            >
              <ShieldCheck className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Reembolso Completo</h3>
              <p className='text-gray-600'>
                Devolución del 100% del valor del producto si cumple las condiciones
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className='py-16'>
        <div className='container mx-auto px-4 max-w-4xl'>
          {/* Condiciones Generales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>Condiciones Generales</h2>

            <div className='prose prose-lg max-w-none'>
              <p className='text-gray-700 mb-4'>
                En <strong>Pinteya</strong>, aceptamos devoluciones de productos defectuosos y no
                defectuosos dentro de los <strong>30 días corridos</strong> posteriores a la fecha
                de recepción del pedido, siempre que se cumplan las siguientes condiciones:
              </p>

              <div className='bg-blue-50 border-l-4 border-blue-500 p-6 my-6'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='w-6 h-6 text-blue-600 flex-shrink-0 mt-1' />
                  <div>
                    <h4 className='font-semibold text-blue-900 mb-2'>Alcance en Argentina</h4>
                    <p className='text-blue-800 text-sm'>
                      Esta política de devoluciones aplica para todos nuestros clientes en
                      Argentina. Los costos de envío para devoluciones se evaluarán caso por caso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Productos Aceptados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>
              Productos que Aceptamos Devolver
            </h2>

            <div className='space-y-4'>
              <div className='flex items-start gap-4 p-4 bg-green-50 rounded-lg'>
                <CheckCircle2 className='w-6 h-6 text-green-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Productos Defectuosos o Dañados
                  </h4>
                  <p className='text-gray-700'>
                    Si el producto llega defectuoso, dañado o no corresponde con tu pedido,
                    realizamos el cambio o reembolso sin costo adicional.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4 p-4 bg-green-50 rounded-lg'>
                <CheckCircle2 className='w-6 h-6 text-green-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Productos No Defectuosos</h4>
                  <p className='text-gray-700'>
                    Aceptamos devoluciones de productos en perfecto estado que no cumplan con tus
                    expectativas, siempre que estén sin abrir, sin usar y en su embalaje original
                    con todas las etiquetas.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4 p-4 bg-green-50 rounded-lg'>
                <CheckCircle2 className='w-6 h-6 text-green-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Cambios de Color o Producto</h4>
                  <p className='text-gray-700'>
                    Si elegiste un color o producto equivocado, puedes solicitar un cambio dentro
                    del plazo establecido, siempre que el producto esté cerrado y sin usar.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Productos NO Aceptados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>
              Productos que NO Aceptamos Devolver
            </h2>

            <div className='space-y-4'>
              <div className='flex items-start gap-4 p-4 bg-red-50 rounded-lg'>
                <XCircle className='w-6 h-6 text-red-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Productos Abiertos o Usados</h4>
                  <p className='text-gray-700'>
                    No aceptamos devoluciones de pinturas, barnices, esmaltes u otros productos que
                    hayan sido abiertos o utilizados, excepto si presentan defectos de fábrica.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4 p-4 bg-red-50 rounded-lg'>
                <XCircle className='w-6 h-6 text-red-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Productos Personalizados</h4>
                  <p className='text-gray-700'>
                    Productos que fueron fabricados o teñidos especialmente según tus
                    especificaciones no pueden ser devueltos, excepto por defectos de fabricación.
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-4 p-4 bg-red-50 rounded-lg'>
                <XCircle className='w-6 h-6 text-red-600 flex-shrink-0 mt-1' />
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Productos en Oferta Final</h4>
                  <p className='text-gray-700'>
                    Productos marcados como "liquidación" o "oferta final" no admiten devolución,
                    excepto por defectos de fábrica.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Proceso de Devolución */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>Proceso de Devolución</h2>

            <div className='space-y-6'>
              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-10 h-10 bg-blaze-orange-600 text-white rounded-full flex items-center justify-center font-bold'>
                  1
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Contacta con Nosotros</h4>
                  <p className='text-gray-700'>
                    Envía un email a{' '}
                    <a
                      href='mailto:devoluciones@pinteya.com'
                      className='text-blaze-orange-600 hover:underline'
                    >
                      devoluciones@pinteya.com
                    </a>{' '}
                    o llama al{' '}
                    <a href='tel:+543513411796' className='text-blaze-orange-600 hover:underline'>
                      +54 351 341 1796
                    </a>{' '}
                    indicando tu número de pedido y el motivo de la devolución.
                  </p>
                </div>
              </div>

              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-10 h-10 bg-blaze-orange-600 text-white rounded-full flex items-center justify-center font-bold'>
                  2
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Aprobación y Coordinación</h4>
                  <p className='text-gray-700'>
                    Nuestro equipo revisará tu solicitud en un plazo máximo de 48 horas hábiles y
                    te indicará los pasos a seguir. Coordinaremos la logística de retiro o envío
                    según corresponda.
                  </p>
                </div>
              </div>

              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-10 h-10 bg-blaze-orange-600 text-white rounded-full flex items-center justify-center font-bold'>
                  3
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Empaqueta el Producto</h4>
                  <p className='text-gray-700'>
                    Empaqueta el producto de forma segura en su embalaje original, incluyendo todos
                    los accesorios, manuales y etiquetas. Incluye una copia de tu comprobante de
                    compra.
                  </p>
                </div>
              </div>

              <div className='flex gap-4'>
                <div className='flex-shrink-0 w-10 h-10 bg-blaze-orange-600 text-white rounded-full flex items-center justify-center font-bold'>
                  4
                </div>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-2'>Inspección y Reembolso</h4>
                  <p className='text-gray-700'>
                    Una vez recibido el producto, realizaremos una inspección para verificar que
                    cumple con las condiciones. Si todo está correcto, procesaremos tu reembolso en
                    un plazo de 5-10 días hábiles al mismo medio de pago utilizado en la compra.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Costos de Envío */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>Costos de Envío</h2>

            <div className='bg-gray-50 p-6 rounded-lg'>
              <ul className='space-y-3 text-gray-700'>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong>Productos defectuosos o error nuestro:</strong> Nos hacemos cargo del
                    100% del costo de envío de devolución.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong>Cambio de opinión o arrepentimiento:</strong> El cliente debe hacerse
                    cargo del costo de envío de devolución, o puede acercarse a nuestro local en
                    Córdoba Capital sin costo.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong>Córdoba Capital:</strong> Ofrecemos retiro sin cargo en la mayoría de
                    los casos.
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Garantía */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className='mb-12'
          >
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>Garantía del Fabricante</h2>

            <div className='bg-gray-50 p-6 rounded-lg'>
              <p className='text-gray-700 mb-4'>
                Además de nuestra política de devoluciones, todos nuestros productos cuentan con la
                garantía oficial del fabricante. La duración y condiciones de la garantía varían
                según la marca y el tipo de producto.
              </p>
              <p className='text-gray-700'>
                Para hacer efectiva una garantía del fabricante, conserva tu comprobante de compra
                y contacta con nosotros para gestionar el reclamo correspondiente.
              </p>
            </div>
          </motion.div>
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
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>¿Necesitas Ayuda?</h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Si tienes dudas sobre nuestra política de devoluciones, estamos aquí para ayudarte
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-8 max-w-3xl mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className='text-center p-6 bg-white rounded-lg shadow-sm'
            >
              <Mail className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Email</h3>
              <p className='text-gray-600 mb-4'>Envíanos tu consulta sobre devoluciones</p>
              <a
                href='mailto:devoluciones@pinteya.com'
                className='text-blaze-orange-600 hover:underline font-medium'
              >
                devoluciones@pinteya.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='text-center p-6 bg-white rounded-lg shadow-sm'
            >
              <Phone className='w-12 h-12 text-blaze-orange-600 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Teléfono</h3>
              <p className='text-gray-600 mb-4'>Llámanos para resolver tus dudas</p>
              <a
                href='tel:+543513411796'
                className='text-blaze-orange-600 hover:underline font-medium'
              >
                +54 351 341 1796
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='text-center mt-8'
          >
            <p className='text-sm text-gray-500'>Última actualización: Diciembre 2025</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default PoliticaDevolucionesPage

