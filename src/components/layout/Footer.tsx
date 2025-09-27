'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className='bg-white border-t border-gray-200'>
      {/* Versión mobile ultra compacta - actualizada */}
      <div className='block md:hidden'>
        <div className='max-w-7xl mx-auto px-4 py-4 pb-6'>
          {/* Header compacto con botones alineados */}
          <div className='flex items-center justify-between mb-3'>
            <Image
              src='/images/logo/LOGO NEGATIVO.svg'
              alt='Pinteya'
              width={100}
              height={35}
              className='h-7 w-auto'
            />
            <div className='flex items-center gap-2'>
              <a
                href='tel:+5493513411796'
                className='w-8 h-8 bg-[#ea5a17] rounded-full flex items-center justify-center text-white hover:bg-[#d14d0f] transition-colors'
                aria-label='Llamar'
              >
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                </svg>
              </a>
              <a
                href='https://wa.me/5493513411796'
                target='_blank'
                rel='noopener noreferrer'
                className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors'
                aria-label='WhatsApp'
              >
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488' />
                </svg>
              </a>
            </div>
          </div>

          {/* Badges ultra compactos */}
          <div className='flex items-center justify-center gap-1 mb-3'>
            <div className='flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs'>
              <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-green-800 font-medium'>Seguro</span>
            </div>
            <div className='flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs'>
              <svg className='w-3 h-3 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
              </svg>
              <span className='text-blue-800 font-medium'>Envío</span>
            </div>
            <div className='flex items-center gap-1 px-2 py-1 bg-orange-50 rounded text-xs'>
              <svg className='w-3 h-3 text-[#ea5a17]' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
              </svg>
              <span className='text-[#ea5a17] font-medium'>+15 años</span>
            </div>
          </div>

          {/* Enlaces compactos */}
          <div className='flex justify-center gap-2 mb-3'>
            <Link href='/shop' className='text-xs bg-[#ea5a17] text-white px-2 py-1 rounded-full'>
              Tienda
            </Link>
            <Link
              href='/contact'
              className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'
            >
              Contacto
            </Link>
            <Link
              href='/about'
              className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'
            >
              Nosotros
            </Link>
            <Link href='/help' className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
              Ayuda
            </Link>
          </div>

          {/* MercadoPago más visible */}
          <div className='flex justify-center mb-3'>
            <Image
              src='/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg'
              alt='MercadoPago'
              width={100}
              height={32}
              className='h-6 w-auto'
            />
          </div>

          {/* Métodos de pago agrupados en una caja */}
          <div className='space-y-3'>
            <h4 className='text-sm font-semibold text-gray-800 text-center'>Métodos de Pago</h4>

            {/* Todos los métodos de pago en una sola caja */}
            <div className='bg-white rounded-lg border p-3 shadow-sm space-y-3'>
              {/* Tarjetas principales */}
              <div>
                <div className='flex items-center justify-center gap-3 mb-2'>
                  <div className='w-12 h-8 bg-white rounded border-2 shadow-md flex items-center justify-center p-1'>
                    <Image
                      src='/images/logo/visa.svg'
                      alt='Visa'
                      width={36}
                      height={18}
                      className='w-9 h-auto'
                    />
                  </div>
                  <div className='w-12 h-8 bg-white rounded border-2 shadow-md flex items-center justify-center p-1'>
                    <Image
                      src='/images/logo/mastercard.svg'
                      alt='Mastercard'
                      width={36}
                      height={18}
                      className='w-9 h-auto'
                    />
                  </div>
                </div>
                <p className='text-xs text-center text-gray-600 font-medium'>Tarjetas de Crédito</p>
              </div>

              {/* Separador */}
              <div className='border-t border-gray-100'></div>

              {/* Otros métodos */}
              <div className='grid grid-cols-2 gap-2'>
                <div className='flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='w-7 h-5 bg-white rounded flex items-center justify-center border shadow-sm'>
                    <Image
                      src='/images/icons/credit-card-svgrepo-com.svg'
                      alt='Débito'
                      width={16}
                      height={12}
                      className='w-4 h-auto'
                    />
                  </div>
                  <span className='text-xs font-medium text-blue-800'>Débito</span>
                </div>

                <div className='flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200'>
                  <div className='w-7 h-5 bg-white rounded flex items-center justify-center border shadow-sm'>
                    <Image
                      src='/images/icons/free-deposit-svgrepo-com.svg'
                      alt='Efectivo'
                      width={16}
                      height={12}
                      className='w-4 h-auto'
                    />
                  </div>
                  <span className='text-xs font-medium text-green-800'>Efectivo</span>
                </div>
              </div>

              <div className='flex items-center justify-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200'>
                <div className='w-7 h-5 bg-white rounded flex items-center justify-center border shadow-sm'>
                  <Image
                    src='/images/icons/other-bank-card-svgrepo-com.svg'
                    alt='Transferencia'
                    width={16}
                    height={12}
                    className='w-4 h-auto'
                  />
                </div>
                <span className='text-xs font-medium text-purple-800'>Transferencia Bancaria</span>
              </div>
            </div>
          </div>

          {/* Footer final ultra compacto */}
          <div className='pt-2 border-t border-gray-100 space-y-2'>
            {/* Redes sociales mejoradas */}
            <div className='flex items-center justify-center gap-3'>
              <a
                href='https://facebook.com/pinteya'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors'
                aria-label='Facebook'
              >
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
              </a>
              <a
                href='https://instagram.com/pinteya'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-colors'
                aria-label='Instagram'
              >
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
              <a
                href='https://wa.me/5493513411796'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors'
                aria-label='WhatsApp'
              >
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488' />
                </svg>
              </a>
              <a
                href='https://wa.me/5493513411796'
                target='_blank'
                rel='noopener noreferrer'
                className='w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white'
                aria-label='WhatsApp'
              >
                <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488' />
                </svg>
              </a>
            </div>

            {/* Info final en una línea */}
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 text-xs'>
                <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='text-green-600'>SSL Seguro</span>
                <span className='text-gray-400'>•</span>
                <span className='text-gray-500'>Córdoba, Argentina</span>
              </div>
              <div className='flex items-center justify-center gap-1 mt-1'>
                <span className='text-xs text-gray-500'>© {year} Pinteya • Desarrollado por</span>
                <Image
                  src='/images/logo/xor.svg'
                  alt='XOR'
                  width={24}
                  height={12}
                  className='h-3 w-auto'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Versión desktop completa */}
      <div className='hidden md:block'>
        {/* Badges de confianza superiores */}
        <div className='bg-gray-50 border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
              <div className='flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-900'>COMPRA 100% SEGURA</p>
                  <p className='text-xs text-gray-600'>Protección SSL</p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' />
                    <path d='M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z' />
                  </svg>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-900'>ENVÍO A CÓRDOBA</p>
                  <p className='text-xs text-gray-600'>Entrega rápida</p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                  <svg className='w-4 h-4 text-[#ea5a17]' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-900'>+15 AÑOS</p>
                  <p className='text-xs text-gray-600'>De experiencia</p>
                </div>
              </div>

              <div className='flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                  <svg className='w-4 h-4 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-xs font-semibold text-gray-900'>ASESORAMIENTO</p>
                  <p className='text-xs text-gray-600'>Experto gratuito</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-6'>
            {/* Logo y información de la empresa */}
            <div className='lg:col-span-1 order-1'>
              <div className='mb-4 md:mb-6'>
                <Image
                  src='/images/logo/LOGO POSITIVO.svg'
                  alt='Pinteya - Pinturería'
                  width={200}
                  height={70}
                  className='h-10 md:h-14 w-auto'
                />
              </div>

              <div className='space-y-3 md:space-y-4'>
                <div className='flex items-start gap-3'>
                  <svg
                    className='w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] mt-1 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div className='text-xs md:text-sm text-gray-600'>
                    <p className='font-medium text-gray-900'>Pinteya</p>
                    <p>Córdoba Capital, Argentina</p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <svg
                    className='w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                  </svg>
                  <a
                    href='tel:+5493513411796'
                    className='text-xs md:text-sm text-gray-600 hover:text-[#ea5a17] transition-colors py-2 -my-2 min-h-[44px] flex items-center'
                  >
                    +54 351 341 1796
                  </a>
                </div>

                <div className='flex items-center gap-3'>
                  <svg
                    className='w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                    <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                  </svg>
                  <a
                    href='mailto:info@pinteya.com.ar'
                    className='text-xs md:text-sm text-gray-600 hover:text-[#ea5a17] transition-colors py-2 -my-2 min-h-[44px] flex items-center'
                  >
                    info@pinteya.com.ar
                  </a>
                </div>
              </div>
            </div>

            {/* Enlaces útiles */}
            <div className='lg:col-span-1 order-2'>
              <h3 className='text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6'>
                Enlaces Útiles
              </h3>
              <div className='space-y-3'>
                <Link
                  href='/about'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href='/contact'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Contacto
                </Link>
                <Link
                  href='/help'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Centro de Ayuda
                </Link>
                <Link
                  href='/shipping'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Envíos y Devoluciones
                </Link>
                <Link
                  href='/privacy'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Política de Privacidad
                </Link>
                <Link
                  href='/terms'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Términos y Condiciones
                </Link>
              </div>
            </div>

            {/* Categorías */}
            <div className='lg:col-span-1 order-3'>
              <h3 className='text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6'>
                Categorías
              </h3>
              <div className='space-y-3'>
                <Link
                  href='/shop?category=pinturas'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Pinturas
                </Link>
                <Link
                  href='/shop?category=esmaltes'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Esmaltes
                </Link>
                <Link
                  href='/shop?category=barnices'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Barnices
                </Link>
                <Link
                  href='/shop?category=impermeabilizantes'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Impermeabilizantes
                </Link>
                <Link
                  href='/shop?category=accesorios'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors'
                >
                  Accesorios
                </Link>
                <Link
                  href='/shop'
                  className='block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors font-medium'
                >
                  Ver Todo
                </Link>
              </div>
            </div>

            {/* Métodos de pago y redes sociales */}
            <div className='lg:col-span-1 order-4'>
              <h3 className='text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4'>
                Métodos de Pago
              </h3>

              {/* Logo MercadoPago y métodos de pago */}
              <div className='mb-4'>
                <div className='flex flex-wrap items-center gap-3 mb-4'>
                  <Image
                    src='/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg'
                    alt='MercadoPago'
                    width={150}
                    height={50}
                    className='h-10 w-auto'
                  />
                </div>

                {/* Métodos de pago rediseñados */}
                <div className='space-y-3 mb-4'>
                  {/* Tarjetas de crédito con logos reales */}
                  <div className='flex items-center gap-3 mb-3'>
                    {/* Logo Visa real */}
                    <div className='w-16 h-10 bg-white rounded-lg border-2 shadow-md flex items-center justify-center p-1'>
                      <Image
                        src='/images/logo/visa.svg'
                        alt='Visa'
                        width={48}
                        height={24}
                        className='w-12 h-auto'
                      />
                    </div>

                    {/* Logo Mastercard real */}
                    <div className='w-16 h-10 bg-white rounded-lg border-2 shadow-md flex items-center justify-center p-1'>
                      <Image
                        src='/images/logo/mastercard.svg'
                        alt='Mastercard'
                        width={48}
                        height={24}
                        className='w-12 h-auto'
                      />
                    </div>

                    <span className='text-sm font-semibold text-gray-800'>Tarjetas de Crédito</span>
                  </div>

                  {/* Otros métodos con iconos profesionales */}
                  <div className='space-y-2'>
                    {/* Débito */}
                    <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200'>
                      <div className='w-10 h-6 bg-white rounded-md flex items-center justify-center shadow-sm border'>
                        <Image
                          src='/images/icons/credit-card-svgrepo-com.svg'
                          alt='Débito'
                          width={24}
                          height={16}
                          className='w-6 h-4'
                        />
                      </div>
                      <span className='text-sm font-medium text-blue-800'>Tarjeta de Débito</span>
                    </div>

                    {/* Efectivo */}
                    <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200'>
                      <div className='w-10 h-6 bg-white rounded-md flex items-center justify-center shadow-sm border'>
                        <Image
                          src='/images/icons/free-deposit-svgrepo-com.svg'
                          alt='Efectivo'
                          width={24}
                          height={16}
                          className='w-6 h-4'
                        />
                      </div>
                      <span className='text-sm font-medium text-green-800'>Pago en Efectivo</span>
                    </div>

                    {/* Transferencia */}
                    <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200'>
                      <div className='w-10 h-6 bg-white rounded-md flex items-center justify-center shadow-sm border'>
                        <Image
                          src='/images/icons/other-bank-card-svgrepo-com.svg'
                          alt='Transferencia'
                          width={24}
                          height={16}
                          className='w-6 h-4'
                        />
                      </div>
                      <span className='text-sm font-medium text-purple-800'>
                        Transferencia Bancaria
                      </span>
                    </div>
                  </div>
                </div>

                <p className='text-xs text-gray-500 mb-4'>
                  Aceptamos todos los medios de pago disponibles en Argentina
                </p>

                {/* Garantía */}
                <div className='flex items-center gap-2 p-2 bg-green-50 rounded-lg'>
                  <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div>
                    <p className='text-xs font-semibold text-green-800'>Garantía de Calidad</p>
                    <p className='text-xs text-green-600'>Productos originales certificados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociales como columna separada */}
            <div className='lg:col-span-1 order-5'>
              <h3 className='text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4'>
                Seguinos
              </h3>
              <div className='space-y-2'>
                <a
                  href='https://www.facebook.com/pinteya'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Facebook'
                  className='flex items-center gap-3 p-2 bg-[#1877F2] rounded-lg text-white hover:bg-[#166FE5] transition-colors'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                  </svg>
                  <span className='text-sm font-medium'>Facebook</span>
                </a>

                <a
                  href='https://www.instagram.com/pinteya'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Instagram'
                  className='flex items-center gap-3 p-2 bg-gradient-to-r from-[#E4405F] to-[#F56040] rounded-lg text-white hover:opacity-90 transition-opacity'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                  </svg>
                  <span className='text-sm font-medium'>Instagram</span>
                </a>

                <a
                  href='https://wa.me/5493513411796'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='WhatsApp'
                  className='flex items-center gap-3 p-2 bg-[#25D366] rounded-lg text-white hover:bg-[#22C55E] transition-colors'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488' />
                  </svg>
                  <span className='text-sm font-medium'>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sección inferior del footer - solo desktop */}
        <div className='bg-gray-50 border-t border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex flex-col lg:flex-row items-center justify-between gap-6'>
              {/* Copyright y créditos */}
              <div className='text-center lg:text-left'>
                <p className='text-sm text-gray-600 mb-2'>
                  © {year} Pinteya. Todos los derechos reservados.
                </p>
                <div className='flex items-center justify-center lg:justify-start gap-4 text-xs text-gray-500'>
                  <Link href='/privacy' className='hover:text-[#ea5a17] transition-colors'>
                    Política de Privacidad
                  </Link>
                  <span>•</span>
                  <Link href='/terms' className='hover:text-[#ea5a17] transition-colors'>
                    Términos y Condiciones
                  </Link>
                  <span>•</span>
                  <span>CUIT: 20-12345678-9</span>
                </div>
                <div className='flex items-center justify-center lg:justify-start gap-2 mt-2'>
                  <span className='text-xs text-gray-500'>Desarrollado por</span>
                  <Image
                    src='/images/logo/xor.svg'
                    alt='XOR'
                    width={40}
                    height={16}
                    className='h-4 w-auto'
                  />
                </div>
              </div>

              {/* Certificaciones y ubicación */}
              <div className='flex items-center gap-6'>
                {/* Ubicación */}
                <div className='flex items-center gap-2'>
                  <svg className='w-4 h-4 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div className='text-xs text-gray-600'>
                    <p className='font-medium'>Argentina</p>
                    <p>Córdoba Capital</p>
                  </div>
                </div>

                {/* Sello de seguridad */}
                <div className='flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-green-200'>
                  <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div className='text-xs'>
                    <p className='font-semibold text-green-800'>SSL</p>
                    <p className='text-green-600'>Seguro</p>
                  </div>
                </div>

                {/* Certificación AFIP */}
                <div className='flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-blue-200'>
                  <svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <div className='text-xs'>
                    <p className='font-semibold text-blue-800'>AFIP</p>
                    <p className='text-blue-600'>Registrado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
