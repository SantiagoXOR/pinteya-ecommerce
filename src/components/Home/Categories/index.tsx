"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { useCallback, useRef, useEffect } from "react";
import { useCategoriesWithDynamicCounts } from "@/hooks/useCategoriesWithDynamicCounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";

// Import Swiper styles
import "swiper/css/navigation";
import "swiper/css";
import SingleItem from "./SingleItem";

const Categories = () => {
  const sliderRef = useRef<any>(null);

  // Hook para obtener categorías sin conteos dinámicos para evitar errores de API
  const { categories, loading, error } = useCategoriesWithDynamicCounts({
    enableDynamicCounts: false, // Deshabilitar conteos dinámicos
    baseFilters: {},
  });

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.swiper.init();
    }
  }, []);

  return (
    <section className="overflow-hidden pt-17.5">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 pb-15 border-b border-gray-3">
        <div className="swiper categories-carousel common-carousel">
          {/* <!-- section title --> */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 font-medium text-gray-700 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-primary" />
                </div>
                <span>Categorías</span>
                <Badge variant="info" size="sm">
                  {categories.length}
                </Badge>
              </div>
              <h2 className="font-semibold text-xl xl:text-heading-5 text-gray-900">
                Explorar por Categoría
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="swiper-button-prev hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="Categoría anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="swiper-button-next hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="Siguiente categoría"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            /* Loading State mejorado */
            <div className="flex gap-4 overflow-hidden">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex flex-col items-center animate-pulse min-w-[130px]">
                  <div className="w-[130px] h-[130px] bg-gray-200 rounded-full mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State mejorado */
            <Card variant="outlined" className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">
                      Error al cargar categorías
                    </h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Reintentar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : categories.length === 0 ? (
            /* Empty State */
            <Card variant="outlined" className="border-gray-200">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Tag className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      No hay categorías disponibles
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Pronto agregaremos nuevas categorías de productos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Swiper
              ref={sliderRef}
              slidesPerView={6}
              breakpoints={{
                // when window width is >= 640px
                0: {
                  slidesPerView: 2,
                },
                1000: {
                  slidesPerView: 4,
                  // spaceBetween: 4,
                },
                // when window width is >= 768px
                1200: {
                  slidesPerView: 6,
                },
              }}
            >
              {categories.map((item, key) => (
                <SwiperSlide key={key}>
                  <SingleItem item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
