"use client";

import React from "react";
import { 
  TrustBadgeGroup,
  SecurePurchaseBadge,
  MoneyBackBadge,
  FastShippingBadge,
  QualityBadge,
  SupportBadge,
  PaymentSecurityBadge,
  LocalBusinessBadge
} from "@/components/ui/trust-badges";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Award, 
  Truck, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  MapPin
} from "lucide-react";

const TrustSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "María González",
      location: "Buenos Aires",
      rating: 5,
      comment: "Excelente calidad en pinturas. El envío fue súper rápido y el producto llegó en perfectas condiciones.",
      product: "Pintura Sherwin Williams",
      verified: true,
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      location: "Córdoba",
      rating: 5,
      comment: "Muy buena atención al cliente. Me asesoraron perfectamente para elegir los productos correctos.",
      product: "Kit de Pinceles Profesionales",
      verified: true,
    },
    {
      id: 3,
      name: "Ana Martínez",
      location: "Rosario",
      rating: 5,
      comment: "Precios competitivos y productos de primera calidad. Ya es mi tienda de confianza para pinturería.",
      product: "Rodillo Premium",
      verified: true,
    },
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "15,000+",
      label: "Clientes satisfechos",
      color: "text-blue-600",
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: "98%",
      label: "Satisfacción garantizada",
      color: "text-green-600",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      value: "24-48h",
      label: "Envío rápido",
      color: "text-orange-600",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: "15 años",
      label: "En el mercado",
      color: "text-purple-600",
    },
  ];

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

        {/* Trust Badges */}
        <div className="mb-12">
          <TrustBadgeGroup
            layout="grid"
            className="grid-cols-2 md:grid-cols-4 gap-4"
            badges={["secure", "guarantee", "shipping", "support"]}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Lo que dicen nuestros clientes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Comment */}
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                  
                  {/* Product */}
                  <div className="mb-3">
                    <Badge variant="secondary" size="sm">
                      {testimonial.product}
                    </Badge>
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {testimonial.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {testimonial.location}
                      </div>
                    </div>
                    
                    {testimonial.verified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Verificado</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Trust Badges */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Comprá con total tranquilidad
          </h3>
          
          <div className="flex flex-wrap justify-center gap-4">
            <SecurePurchaseBadge size="lg" />
            <MoneyBackBadge size="lg" />
            <FastShippingBadge size="lg" />
            <QualityBadge size="lg" />
            <SupportBadge size="lg" />
            <PaymentSecurityBadge size="lg" />
            <LocalBusinessBadge size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
