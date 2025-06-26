import { Category } from "@/types/category";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SingleItem = ({ item }: { item: Category }) => {
  // Crear imagen placeholder si no existe
  const imageUrl = item.image_url || '/images/categories/placeholder.png';

  return (
    <Link href={`/shop-with-sidebar?category=${item.slug}`} className="group block">
      <Card
        className="flex flex-col items-center p-4 border-0 bg-gray-50 hover:bg-white transition-all duration-300 group-hover:shadow-2 group-hover:-translate-y-1"
        hover="none"
      >
        <div className="relative max-w-[130px] w-full h-32.5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 overflow-hidden group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300">
          <Image
            src={imageUrl}
            alt={item.name}
            width={82}
            height={62}
            className="object-contain group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              // Fallback si la imagen no carga
              e.currentTarget.src = '/images/categories/placeholder.png';
            }}
          />

          {/* Badge decorativo */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="default" size="sm" className="text-2xs px-1.5 py-0.5">
              Ver
            </Badge>
          </div>
        </div>

        <div className="flex justify-center">
          <h3 className="font-medium text-center text-gray-900 group-hover:text-primary transition-colors duration-300 relative">
            {item.name}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </h3>
        </div>
      </Card>
    </Link>
  );
};

export default SingleItem;
