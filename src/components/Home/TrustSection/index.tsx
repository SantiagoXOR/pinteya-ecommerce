"use client";

import React from "react";
import Image from "next/image";
import {
  Shield,
  Award,
  Truck,
  Clock,
  Users,
  Star
} from "lucide-react";

const TrustSection = () => {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tu Confianza es Nuestra Prioridad
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Miles de clientes confían en nosotros para sus proyectos de pinturería.
            Descubre por qué somos la opción preferida en Argentina.
          </p>
        </div>

        {/* Sección de características con imágenes circulares - Movida desde Hero */}
        <div className="bg-white py-6 lg:py-8 rounded-2xl shadow-sm mb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-4 gap-4 lg:gap-8">
              {/* Envíos */}
              <div className="text-center group cursor-pointer">
                <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 mb-2 lg:mb-4 rounded-full bg-gradient-to-br from-fun-green-400 to-fun-green-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:from-fun-green-500 group-hover:to-fun-green-700">
                  <Image
                    src="/images/hero/hero-enviogratis.png"
                    alt="Envíos gratis"
                    width={96}
                    height={96}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-full transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-blaze-orange-600 text-xs lg:text-base transition-colors duration-300 group-hover:text-fun-green-600">Envíos</h3>
              </div>

              {/* Asesoramiento */}
              <div className="text-center group cursor-pointer">
                <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 mb-2 lg:mb-4 rounded-full bg-gradient-to-br from-blaze-orange-400 to-blaze-orange-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:from-blaze-orange-500 group-hover:to-blaze-orange-700">
                  <Image
                    src="/images/hero/hero-experto.png"
                    alt="Asesoramiento experto"
                    width={96}
                    height={96}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-full transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-blaze-orange-600 text-xs lg:text-base transition-colors duration-300 group-hover:text-blaze-orange-700">Asesoramiento</h3>
              </div>

              {/* Pagos */}
              <div className="text-center group cursor-pointer">
                <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 mb-2 lg:mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:from-yellow-500 group-hover:to-yellow-700">
                  <Image
                    src="/images/hero/hero-pagoseguro.png"
                    alt="Pagos seguros"
                    width={96}
                    height={96}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-full transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-blaze-orange-600 text-xs lg:text-base transition-colors duration-300 group-hover:text-yellow-600">Pagos</h3>
              </div>

              {/* Cambios */}
              <div className="text-center group cursor-pointer">
                <div className="mx-auto w-16 h-16 lg:w-24 lg:h-24 mb-2 lg:mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:from-blue-500 group-hover:to-blue-700">
                  <Image
                    src="/images/hero/hero-devoluciones.png"
                    alt="Cambios y devoluciones"
                    width={96}
                    height={96}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-full transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-blaze-orange-600 text-xs lg:text-base transition-colors duration-300 group-hover:text-blue-600">Cambios</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Compra Protegida</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">30 días de garantía</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
            <Truck className="w-5 h-5" />
            <span className="text-sm font-medium">Envío en 24hs</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Soporte 24/7</span>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">15,000+</div>
            <div className="text-sm text-gray-600">Clientes satisfechos</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">98%</div>
            <div className="text-sm text-gray-600">Satisfacción garantizada</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">24-48h</div>
            <div className="text-sm text-gray-600">Envío rápido</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">15 años</div>
            <div className="text-sm text-gray-600">En el mercado</div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default TrustSection;
