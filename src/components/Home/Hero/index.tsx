"use client";

import React from "react";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Truck, CheckCircle } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600 overflow-hidden">
      {/* Fondo con formas decorativas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Header con logo y búsqueda */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-blaze-orange-500 rounded"></div>
            </div>
            <span className="text-white font-bold text-xl">PinteYA!</span>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <ShoppingCart className="w-6 h-6" />
          </Button>
        </div>

        {/* Contenido principal del hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Lado izquierdo - Texto y CTA */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                Pintar ahora
                <br />
                es así de{" "}
                <span className="text-yellow-300">fácil.</span>
              </h1>

              <p className="text-xl text-white/90 leading-relaxed">
                Descubrí la mejor selección de pinturas, herramientas y accesorios
                para todos tus proyectos. Calidad profesional al mejor precio.
              </p>
            </div>

            {/* Badges de beneficios */}
            <div className="flex flex-wrap gap-4">
              <Badge className="bg-fun-green-500 text-white px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Llega gratis mañana
              </Badge>
              <Badge className="bg-fun-green-600 text-white px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ENVÍO GRATIS
              </Badge>
              <span className="text-white/80 text-sm">en Córdoba Capital.</span>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-blaze-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-2xl text-lg"
              >
                Ver Catálogo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blaze-orange-600 font-semibold px-8 py-4 rounded-2xl text-lg"
              >
                Ofertas del Día
              </Button>
            </div>
          </div>

          {/* Lado derecho - Imagen de pareja */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-3xl p-8 overflow-hidden">
              {/* Imagen de la pareja */}
              <div className="relative z-10">
                <Image
                  src="/images/hero/hero-04.jpg"
                  alt="Pareja eligiendo colores de pintura"
                  width={500}
                  height={400}
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>

              {/* Elementos decorativos */}
              <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Cards de ofertas en la parte inferior */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          {/* Oferta 1 */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">%</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">25% OFF</span>
                  </div>
                  <p className="text-gray-600 font-medium">en Loxon</p>
                </div>
                <div className="text-right">
                  <Image
                    src="/images/products/product-1-bg-1.png"
                    alt="Loxon"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Oferta 2 */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">Envío gratis</span>
                  </div>
                  <p className="text-gray-600 font-medium">HOY</p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de ofertas */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Ofertas</h2>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              Ver todas →
            </Button>
          </div>

          {/* Dirección */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">📍</span>
                </div>
                <span className="text-gray-700 font-medium">Yapeyú 1201, Córdoba</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* <!-- Hero features --> */}
      <HeroFeature />
    </section>
  );
};

export default Hero;
