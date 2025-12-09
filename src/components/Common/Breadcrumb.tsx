import Link from 'next/link'
import React from 'react'
import {
  Breadcrumb as BreadcrumbComponent,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home, ChevronRight } from '@/lib/optimized-imports'

const Breadcrumb = ({ title, pages = [] }: { title: string; pages?: any[] }) => {
  return (
    <div className='overflow-hidden shadow-breadcrumb pt-[209px] sm:pt-[155px] lg:pt-[95px] xl:pt-[165px]'>
      <div className='border-t border-gray-200'>
        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 py-5 xl:py-10'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <h1 className='font-semibold text-gray-900 text-xl sm:text-2xl xl:text-3xl'>{title}</h1>

            {/* Breadcrumb migrado al Design System */}
            <BreadcrumbComponent>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href='/' className='flex items-center gap-1'>
                      <Home className='w-4 h-4' />
                      Inicio
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {pages.length > 0 &&
                  pages.map((page, key) => (
                    <React.Fragment key={key}>
                      <BreadcrumbSeparator>
                        <ChevronRight className='w-4 h-4' />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {key === pages.length - 1 ? (
                          <BreadcrumbPage className='capitalize font-medium text-primary'>
                            {page}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink className='capitalize'>{page}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
              </BreadcrumbList>
            </BreadcrumbComponent>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Breadcrumb
