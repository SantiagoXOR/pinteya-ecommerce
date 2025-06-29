"use client";
import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import ShopDetails from "./index";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateproductDetails } from "@/redux/features/product-details";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

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
              thumbnails: productData.images?.thumbnails || productData.images?.previews || [productData.image_url || '/images/products/placeholder.svg'],
              previews: productData.images?.previews || productData.images?.main ? [productData.images.main] : [productData.image_url || '/images/products/placeholder.svg']
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
        <Card className="text-center p-8 max-w-md mx-auto">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando producto</h3>
          <p className="text-gray-600">Obteniendo información del producto...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="text-center p-8 max-w-md mx-auto border-destructive/20">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" size="lg" asChild>
            <a href="/shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="text-center p-8 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h2>
          <p className="text-gray-600 mb-6">El producto que buscas no existe o ha sido eliminado.</p>
          <Button variant="primary" size="lg" asChild>
            <a href="/shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  return <ShopDetails />;
};

export default ShopDetailsById;
