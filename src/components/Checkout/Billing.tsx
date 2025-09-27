import React from 'react'
import { CheckoutFormData } from '@/types/checkout'

interface BillingProps {
  billingData: CheckoutFormData['billing']
  errors: Record<string, string>
  onBillingChange: (data: Partial<CheckoutFormData['billing']>) => void
}

const Billing: React.FC<BillingProps> = ({ billingData, errors, onBillingChange }) => {
  const handleInputChange =
    (field: keyof CheckoutFormData['billing']) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onBillingChange({ [field]: e.target.value })
    }

  return (
    <div className='mt-9'>
      <h2 className='font-medium text-dark text-xl sm:text-2xl mb-5.5'>Datos de Facturación</h2>

      <div className='bg-white shadow-1 rounded-[10px] p-4 sm:p-8.5'>
        <div className='flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5'>
          <div className='w-full'>
            <label htmlFor='firstName' className='block mb-2.5'>
              Nombre <span className='text-red'>*</span>
            </label>

            <input
              type='text'
              name='firstName'
              id='firstName'
              placeholder='Juan'
              value={billingData.firstName}
              onChange={handleInputChange('firstName')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.firstName ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.firstName && <p className='text-red-500 text-sm mt-1'>{errors.firstName}</p>}
          </div>

          <div className='w-full'>
            <label htmlFor='lastName' className='block mb-2.5'>
              Apellido <span className='text-red'>*</span>
            </label>

            <input
              type='text'
              name='lastName'
              id='lastName'
              placeholder='Pérez'
              value={billingData.lastName}
              onChange={handleInputChange('lastName')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.lastName ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.lastName && <p className='text-red-500 text-sm mt-1'>{errors.lastName}</p>}
          </div>
        </div>

        <div className='mb-5'>
          <label htmlFor='companyName' className='block mb-2.5'>
            Empresa (Opcional)
          </label>

          <input
            type='text'
            name='companyName'
            id='companyName'
            placeholder='Nombre de la empresa'
            value={billingData.companyName}
            onChange={handleInputChange('companyName')}
            className='rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20'
          />
        </div>

        <div className='mb-5'>
          <label htmlFor='country' className='block mb-2.5'>
            País <span className='text-red'>*</span>
          </label>

          <div className='relative'>
            <select
              name='country'
              id='country'
              value={billingData.country}
              onChange={handleInputChange('country')}
              className='w-full bg-gray-1 rounded-md border border-gray-3 text-dark-4 py-3 pl-5 pr-9 duration-200 appearance-none outline-none focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20'
            >
              <option value='Argentina'>Argentina</option>
              <option value='Chile'>Chile</option>
              <option value='Uruguay'>Uruguay</option>
            </select>

            <span className='absolute right-4 top-1/2 -translate-y-1/2 text-dark-4'>
              <svg
                className='fill-current'
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M2.41469 5.03569L2.41467 5.03571L2.41749 5.03846L7.76749 10.2635L8.0015 10.492L8.23442 10.2623L13.5844 4.98735L13.5844 4.98735L13.5861 4.98569C13.6809 4.89086 13.8199 4.89087 13.9147 4.98569C14.0092 5.08024 14.0095 5.21864 13.9155 5.31345C13.9152 5.31373 13.915 5.31401 13.9147 5.31429L8.16676 10.9622L8.16676 10.9622L8.16469 10.9643C8.06838 11.0606 8.02352 11.0667 8.00039 11.0667C7.94147 11.0667 7.89042 11.0522 7.82064 10.9991L2.08526 5.36345C1.99127 5.26865 1.99154 5.13024 2.08609 5.03569C2.18092 4.94086 2.31986 4.94086 2.41469 5.03569Z'
                  fill=''
                  stroke=''
                  strokeWidth='0.666667'
                />
              </svg>
            </span>
          </div>
        </div>

        <div className='mb-5'>
          <label htmlFor='streetAddress' className='block mb-2.5'>
            Dirección <span className='text-red'>*</span>
          </label>

          <input
            type='text'
            name='streetAddress'
            id='streetAddress'
            placeholder='Calle y número'
            value={billingData.streetAddress}
            onChange={handleInputChange('streetAddress')}
            className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
              errors.streetAddress ? 'border-red-500' : 'border-gray-3'
            }`}
          />
          {errors.streetAddress && (
            <p className='text-red-500 text-sm mt-1'>{errors.streetAddress}</p>
          )}

          <div className='mt-5'>
            <input
              type='text'
              name='apartment'
              id='apartment'
              placeholder='Apartamento, piso, etc. (opcional)'
              value={billingData.apartment}
              onChange={handleInputChange('apartment')}
              className='rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20'
            />
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5'>
          <div className='w-full'>
            <label htmlFor='city' className='block mb-2.5'>
              Ciudad <span className='text-red'>*</span>
            </label>

            <input
              type='text'
              name='city'
              id='city'
              placeholder='Buenos Aires'
              value={billingData.city}
              onChange={handleInputChange('city')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.city ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.city && <p className='text-red-500 text-sm mt-1'>{errors.city}</p>}
          </div>

          <div className='w-full'>
            <label htmlFor='state' className='block mb-2.5'>
              Provincia <span className='text-red'>*</span>
            </label>

            <input
              type='text'
              name='state'
              id='state'
              placeholder='CABA'
              value={billingData.state}
              onChange={handleInputChange('state')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.state ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.state && <p className='text-red-500 text-sm mt-1'>{errors.state}</p>}
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5'>
          <div className='w-full'>
            <label htmlFor='zipCode' className='block mb-2.5'>
              Código Postal <span className='text-red'>*</span>
            </label>

            <input
              type='text'
              name='zipCode'
              id='zipCode'
              placeholder='1000'
              value={billingData.zipCode}
              onChange={handleInputChange('zipCode')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.zipCode ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.zipCode && <p className='text-red-500 text-sm mt-1'>{errors.zipCode}</p>}
          </div>

          <div className='w-full'>
            <label htmlFor='phone' className='block mb-2.5'>
              Teléfono <span className='text-red'>*</span>
            </label>

            <input
              type='tel'
              name='phone'
              id='phone'
              placeholder='+54 11 1234-5678'
              value={billingData.phone}
              onChange={handleInputChange('phone')}
              className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
                errors.phone ? 'border-red-500' : 'border-gray-3'
              }`}
            />
            {errors.phone && <p className='text-red-500 text-sm mt-1'>{errors.phone}</p>}
          </div>
        </div>

        <div className='mb-5.5'>
          <label htmlFor='email' className='block mb-2.5'>
            Email <span className='text-red'>*</span>
          </label>

          <input
            type='email'
            name='email'
            id='email'
            placeholder='juan@ejemplo.com'
            value={billingData.email}
            onChange={handleInputChange('email')}
            className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 ${
              errors.email ? 'border-red-500' : 'border-gray-3'
            }`}
          />
          {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email}</p>}
        </div>

        <div className='mb-5'>
          <label htmlFor='orderNotes' className='block mb-2.5'>
            Notas del pedido (Opcional)
          </label>

          <textarea
            name='orderNotes'
            id='orderNotes'
            rows={4}
            placeholder='Notas sobre tu pedido, por ejemplo instrucciones especiales para la entrega.'
            value={billingData.orderNotes}
            onChange={handleInputChange('orderNotes')}
            className='rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 resize-none'
          />
        </div>

        <div className='mb-5'>
          <label htmlFor='observations' className='block mb-2.5'>
            Observaciones de entrega (Opcional)
          </label>

          <textarea
            name='observations'
            id='observations'
            rows={3}
            placeholder='Ej: Barrio específico, características de la casa, horarios de entrega preferidos...'
            value={billingData.observations}
            onChange={handleInputChange('observations')}
            className='rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-tahiti-gold-500/20 resize-none'
          />
        </div>
      </div>
    </div>
  )
}

export default Billing
