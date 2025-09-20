"use client";
import React, { useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import SingleGridItem from "../Shop/SingleGridItem";
import SingleListItem from "../Shop/SingleListItem";
import CustomSelect from "../ShopWithSidebar/CustomSelect";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Grid, List, Package, TrendingUp } from "lucide-react";
// import shopData from "../Shop/shopData"; // Comentado: ahora usamos datos dinámicos

const ShopWithoutSidebar = () => {
  const [productStyle, setProductStyle] = useState("grid");

  // Hook para obtener productos dinámicos
  const {
    products,
    loading,
    error,
    pagination,
    changeSorting,
    changePage,
  } = useProducts({
    initialFilters: {
      limit: 12,
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  });

  const options = [
    { label: "Productos Más Recientes", value: "0" },
    { label: "Más Vendidos", value: "1" },
    { label: "Productos Antiguos", value: "2" },
  ];

  // Manejar cambio de ordenamiento
  const handleSortChange = (value: string) => {
    switch (value) {
      case "0":
        changeSorting('created_at', 'desc');
        break;
      case "1":
        changeSorting('name', 'asc');
        break;
      case "2":
        changeSorting('created_at', 'asc');
        break;
      default:
        changeSorting('created_at', 'desc');
    }
  };

  return (
    <>
      <Breadcrumb
        title={"Productos de Pinturería"}
        pages={["tienda", "/", "productos"]}
      />
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28 bg-[#FFFEF0]">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex gap-7.5">
            {/* // <!-- Content Start --> */}
            <div className="w-full">
              <Card className="pl-3 pr-2.5 py-2.5 mb-6 border-0 shadow-1">
                <div className="flex items-center justify-between">
                  {/* <!-- top bar left --> */}
                  <div className="flex flex-wrap items-center gap-4">
                    <CustomSelect
                      options={options}
                      onChange={handleSortChange}
                    />

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <div className="flex items-center gap-1 text-gray-700">
                        <span>Mostrando</span>
                        <Badge variant="outline" size="sm">
                          {loading ? "..." : `${products.length} de ${pagination.total}`}
                        </Badge>
                        <span>Productos</span>
                      </div>
                    </div>
                  </div>

                  {/* <!-- top bar right --> */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={productStyle === "grid" ? "primary" : "outline"}
                      size="icon"
                      onClick={() => setProductStyle("grid")}
                      aria-label="Vista en grilla"
                      className="transition-all duration-200"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>

                    <Button
                      variant={productStyle === "list" ? "primary" : "outline"}
                      size="icon"
                      onClick={() => setProductStyle("list")}
                      aria-label="Vista en lista"
                      className="transition-all duration-200"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* <!-- Products Grid Tab Content Start --> */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
                  <span className="ml-3 text-gray-600">Cargando productos...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-red-500 mb-4">
                      Error: {error instanceof Error ? error.message : String(error) || 'Error desconocido'}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-600">No se encontraron productos.</p>
                </div>
              ) : (
                <div
                  className={`${
                    productStyle === "grid"
                      ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-x-7.5 md:gap-y-9"
                      : "flex flex-col gap-7.5"
                  }`}
                >
                  {products.map((item, key) =>
                    productStyle === "grid" ? (
                      <SingleGridItem item={item} key={key} />
                    ) : (
                      <SingleListItem item={item} key={key} />
                    )
                  )}
                </div>
              )}
              {/* <!-- Products Grid Tab Content End --> */}

              {/* <!-- Products Pagination Start --> */}
              <div className="flex justify-center mt-15">
                <div className="bg-white shadow-1 rounded-md p-2">
                  <ul className="flex items-center">
                    <li>
                      <button
                        id="paginationLeft"
                        aria-label="button for pagination left"
                        type="button"
                        disabled
                        className="flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px disabled:text-gray-4"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.1782 16.1156C12.0095 16.1156 11.8407 16.0594 11.7282 15.9187L5.37197 9.45C5.11885 9.19687 5.11885 8.80312 5.37197 8.55L11.7282 2.08125C11.9813 1.82812 12.3751 1.82812 12.6282 2.08125C12.8813 2.33437 12.8813 2.72812 12.6282 2.98125L6.72197 9L12.6563 15.0187C12.9095 15.2719 12.9095 15.6656 12.6563 15.9187C12.4876 16.0312 12.347 16.1156 12.1782 16.1156Z"
                            fill=""
                          />
                        </svg>
                      </button>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] bg-blue text-white hover:text-white hover:bg-blue"
                      >
                        1
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        2
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        3
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        4
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        5
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        ...
                      </a>
                    </li>

                    <li>
                      <a
                        href="#"
                        className="flex py-1.5 px-3.5 duration-200 rounded-[3px] hover:text-white hover:bg-blue"
                      >
                        10
                      </a>
                    </li>

                    <li>
                      <button
                        id="paginationLeft"
                        aria-label="button for pagination left"
                        type="button"
                        className="flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px] hover:text-white hover:bg-blue disabled:text-gray-4"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.82197 16.1156C5.65322 16.1156 5.5126 16.0594 5.37197 15.9469C5.11885 15.6937 5.11885 15.3 5.37197 15.0469L11.2782 9L5.37197 2.98125C5.11885 2.72812 5.11885 2.33437 5.37197 2.08125C5.6251 1.82812 6.01885 1.82812 6.27197 2.08125L12.6282 8.55C12.8813 8.80312 12.8813 9.19687 12.6282 9.45L6.27197 15.9187C6.15947 16.0312 5.99072 16.1156 5.82197 16.1156Z"
                            fill=""
                          />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              {/* <!-- Products Pagination End --> */}
            </div>
            {/* // <!-- Content End --> */}
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopWithoutSidebar;









