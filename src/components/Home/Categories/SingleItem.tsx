import { Category } from "@/types/category";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const SingleItem = ({ item }: { item: Category }) => {
  // Crear imagen placeholder si no existe
  const imageUrl = item.image_url || '/images/categories/placeholder.png';

  return (
    <Link href={`/shop-with-sidebar?category=${item.slug}`} className="group flex flex-col items-center">
      <div className="max-w-[130px] w-full bg-[#F2F3F8] h-32.5 rounded-full flex items-center justify-center mb-4">
        <Image
          src={imageUrl}
          alt={item.name}
          width={82}
          height={62}
          className="object-contain"
          onError={(e) => {
            // Fallback si la imagen no carga
            e.currentTarget.src = '/images/categories/placeholder.png';
          }}
        />
      </div>

      <div className="flex justify-center">
        <h3 className="inline-block font-medium text-center text-dark bg-gradient-to-r from-tahiti-gold-500 to-tahiti-gold-500 bg-[length:0px_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_3px] group-hover:bg-[length:100%_1px] group-hover:text-tahiti-gold-500">
          {item.name}
        </h3>
      </div>
    </Link>
  );
};

export default SingleItem;
