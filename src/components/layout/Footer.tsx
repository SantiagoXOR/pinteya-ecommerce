"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Versión mobile compacta */}
      <div className="block md:hidden">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Logo y contacto básico */}
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/images/logo/LOGO NEGATIVO.svg"
              alt="Pinteya - Pinturería"
              width={120}
              height={42}
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-3">
              <a
                href="tel:+5493513411796"
                className="w-10 h-10 bg-[#ea5a17] rounded-full flex items-center justify-center text-white hover:bg-[#d14d0f] transition-colors"
                aria-label="Llamar"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </a>
              <a
                href="https://wa.me/5493513411796"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Enlaces rápidos compactos */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link href="/shop" className="text-xs bg-[#ea5a17] text-white px-3 py-1.5 rounded-full font-medium">
              Tienda
            </Link>
            <Link href="/contact" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              Contacto
            </Link>
            <Link href="/about" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              Nosotros
            </Link>
            <Link href="/help" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
              Ayuda
            </Link>
          </div>

          {/* Métodos de pago compacto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg"
                alt="MercadoPago"
                width={80}
                height={26}
                className="h-5 w-auto"
              />
              <span className="text-xs text-gray-500">y más</span>
            </div>
            <p className="text-xs text-gray-500">Córdoba, Argentina</p>
          </div>
        </div>
      </div>

      {/* Versión desktop completa */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12">

            {/* Logo y información de la empresa */}
            <div className="lg:col-span-1 order-1">
              <div className="mb-4 md:mb-6">
                <Image
                  src="/images/logo/LOGO NEGATIVO.svg"
                  alt="Pinteya - Pinturería"
                  width={200}
                  height={70}
                  className="h-10 md:h-14 w-auto"
                />
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] mt-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs md:text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Pinteya</p>
                    <p>Córdoba Capital, Argentina</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a
                    href="tel:+5493513411796"
                    className="text-xs md:text-sm text-gray-600 hover:text-[#ea5a17] transition-colors py-2 -my-2 min-h-[44px] flex items-center"
                  >
                    +54 351 341 1796
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-[#ea5a17] flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a
                    href="mailto:info@pinteya.com.ar"
                    className="text-xs md:text-sm text-gray-600 hover:text-[#ea5a17] transition-colors py-2 -my-2 min-h-[44px] flex items-center"
                  >
                    info@pinteya.com.ar
                  </a>
                </div>
              </div>
            </div>

            {/* Enlaces útiles */}
            <div className="lg:col-span-1 order-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Enlaces Útiles</h3>
              <div className="space-y-3">
                <Link href="/about" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Sobre Nosotros
                </Link>
                <Link href="/contact" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Contacto
                </Link>
                <Link href="/help" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Centro de Ayuda
                </Link>
                <Link href="/shipping" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Envíos y Devoluciones
                </Link>
                <Link href="/privacy" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Política de Privacidad
                </Link>
                <Link href="/terms" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Términos y Condiciones
                </Link>
              </div>
            </div>

            {/* Categorías */}
            <div className="lg:col-span-1 order-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Categorías</h3>
              <div className="space-y-3">
                <Link href="/shop?category=pinturas" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Pinturas
                </Link>
                <Link href="/shop?category=esmaltes" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Esmaltes
                </Link>
                <Link href="/shop?category=barnices" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Barnices
                </Link>
                <Link href="/shop?category=impermeabilizantes" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Impermeabilizantes
                </Link>
                <Link href="/shop?category=accesorios" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors">
                  Accesorios
                </Link>
                <Link href="/shop" className="block text-sm text-gray-600 hover:text-[#ea5a17] transition-colors font-medium">
                  Ver Todo
                </Link>
              </div>
            </div>

            {/* Métodos de pago y redes sociales */}
            <div className="lg:col-span-1 order-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Métodos de Pago</h3>

              {/* Logos de MercadoPago */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Image
                    src="/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg"
                    alt="MercadoPago"
                    width={150}
                    height={50}
                    className="h-10 w-auto"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Pagá con tarjeta de crédito, débito o efectivo
                </p>
              </div>

              {/* Redes sociales */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Seguinos</h4>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.facebook.com/pinteya"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#ea5a17] hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.instagram.com/pinteya"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#ea5a17] hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                    </svg>
                  </a>

                  <a
                    href="https://wa.me/5493513411796"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#ea5a17] hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección inferior del footer - solo desktop */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Copyright y créditos */}
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600">
                  © {year} Pinteya. Todos los derechos reservados.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="text-xs text-gray-500">Desarrollado por</span>
                  <Image
                    src="/images/logo/xor.svg"
                    alt="XOR"
                    width={40}
                    height={16}
                    className="h-4 w-auto"
                  />
                </div>
              </div>

              {/* Métodos de pago adicionales */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">Aceptamos:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs font-medium text-gray-700">
                    💳 Tarjetas
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs font-medium text-gray-700">
                    💰 Efectivo
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs font-medium text-gray-700">
                    🏦 Transferencia
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
