import React from "react";
import { CheckoutFormData } from "@/types/checkout";

interface ShippingMethodProps {
  selectedMethod: CheckoutFormData['shippingMethod'];
  totalPrice: number;
  onMethodChange: (method: CheckoutFormData['shippingMethod']) => void;
}

const ShippingMethod: React.FC<ShippingMethodProps> = ({
  selectedMethod,
  totalPrice,
  onMethodChange
}) => {
  const shippingOptions = [
    {
      id: 'free' as const,
      name: 'Envío Estándar',
      description: totalPrice > 50000 ? 'Gratis por compras mayores a $500' : 'Envío estándar - $15',
      cost: totalPrice > 50000 ? 0 : 1500,
      estimatedDays: '5-7 días hábiles',
    },
    {
      id: 'express' as const,
      name: 'Envío Express',
      description: 'Entrega rápida',
      cost: 2500,
      estimatedDays: '2-3 días hábiles',
    },
    {
      id: 'pickup' as const,
      name: 'Retiro en Sucursal',
      description: 'Retirá en nuestro local',
      cost: 0,
      estimatedDays: 'Disponible inmediatamente',
    },
  ];

  return (
    <div className="bg-white shadow-1 rounded-[10px] mt-7.5">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Método de Envío</h3>
      </div>

      <div className="p-4 sm:p-8.5">
        <div className="flex flex-col gap-4">
          {shippingOptions.map((option) => (
            <label
              key={option.id}
              htmlFor={option.id}
              className="flex cursor-pointer select-none items-center gap-3.5"
            >
              <div className="relative">
                <input
                  type="radio"
                  name="shippingMethod"
                  id={option.id}
                  className="sr-only"
                  checked={selectedMethod === option.id}
                  onChange={() => onMethodChange(option.id)}
                />
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    selectedMethod === option.id
                      ? "border-4 border-blue"
                      : "border border-gray-4"
                  }`}
                ></div>
              </div>

              <div className="flex-1 rounded-md border-[0.5px] py-3.5 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-dark">{option.name}</p>
                    <p className="text-custom-xs text-gray-600">{option.description}</p>
                    <p className="text-custom-xs text-gray-500">{option.estimatedDays}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-dark">
                      {option.cost === 0 ? 'Gratis' : `$${option.cost.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};



export default ShippingMethod;









