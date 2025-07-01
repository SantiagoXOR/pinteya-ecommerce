"use client";

import React from "react";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Banner principal con layers de imágenes */}
      <div className="relative w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-8 lg:py-8 lg:pt-16">
          {/* Banner principal */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600 min-h-[400px] lg:min-h-[500px]">

            {/* Imagen hero mobile - solo visible en mobile */}
            <div className="absolute inset-0 z-[1] lg:hidden">
              <div className="relative w-full h-full group cursor-pointer">
                <Image
                  src="/images/hero/hero-01.png"
                  alt="Pintá rápido, fácil y cotiza al instante"
                  fill
                  className="object-contain transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:brightness-110"
                  priority
                />
              </div>
            </div>

            {/* Layers de imágenes de fondo - solo visible en desktop */}
            <div className="absolute top-0 left-52 w-full h-full z-0 hidden lg:block">
              {/* Layer 1 - Fondo base */}
              <Image
                src="/images/hero/hero-011.png"
                alt="Background layer 1"
                fill
                className="object-contain scale-200"
                priority
              />
            </div>

            <div className="absolute top-0 left-50 w-full h-full z-[1] hidden lg:block">
              {/* Layer 2 - Elementos decorativos centrados */}
              <Image
                src="/images/hero/hero-012.png"
                alt="Background layer 2"
                fill
                className="object-contain scale-145 -translate-y-30"
              />
            </div>

            <div className="absolute top-0 left-90 w-3/4 h-full z-[2] hidden lg:block">
              {/* Layer 3 - Elementos adicionales sutiles */}
              <Image
                src="/images/hero/hero-013.png"
                alt="Background layer 3"
                fill
                className="object-contain scale-140"
              />
            </div>

            {/* Contenido desktop - solo visible en desktop */}
            <div className="relative z-10 p-6 lg:p-12 hidden lg:block">
              <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center min-h-[350px] lg:min-h-[400px]">
                {/* Contenido del banner - texto a la izquierda */}
                <div className="space-y-4 lg:space-y-6 lg:pr-8">
                  {/* Título principal más grande y mejor posicionado */}
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                    Pintá rápido,
                    <br />
                    <span className="text-yellow-300">fácil y cotiza</span>
                    <br />
                    al instante!
                  </h1>
                </div>

                {/* Imagen principal posicionada a la derecha del texto */}
                <div className="relative z-[20] lg:col-span-1">
                  <div className="relative w-full max-w-md mx-auto lg:max-w-lg xl:max-w-xl lg:ml-0 lg:-translate-x-30">
                    <Image
                      src="/images/hero/hero-014.png"
                      alt="Pintá rápido, fácil y cotiza al instante"
                      width={500}
                      height={600}
                      className="w-full h-auto object-contain drop-shadow-2xl transform lg:scale-125 xl:scale-130"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Elementos decorativos sutiles - solo visible en desktop */}
            <div className="absolute top-6 right-6 w-12 h-12 bg-white/5 rounded-full blur-lg z-[5] hidden lg:block"></div>
            <div className="absolute bottom-6 left-6 w-8 h-8 bg-white/5 rounded-full blur-md z-[5] hidden lg:block"></div>
            <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-300/10 rounded-full blur-sm z-[5] hidden lg:block"></div>
          </div>
        </div>
      </div>

      {/* Sección de características con imágenes circulares */}
      <div className="bg-gray-50 py-6 lg:py-12">
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
    </section>
  );
};

export default Hero;
