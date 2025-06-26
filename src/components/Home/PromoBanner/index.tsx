"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const PromoBanner = () => {
  return (
    <section className="overflow-hidden py-20">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* <!-- promo banner big --> */}
        <Card className="relative z-1 overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 py-12.5 lg:py-17.5 xl:py-22.5 px-4 sm:px-7.5 lg:px-14 xl:px-19 mb-7.5 border-0 shadow-2 hover:shadow-3 transition-all duration-300">
          <div className="max-w-[550px] w-full relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="default" size="md" className="font-bold">
                SHERWIN WILLIAMS
              </Badge>
              <Badge variant="destructive" size="md" animation="pulse" className="font-bold">
                30% OFF
              </Badge>
            </div>

            <span className="block font-medium text-xl text-gray-700 mb-3">
              Sherwin Williams Loxon
            </span>

            <h2 className="font-bold text-xl lg:text-heading-4 xl:text-heading-3 text-gray-900 mb-5">
              HASTA 30% DE DESCUENTO
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Pintura elastomérica de máxima calidad para exteriores.
              Resistente a la intemperie con tecnología avanzada que protege y embellece.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              asChild
            >
              <a href="/shop">
                Comprar Ahora
              </a>
            </Button>
          </div>

          <Image
            src="/images/promo/promo-01.png"
            alt="Sherwin Williams Loxon - Pintura elastomérica"
            className="absolute bottom-0 right-4 lg:right-26 -z-1 opacity-90"
            width={274}
            height={350}
          />
        </Card>

        <div className="grid gap-7.5 grid-cols-1 lg:grid-cols-2">
          {/* <!-- promo banner small --> */}
          <Card className="relative z-1 overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10 border-0 shadow-1 hover:shadow-2 transition-all duration-300 group">
            <Image
              src="/images/promo/promo-02.png"
              alt="Rodillos y pinceles premium"
              className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-10 -z-1 group-hover:scale-105 transition-transform duration-300"
              width={241}
              height={241}
            />

            <div className="text-right relative z-10">
              <Badge variant="secondary" size="sm" className="mb-3">
                20% OFF
              </Badge>

              <span className="block text-lg text-gray-700 mb-1.5">
                Rodillos y Pinceles Premium
              </span>

              <h2 className="font-bold text-xl lg:text-heading-4 text-gray-900 mb-2.5">
                Herramientas Profesionales
              </h2>

              <p className="font-semibold text-custom-1 text-secondary mb-4">
                20% de descuento
              </p>

              <Button
                variant="secondary"
                size="md"
                className="shadow-md hover:shadow-lg transition-all duration-200"
                asChild
              >
                <a href="/shop">
                  Comprar Ya
                </a>
              </Button>
            </div>
          </Card>

          {/* <!-- promo banner small --> */}
          <Card className="relative z-1 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10 border-0 shadow-1 hover:shadow-2 transition-all duration-300 group">
            <Image
              src="/images/promo/promo-03.png"
              alt="Impermeabilizante acrílico"
              className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-8.5 -z-1 group-hover:scale-105 transition-transform duration-300"
              width={200}
              height={200}
            />

            <div className="relative z-10">
              <Badge variant="warning" size="sm" className="mb-3 font-bold">
                40% OFF
              </Badge>

              <span className="block text-lg text-gray-700 mb-1.5">
                Impermeabilizante Acrílico
              </span>

              <h2 className="font-bold text-xl lg:text-heading-4 text-gray-900 mb-2.5">
                Hasta <span className="text-warning">40%</span> de descuento
              </h2>

              <p className="max-w-[285px] text-custom-sm text-gray-600 mb-6 leading-relaxed">
                Protección superior contra filtraciones y humedad.
                Ideal para terrazas, techos y paredes exteriores.
              </p>

              <Button
                variant="warning"
                size="md"
                className="shadow-md hover:shadow-lg transition-all duration-200"
                asChild
              >
                <a href="/shop">
                  Comprar Ahora
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
