import BlogDetails from '@/components/BlogDetails'
import React from 'react'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Blog Details Page | NextCommerce Nextjs E-commerce template',
  description: 'This is Blog Details Page for NextCommerce Template',
  robots: {
    index: false,
    follow: false,
  },
}

const BlogDetailsPage = () => {
  return (
    <main>
      <BlogDetails />
    </main>
  )
}

export default BlogDetailsPage
