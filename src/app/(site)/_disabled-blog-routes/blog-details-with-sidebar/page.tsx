import React from 'react'
import BlogDetailsWithSidebar from '@/components/BlogDetailsWithSidebar'

import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Blog Details Page | NextCommerce Nextjs E-commerce template',
  description: 'This is Blog Details Page for NextCommerce Template',
  robots: {
    index: false,
    follow: false,
  },
}

const BlogDetailsWithSidebarPage = () => {
  return (
    <main>
      <BlogDetailsWithSidebar />
    </main>
  )
}

export default BlogDetailsWithSidebarPage
