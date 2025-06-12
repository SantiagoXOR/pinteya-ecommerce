"use client";

import React, { useState, useEffect } from "react";
import SingleItem from "./SingleItem";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";

const BestSeller = () => {
  const { products, loading, error } = useProducts({
    initialFilters: {
      limit: 6,
      page: 1,
      sortBy: 'price',
      sortOrder: 'desc'
    },
    autoFetch: true
  });

  // Filtrar productos con descuento para mostrar como "best sellers"
  const bestSellerProducts = products.filter(product =>
    product.discountedPrice && product.discountedPrice < product.price
  ).slice(0, 6);

  if (loading) {
    return (
      <section className="overflow-hidden">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
                <Image
                  src="/images/icons/icon-07.svg"
                  alt="icon"
                  width={17}
                  height={17}
                />
                Este Mes
              </span>
              <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
                Más Vendidos
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-[403px]"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="overflow-hidden">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="text-center py-12">
            <p className="text-red-500">Error cargando productos: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* <!-- section title --> */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <Image
                src="/images/icons/icon-07.svg"
                alt="icon"
                width={17}
                height={17}
              />
              Este Mes
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Más Vendidos
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
          {/* <!-- Best Sellers item --> */}
          {bestSellerProducts.length > 0 ? (
            bestSellerProducts.map((item, key) => (
              <SingleItem item={item} key={key} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No hay productos en oferta disponibles</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12.5">
          <Link
            href="/shop"
            className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-tahiti-gold-600 hover:text-white hover:border-transparent"
          >
            Ver Todos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
