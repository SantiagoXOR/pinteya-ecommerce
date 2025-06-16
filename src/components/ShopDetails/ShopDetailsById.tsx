"use client";
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import ShopDetails from "./index";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateproductDetails } from "@/redux/features/product-details";

interface ShopDetailsByIdProps {
  productId: string;
}

const ShopDetailsById = ({ productId }: ShopDetailsByIdProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const productData = data.data;
          
          // Transformar el producto para que sea compatible con el componente ShopDetails
          const transformedProduct: Product = {
            id: productData.id,
            title: productData.name,
            price: productData.price,
            discountedPrice: productData.discounted_price || productData.price,
            reviews: productData.reviews || 0,
            imgs: {
              thumbnails: productData.images || [productData.image_url || ''],
              previews: productData.images || [productData.image_url || '']
            },
          };
          
          setProduct(transformedProduct);
          
          // Actualizar el estado global para que ShopDetails pueda acceder al producto
          dispatch(updateproductDetails(transformedProduct));
        } else {
          throw new Error(data.error || 'Error al cargar el producto');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/shop" 
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Producto no encontrado</h2>
          <a 
            href="/shop" 
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    );
  }

  return <ShopDetails />;
};

export default ShopDetailsById;
