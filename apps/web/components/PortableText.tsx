'use client'

import { PortableText as PortableTextComponent, type PortableTextReactComponents } from '@portabletext/react'
import { cn } from '@/lib/utils'
import type { TypedObject, PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PortableTextProps {
  value: TypedObject[]
  className?: string
}

// Proper interfaces for Portable Text structure
interface SanityTableHeader {
  text: string
  alignment?: 'left' | 'center' | 'right'
}

interface SanityTableCell {
  content: TypedObject[]
}

interface SanityTableRow {
  cells: SanityTableCell[]
}

interface SanityTableNode {
  _type: 'table'
  caption?: string
  headers: SanityTableHeader[]
  rows: SanityTableRow[]
}

interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
  caption?: string
}

interface SanityGallerySlide {
  _key: string
  customImage?: SanityImage
  company?: {
    _ref: string
    _type: 'reference'
  }
  showCompanyName?: boolean
}

interface SanityGalleryNode {
  _type: 'gallery'
  slides: SanityGallerySlide[]
  caption?: string
}

// Gallery Component
function GalleryComponent({ value }: { value: SanityGalleryNode }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (!value.slides || value.slides.length === 0) return null
  
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % value.slides.length)
  }
  
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + value.slides.length) % value.slides.length)
  }
  
  const currentSlideData = value.slides[currentIndex]
  if (!currentSlideData?.customImage) return null
  
  const currentImageUrl = urlForImage(currentSlideData.customImage)?.width(1200).url()
  
  return (
    <div className="my-8 col-span-8">
      {value.caption && (
        <p className="text-sm font-medium text-gray-600 mb-3 text-center">
          {value.caption}
        </p>
      )}
      
      {/* Single Image Display - 16:9 Aspect Ratio */}
      {currentImageUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
          <Image
            key={currentIndex}
            src={currentImageUrl}
            alt={currentSlideData.customImage?.alt || `Gallery image ${currentIndex + 1}`}
            fill
            className="object-cover animate-in fade-in duration-300"
            sizes="100vw"
          />
          
          {/* Navigation Overlay */}
          {value.slides.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              
              {/* Next Button */}
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              >
                <ChevronRight size={24} />
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {value.slides.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
      console.log('🎯 Rendering h1 block:', children)
      const headingId = value?._key || `h1-${Math.random().toString(36).slice(2)}`
      return <h1 id={headingId} className="text-5xl font-light text-black mb-8 leading-tight tracking-tight col-start-2 col-span-6">{children}</h1>
    },
    h2: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
      console.log('🎯 Rendering h2 block:', children)
      const headingId = value?._key || `h2-${Math.random().toString(36).slice(2)}`
      return <h2 id={headingId} className="text-4xl font-light text-black mb-6 leading-tight tracking-tight col-start-2 col-span-6">{children}</h2>
    },
    h3: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
      console.log('🎯 Rendering h3 block:', children)
      const headingId = value?._key || `h3-${Math.random().toString(36).slice(2)}`
      return <h3 id={headingId} className="text-2xl font-medium text-black mb-4 leading-tight col-start-2 col-span-6">{children}</h3>
    },
    normal: ({ children }: { children?: React.ReactNode }) => {
      console.log('📄 Rendering normal block:', children)
      return <p className="text-lg text-gray-800 leading-relaxed mb-6 font-light col-start-2 col-span-6">{children}</p>
    },
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => {
      console.log('💪 Rendering strong mark:', children)
      return <strong className="font-semibold text-black">{children}</strong>
    },
    em: ({ children }: { children?: React.ReactNode }) => {
      console.log('📝 Rendering em mark:', children)
      return <em className="italic font-medium">{children}</em>
    },
    underline: ({ children }: { children?: React.ReactNode }) => {
      console.log('📏 Rendering underline mark:', children)
      return <u className="underline decoration-2 underline-offset-2">{children}</u>
    },
    link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => {
      console.log('🔗 Rendering link mark:', { children, href: value?.href })
      return (
        <a 
          href={value?.href} 
          className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 space-y-2 text-gray-700 col-start-2 col-span-6 [&_ul]:mt-2 [&_ul]:space-y-2" style={{ listStyleType: 'none' }}>
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 col-start-2 col-span-6">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children, value }: { children?: React.ReactNode; value?: { level?: number } }) => {
      // Determine nesting level based on the value's level property or default to 1
      const level = value?.level || 1
      
      // Different dash styles for different nesting levels
      const getDashStyle = (level: number) => {
        switch (level) {
          case 1:
            return '—' // Em dash (longest)
          case 2:
            return '–' // En dash (medium)
          case 3:
            return '-' // Hyphen (shortest)
          default:
            return '·' // Bullet point for deeper nesting
        }
      }
      
      return (
        <li className="flex items-start">
          <span className="mr-3 text-gray-700 flex-shrink-0 text-lg">{getDashStyle(level)}</span>
          <span className="flex-1 text-lg">{children}</span>
        </li>
      )
    },
    number: ({ children }: { children?: React.ReactNode }) => (
      <li>{children}</li>
    ),
  },
  types: {
    gallery: ({ value }: { value?: SanityGalleryNode }) => {
      console.log('🖼️ Rendering gallery:', value)
      if (!value) return null
      return <GalleryComponent value={value} />
    },
    table: ({ value }: { value?: SanityTableNode }) => {
      console.log('📊 Rendering table:', value)
      
      if (!value) return null
      
      const { caption, headers, rows } = value
      
      const getAlignmentClass = (alignment?: 'left' | 'center' | 'right') => {
        switch (alignment) {
          case 'center':
            return 'text-center'
          case 'right':
            return 'text-right'
          default:
            return 'text-left'
        }
      }
      
      return (
        <div className="my-8 col-span-8">
          {caption && (
            <p className="text-sm font-medium text-gray-600 mb-3 text-center">
              {caption}
            </p>
          )}
          <div className="border border-gray-200 rounded-lg overflow-hidden w-full">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className={cn(
                        'px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[120px]',
                        getAlignmentClass(header.alignment)
                      )}
                    >
                      {header.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200 last:border-b-0"
                      >
                        {cell.content && cell.content.length > 0 ? (
                          <div className="text-sm">
                            <PortableTextComponent 
                              value={cell.content} 
                              components={{
                                block: {
                                  normal: ({ children }: { children?: React.ReactNode }) => (
                                    <p className="text-sm text-gray-700 leading-relaxed mb-0 font-light">{children}</p>
                                  ),
                                },
                                marks: {
                                  strong: ({ children }: { children?: React.ReactNode }) => (
                                    <strong className="font-semibold text-black">{children}</strong>
                                  ),
                                  em: ({ children }: { children?: React.ReactNode }) => (
                                    <em className="italic font-medium">{children}</em>
                                  ),
                                  underline: ({ children }: { children?: React.ReactNode }) => (
                                    <u className="underline decoration-1 underline-offset-1">{children}</u>
                                  ),
                                  link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => (
                                    <a 
                                      href={value?.href} 
                                      className="text-blue-600 hover:text-blue-700 underline decoration-1 underline-offset-1 transition-colors"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                },
                              }} 
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
  },
}

export default function PortableText({ value, className }: PortableTextProps) {
  console.log('🔍 PortableText received value:', JSON.stringify(value, null, 2))
  
  if (!value || !Array.isArray(value)) {
    console.log('❌ No content available in PortableText')
    return <p className="text-gray-600">No content available</p>
  }

  // Count different types of content for debugging
  const blocks = value.filter((item): item is PortableTextBlock => 
    item._type === 'block' && 
    (item as PortableTextBlock).style !== undefined &&
    ['normal', 'h1', 'h2', 'h3'].includes((item as PortableTextBlock).style!)
  )
  
  const tables = value.filter((item): item is SanityTableNode => 
    item._type === 'table'
  )
  
  console.log(`📊 PortableText processing ${blocks.length} blocks and ${tables.length} tables`)
  
  blocks.forEach((block, index) => {
    console.log(`Block ${index}: style=${block.style}, children=${block.children?.length}, markDefs=${block.markDefs?.length}`)
    if (block.children) {
      block.children.forEach((child, childIndex) => {
        if (child.marks && child.marks.length > 0) {
          console.log(`  Child ${childIndex}: marks=[${child.marks.join(', ')}], text="${child.text}"`)
        }
      })
    }
  })

  return (
    <div className={cn('grid grid-cols-8 gap-x-4 gap-y-0 justify-center', className)} style={{ gridTemplateColumns: 'repeat(8, minmax(10px, 1fr))' }}>
      <PortableTextComponent value={value} components={components} />
    </div>
  )
}
