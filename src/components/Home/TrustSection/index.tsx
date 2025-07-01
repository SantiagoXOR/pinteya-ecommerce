"use client";

import React from "react";
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
    <section className="py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tu Confianza es Nuestra Prioridad
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Miles de clientes confían en nosotros para sus proyectos de pinturería.
            Descubre por qué somos la opción preferida en Argentina.
          </p>
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
