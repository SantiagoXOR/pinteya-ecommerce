import React from "react";
import Image from "next/image";

const featureData = [
  {
    img: "/images/icons/icon-01.svg",
    title: "Envío Gratis",
    description: "En compras mayores a $15.000",
  },
  {
    img: "/images/icons/icon-02.svg",
    title: "Devoluciones",
    description: "Hasta 30 días para cambios",
  },
  {
    img: "/images/icons/icon-03.svg",
    title: "Pagos Seguros",
    description: "MercadoPago y transferencias",
  },
  {
    img: "/images/icons/icon-04.svg",
    title: "Asesoramiento",
    description: "Expertos en pinturería",
  },
];

const HeroFeature = () => {
  return (
    <div className="max-w-[1060px] w-full mx-auto px-4 sm:px-8 xl:px-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 mt-10">
        {featureData.map((item, key) => (
          <div className="flex items-center gap-3 min-h-[60px]" key={key}>
            <div className="flex-shrink-0">
              <Image src={item.img} alt="icons" width={40} height={40} />
            </div>

            <div className="flex-1">
              <h3 className="font-medium text-base lg:text-lg text-dark leading-tight">{item.title}</h3>
              <p className="text-xs lg:text-sm text-gray-600 leading-tight">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroFeature;
