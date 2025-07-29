import React from "react";
import Image from "next/image";

interface PaymentMethodProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ selectedMethod, onMethodChange }) => {
  return (
    <div className="bg-white shadow-1 rounded-[10px] mt-7.5">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Método de Pago</h3>
      </div>

      <div className="p-4 sm:p-8.5">
        <div className="flex flex-col gap-3">
          {/* MercadoPago - Método principal */}
          <label
            htmlFor="mercadopago"
            className="flex cursor-pointer select-none items-center gap-4"
          >
            <div className="relative">
              <input
                type="radio"
                name="payment"
                id="mercadopago"
                className="sr-only"
                checked={selectedMethod === "mercadopago"}
                onChange={() => onMethodChange("mercadopago")}
              />
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  selectedMethod === "mercadopago"
                    ? "border-4 border-tahiti-gold-500"
                    : "border border-gray-4"
                }`}
              ></div>
            </div>

            <div
              className={`rounded-md border-[0.5px] py-3.5 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none ${
                selectedMethod === "mercadopago"
                  ? "border-transparent bg-gray-2"
                  : " border-gray-4 shadow-1"
              }`}
            >
              <div className="flex items-center">
                <div className="pr-2.5">
                  <Image src="/images/checkout/mercadopago.svg" alt="MercadoPago" width={24} height={24} />
                </div>

                <div className="border-l border-gray-4 pl-2.5">
                  <p className="font-medium">MercadoPago</p>
                  <p className="text-sm text-gray-600">Tarjetas, efectivo, transferencias</p>
                </div>
              </div>
            </div>
          </label>

          {/* Transferencia bancaria */}
          <label
            htmlFor="bank"
            className="flex cursor-pointer select-none items-center gap-4"
          >
            <div className="relative">
              <input
                type="radio"
                name="payment"
                id="bank"
                className="sr-only"
                checked={selectedMethod === "bank"}
                onChange={() => onMethodChange("bank")}
              />
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  selectedMethod === "bank"
                    ? "border-4 border-tahiti-gold-500"
                    : "border border-gray-4"
                }`}
              ></div>
            </div>

            <div
              className={`rounded-md border-[0.5px] py-3.5 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none ${
                selectedMethod === "bank"
                  ? "border-transparent bg-gray-2"
                  : " border-gray-4 shadow-1"
              }`}
            >
              <div className="flex items-center">
                <div className="pr-2.5">
                  <Image src="/images/checkout/bank.svg" alt="bank" width={29} height={12}/>
                </div>

                <div className="border-l border-gray-4 pl-2.5">
                  <p>Transferencia bancaria</p>
                </div>
              </div>
            </div>
          </label>

          {/* Pagás cuando llega */}
          <label
            htmlFor="cash"
            className="flex cursor-pointer select-none items-center gap-4"
          >
            <div className="relative">
              <input
                type="radio"
                name="payment"
                id="cash"
                className="sr-only"
                checked={selectedMethod === "cash"}
                onChange={() => onMethodChange("cash")}
              />
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  selectedMethod === "cash"
                    ? "border-4 border-tahiti-gold-500"
                    : "border border-gray-4"
                }`}
              ></div>
            </div>

            <div
              className={`rounded-md border-[0.5px] py-3.5 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none min-w-[240px] ${
                selectedMethod === "cash"
                  ? "border-transparent bg-gray-2"
                  : " border-gray-4 shadow-1"
              }`}
            >
              <div className="flex items-center">
                <div className="pr-2.5">
                  <Image src="/images/checkout/cash.svg" alt="cash" width={21} height={21} />
                </div>

                <div className="border-l border-gray-4 pl-2.5">
                  <p>Pagás cuando llega</p>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Información adicional para MercadoPago */}
        {selectedMethod === "mercadopago" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>MercadoPago:</strong> Serás redirigido a la plataforma segura de MercadoPago
              para completar tu pago con tarjeta de crédito, débito, efectivo o transferencia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
