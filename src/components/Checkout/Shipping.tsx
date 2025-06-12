import React from "react";
import { CheckoutFormData } from "@/types/checkout";

interface ShippingProps {
  shippingData: CheckoutFormData['shipping'];
  billingData: CheckoutFormData['billing'];
  errors: Record<string, string>;
  onShippingChange: (data: Partial<CheckoutFormData['shipping']>) => void;
}

const Shipping: React.FC<ShippingProps> = ({
  shippingData,
  billingData,
  errors,
  onShippingChange
}) => {
  const handleInputChange = (field: keyof CheckoutFormData['shipping']) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onShippingChange({ [field]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const differentAddress = e.target.checked;
    onShippingChange({
      differentAddress,
      // Si se desmarca, limpiar los datos de envío
      ...(differentAddress ? {} : {
        firstName: '',
        lastName: '',
        companyName: '',
        country: '',
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
      })
    });
  };

  return (
    <div className="bg-white shadow-1 rounded-[10px] mt-7.5">
      <div className="py-5 px-5.5">
        <label className="cursor-pointer flex items-center gap-2.5 font-medium text-lg text-dark">
          <input
            type="checkbox"
            checked={shippingData.differentAddress}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-blue bg-gray-100 border-gray-300 rounded focus:ring-blue focus:ring-2"
          />
          ¿Enviar a una dirección diferente?
        </label>
      </div>

      {shippingData.differentAddress && (
        <div className="border-t border-gray-3 p-4 sm:p-8.5">
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
            <div className="w-full">
              <label htmlFor="shippingFirstName" className="block mb-2.5">
                Nombre <span className="text-red">*</span>
              </label>

              <input
                type="text"
                name="shippingFirstName"
                id="shippingFirstName"
                placeholder="Juan"
                value={shippingData.firstName || ''}
                onChange={handleInputChange('firstName')}
                className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                  errors.shippingFirstName ? 'border-red-500' : 'border-gray-3'
                }`}
              />
              {errors.shippingFirstName && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingFirstName}</p>
              )}
            </div>

            <div className="w-full">
              <label htmlFor="shippingLastName" className="block mb-2.5">
                Apellido <span className="text-red">*</span>
              </label>

              <input
                type="text"
                name="shippingLastName"
                id="shippingLastName"
                placeholder="Pérez"
                value={shippingData.lastName || ''}
                onChange={handleInputChange('lastName')}
                className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                  errors.shippingLastName ? 'border-red-500' : 'border-gray-3'
                }`}
              />
              {errors.shippingLastName && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingLastName}</p>
              )}
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="shippingCompanyName" className="block mb-2.5">
              Empresa (Opcional)
            </label>

            <input
              type="text"
              name="shippingCompanyName"
              id="shippingCompanyName"
              placeholder="Nombre de la empresa"
              value={shippingData.companyName || ''}
              onChange={handleInputChange('companyName')}
              className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="shippingCountry" className="block mb-2.5">
              País <span className="text-red">*</span>
            </label>

            <div className="relative">
              <select
                name="shippingCountry"
                id="shippingCountry"
                value={shippingData.country || 'Argentina'}
                onChange={handleInputChange('country')}
                className="w-full bg-gray-1 rounded-md border border-gray-3 text-dark-4 py-3 pl-5 pr-9 duration-200 appearance-none outline-none focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
              >
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Uruguay">Uruguay</option>
              </select>

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-4">
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.41469 5.03569L2.41467 5.03571L2.41749 5.03846L7.76749 10.2635L8.0015 10.492L8.23442 10.2623L13.5844 4.98735L13.5844 4.98735L13.5861 4.98569C13.6809 4.89086 13.8199 4.89087 13.9147 4.98569C14.0092 5.08024 14.0095 5.21864 13.9155 5.31345C13.9152 5.31373 13.915 5.31401 13.9147 5.31429L8.16676 10.9622L8.16676 10.9622L8.16469 10.9643C8.06838 11.0606 8.02352 11.0667 8.00039 11.0667C7.94147 11.0667 7.89042 11.0522 7.82064 10.9991L2.08526 5.36345C1.99127 5.26865 1.99154 5.13024 2.08609 5.03569C2.18092 4.94086 2.31986 4.94086 2.41469 5.03569Z"
                    fill=""
                    stroke=""
                    strokeWidth="0.666667"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="shippingStreetAddress" className="block mb-2.5">
              Dirección <span className="text-red">*</span>
            </label>

            <input
              type="text"
              name="shippingStreetAddress"
              id="shippingStreetAddress"
              placeholder="Calle y número"
              value={shippingData.streetAddress || ''}
              onChange={handleInputChange('streetAddress')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                errors.shippingStreetAddress ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.shippingStreetAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.shippingStreetAddress}</p>
            )}

            <div className="mt-5">
              <input
                type="text"
                name="shippingApartment"
                id="shippingApartment"
                placeholder="Apartamento, piso, etc. (opcional)"
                value={shippingData.apartment || ''}
                onChange={handleInputChange('apartment')}
                className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
            <div className="w-full">
              <label htmlFor="shippingCity" className="block mb-2.5">
                Ciudad <span className="text-red">*</span>
              </label>

              <input
                type="text"
                name="shippingCity"
                id="shippingCity"
                placeholder="Buenos Aires"
                value={shippingData.city || ''}
                onChange={handleInputChange('city')}
                className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                  errors.shippingCity ? 'border-red-500' : 'border-gray-3'
                }`}
              />
              {errors.shippingCity && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingCity}</p>
              )}
            </div>

            <div className="w-full">
              <label htmlFor="shippingState" className="block mb-2.5">
                Provincia <span className="text-red">*</span>
              </label>

              <input
                type="text"
                name="shippingState"
                id="shippingState"
                placeholder="CABA"
                value={shippingData.state || ''}
                onChange={handleInputChange('state')}
                className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                  errors.shippingState ? 'border-red-500' : 'border-gray-3'
                }`}
              />
              {errors.shippingState && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingState}</p>
              )}
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="shippingZipCode" className="block mb-2.5">
              Código Postal <span className="text-red">*</span>
            </label>

            <input
              type="text"
              name="shippingZipCode"
              id="shippingZipCode"
              placeholder="1000"
              value={shippingData.zipCode || ''}
              onChange={handleInputChange('zipCode')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                errors.shippingZipCode ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.shippingZipCode && (
              <p className="text-red-500 text-sm mt-1">{errors.shippingZipCode}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipping;
