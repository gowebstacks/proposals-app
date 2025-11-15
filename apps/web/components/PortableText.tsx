'use client'

import React, { useState } from 'react'
import { PortableText as PortableTextComponent, type PortableTextReactComponents } from '@portabletext/react'
import { cn } from '@/lib/utils'
import type { TypedObject, PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity'
import { ChevronLeft, ChevronRight, Check, X, AlertTriangle } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'

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

interface SanityAccordionItem {
  _key: string
  question: string
  answer: TypedObject[]
}

interface SanityAccordionNode {
  _type: 'accordion'
  title?: string
  items: SanityAccordionItem[]
}

interface SanityPricingPlan {
  _key: string
  name: string
  description?: string
  price?: {
    type?: 'single' | 'range' | 'starting_from' | 'custom'
    amount?: number
    maxAmount?: number
    customText?: string
    currency?: string
    period?: string
    customPeriod?: string
  }
  badge?: { text?: string }
  highlights?: Array<{
    text: string
    icon: 'check' | 'lightning' | 'rocket' | 'chart' | 'lock' | 'star'
  }>
}

interface SanityPricingTableNode {
  _type: 'pricingTable'
  title?: string
  subtitle?: string
  plans: SanityPricingPlan[]
  layout?: {
    columns?: number
    alignment?: 'left' | 'center' | 'right'
    spacing?: 'tight' | 'normal' | 'loose'
  }
  styling?: {
    showBorders?: boolean
    showShadows?: boolean
    roundedCorners?: boolean
    backgroundColor?: string
  }
  featuresTable?: Array<{
    feature: string
    description?: string
    planAvailability: Array<{
      planIndex: number
      included: 'included' | 'limited' | 'not_included' | 'custom'
      customText?: string
    }>
  }>
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
    <div className="col-span-8">
      {value.caption && (
        <p className="text-sm font-medium text-gray-600 text-center">
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

// Accordion Component
function AccordionComponent({ value }: { value: SanityAccordionNode }) {
  if (!value.items || value.items.length === 0) return null
  
  return (
    <div className="col-span-8">
      {value.title && (
        <h3 className="text-2xl font-medium text-black leading-tight mb-6">
          {value.title}
        </h3>
      )}
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Accordion.Root type="multiple" className="w-full">
          {value.items.map((item) => (
            <Accordion.Item
              key={item._key}
              value={item._key}
              className="border-b border-gray-200 last:border-b-0"
            >
              <Accordion.Header className="w-full">
                <Accordion.Trigger className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between group">
                  <span className="text-base font-medium text-gray-900 text-left">
                    {item.question}
                  </span>
                  <span className="shrink-0 data-[state=open]:rotate-90">
                    <ChevronRight 
                      className="w-5 h-5 text-gray-500 transition-transform duration-150"
                      aria-hidden="true"
                    />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              
              <Accordion.Content className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="text-gray-700 leading-relaxed">
                  <PortableTextComponent 
                    value={item.answer} 
                    components={{
                      block: {
                        normal: ({ children }: { children?: React.ReactNode }) => (
                          <p className="mb-4 last:mb-0">{children}</p>
                        ),
                      },
                      marks: {
                        strong: ({ children }: { children?: React.ReactNode }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        em: ({ children }: { children?: React.ReactNode }) => (
                          <em className="italic">{children}</em>
                        ),
                      },
                    }}
                  />
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </div>
  )
}

// Pricing Table Component
function PricingTableComponent({ value }: { value: SanityPricingTableNode }) {
  if (!value.plans || value.plans.length === 0) return null

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€'
      case 'GBP': return '£'
      case 'USD':
      default: return '$'
    }
  }

  const columns = value.layout?.columns || 3

  return (
    <div className="col-span-8">
      {value.title && (
        <h2 className="text-base font-medium text-gray-900 mb-2 text-center">
          {value.title}
        </h2>
      )}
      
      {value.subtitle && (
        <p className="text-base text-gray-600 mb-12 text-center max-w-2xl mx-auto">
          {value.subtitle}
        </p>
      )}

      <div className={cn(
        "grid gap-0 border border-gray-200 rounded-t-lg overflow-hidden mt-6",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {value.plans.map((plan, index) => (
          <div
            key={plan._key}
            className={cn(
              "relative p-8 bg-white",
              index > 0 && "border-l border-gray-200",
              plan.badge?.text && "bg-gray-50"
            )}
          >
            {/* Badge */}
            {plan.badge?.text && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded border border-gray-200">
                  {plan.badge.text}
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                {plan.name}
              </h3>
              
              {plan.description && (
                <p className="text-base text-gray-600 mb-6">
                  {plan.description}
                </p>
              )}

              {/* Price */}
              {plan.price && (
                <div className="mb-6">
                  {plan.price.type === 'custom' ? (
                    <div className="text-base font-medium text-gray-900">
                      {plan.price.customText}
                    </div>
                  ) : plan.price.type === 'range' ? (
                    <div>
                      <span className="text-base font-medium text-gray-900">
                        {getCurrencySymbol(plan.price.currency)}{plan.price.amount}
                      </span>
                      <span className="text-base text-gray-700 mx-1">-</span>
                      <span className="text-base font-medium text-gray-900">
                        {getCurrencySymbol(plan.price.currency)}{plan.price.maxAmount}
                      </span>
                      <span className="text-base text-gray-600 ml-1">
                        /{plan.price.period === 'custom' ? plan.price.customPeriod : plan.price.period}
                      </span>
                    </div>
                  ) : plan.price.type === 'starting_from' ? (
                    <div>
                      <span className="text-base font-medium text-gray-900">
                        {getCurrencySymbol(plan.price.currency)}{plan.price.amount}
                      </span>
                      <span className="text-base text-gray-600 ml-1">
                        /{plan.price.period === 'custom' ? plan.price.customPeriod : plan.price.period}
                      </span>
                      <div className="text-base text-gray-600 mt-1">+ additional usage</div>
                    </div>
                  ) : plan.price.amount === 0 ? (
                    <div className="text-base font-medium text-gray-900">
                      Free forever.
                    </div>
                  ) : (
                    <div>
                      <span className="text-base font-medium text-gray-900">
                        {getCurrencySymbol(plan.price.currency)}{plan.price.amount}
                      </span>
                      <span className="text-base text-gray-600 ml-1">
                        /{plan.price.period === 'custom' ? plan.price.customPeriod : plan.price.period}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Highlights */}
            {plan.highlights && plan.highlights.length > 0 && (
              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-3 text-base">
                        {highlight.icon === 'check' && '✓'}
                        {highlight.icon === 'lightning' && '⚡'}
                        {highlight.icon === 'rocket' && '🚀'}
                        {highlight.icon === 'chart' && '📊'}
                        {highlight.icon === 'lock' && '🔒'}
                        {highlight.icon === 'star' && '🌟'}
                      </span>
                      <span className="text-base text-gray-700">
                        {highlight.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Features Table */}
      {value.featuresTable && value.featuresTable.length > 0 && (
        <div className="mt-0">
          <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 text-base font-medium text-gray-900">
                    Features
                  </th>
                  {value.plans.map((plan) => (
                    <th key={plan._key} className="text-center p-4 text-base font-medium text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.featuresTable.map((featureRow, rowIndex) => (
                  <tr key={rowIndex} className={cn("border-b border-gray-100", rowIndex % 2 === 0 && "bg-white")}>
                    <td className="p-4">
                      <div>
                        <div className="text-base text-gray-900">{featureRow.feature}</div>
                        {featureRow.description && (
                          <div className="text-base text-gray-500 mt-1">{featureRow.description}</div>
                        )}
                      </div>
                    </td>
                    {value.plans.map((plan, planIndex) => {
                      const availability = featureRow.planAvailability.find(p => p.planIndex === planIndex)
                      return (
                        <td key={plan._key} className="p-4 text-center">
                          {availability ? (
                            availability.included === 'custom' ? (
                              <span className="text-base text-gray-700">{availability.customText}</span>
                            ) : availability.included === 'included' ? (
                              <Check className="w-4 h-4 text-gray-600 mx-auto" />
                            ) : availability.included === 'limited' ? (
                              <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      return <h1 id={headingId} className="text-5xl font-light text-black leading-tight tracking-tight col-start-2 col-span-6">{children}</h1>
    },
    h2: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
      console.log('🎯 Rendering h2 block:', children)
      const headingId = value?._key || `h2-${Math.random().toString(36).slice(2)}`
      return <h2 id={headingId} className="text-4xl font-light text-black leading-tight tracking-tight col-start-2 col-span-6">{children}</h2>
    },
    h3: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
      console.log('🎯 Rendering h3 block:', children)
      const headingId = value?._key || `h3-${Math.random().toString(36).slice(2)}`
      return <h3 id={headingId} className="text-2xl font-medium text-black leading-tight col-start-2 col-span-6">{children}</h3>
    },
    normal: ({ children }: { children?: React.ReactNode }) => {
      console.log('📄 Rendering normal block:', children)
      return <p className="text-lg text-gray-800 leading-relaxed font-light col-start-2 col-span-6">{children}</p>
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
      <ul className="space-y-2 text-gray-700 col-start-2 col-span-6 [&_ul]:mt-2 [&_ul]:space-y-2" style={{ listStyleType: 'none' }}>
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-2 text-gray-700 col-start-2 col-span-6">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => {
      return (
        <li className="flex items-start">
          <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-700 rounded-full mt-3 mr-2"></span>
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
    accordion: ({ value }: { value?: SanityAccordionNode }) => {
      console.log('❓ Rendering Accordion:', value)
      if (!value) return null
      return <AccordionComponent value={value} />
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
        <div className="col-span-8">
          {caption && (
            <p className="text-sm font-medium text-gray-600 text-center">
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
                                list: {
                                  bullet: ({ children }: { children?: React.ReactNode }) => (
                                    <ul className="space-y-1 text-gray-700" style={{ listStyleType: 'none' }}>
                                      {children}
                                    </ul>
                                  ),
                                  number: ({ children }: { children?: React.ReactNode }) => (
                                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                                      {children}
                                    </ol>
                                  ),
                                },
                                listItem: {
                                  bullet: ({ children }: { children?: React.ReactNode }) => {
                                    return (
                                      <li className="flex items-start">
                                        <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-700 rounded-full mt-2 mr-2"></span>
                                        <span className="flex-1 text-sm">{children}</span>
                                      </li>
                                    )
                                  },
                                  number: ({ children }: { children?: React.ReactNode }) => (
                                    <li className="text-sm">{children}</li>
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
    pricingTable: ({ value }: { value?: SanityPricingTableNode }) => {
      console.log('💰 Rendering pricing table:', value)
      if (!value) return null
      return <PricingTableComponent value={value} />
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
    <div className={cn('grid grid-cols-8 gap-6 justify-center', className)} style={{ gridTemplateColumns: 'repeat(8, minmax(10px, 1fr))' }}>
      <PortableTextComponent value={value} components={components} />
    </div>
  )
}
