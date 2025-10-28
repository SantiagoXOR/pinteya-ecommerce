import React from 'react'
import { Testimonial } from '@/types/testimonial'
import Image from 'next/image'
import { CheckCircle, MapPin } from 'lucide-react'

const SingleItem = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className='shadow-testimonial bg-white rounded-[10px] py-7.5 px-4 sm:px-8.5 m-1 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-orange-200'>
      <div className='flex items-center gap-1 mb-5'>
        <Image src='/images/icons/icon-star.svg' alt='star icon' width={15} height={15} />
        <Image src='/images/icons/icon-star.svg' alt='star icon' width={15} height={15} />
        <Image src='/images/icons/icon-star.svg' alt='star icon' width={15} height={15} />
        <Image src='/images/icons/icon-star.svg' alt='star icon' width={15} height={15} />
        <Image src='/images/icons/icon-star.svg' alt='star icon' width={15} height={15} />
      </div>

      <p className='text-dark mb-4 leading-relaxed'>{testimonial.review}</p>

      {testimonial.product && (
        <div className='text-sm text-gray-500 mb-4'>{testimonial.product}</div>
      )}

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='w-12.5 h-12.5 rounded-full overflow-hidden'>
            <Image
              src={testimonial.authorImg}
              alt='author'
              className='w-12.5 h-12.5 rounded-full overflow-hidden'
              width={50}
              height={50}
            />
          </div>

          <div>
            <h3 className='font-medium text-dark'>{testimonial.authorName}</h3>
            <div className='flex items-center gap-1 text-gray-500 text-xs'>
              <MapPin className='w-3 h-3' />
              {testimonial.authorRole}
            </div>
          </div>
        </div>

        {testimonial.verified && (
          <div className='flex items-center gap-1 text-green-600'>
            <CheckCircle className='w-4 h-4' />
            <span className='text-xs font-medium'>Verificado</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleItem

