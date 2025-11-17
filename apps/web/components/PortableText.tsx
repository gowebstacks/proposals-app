'use client'

import React, { useState } from 'react'
import { PortableText as PortableTextComponent, type PortableTextReactComponents } from '@portabletext/react'
import { cn } from '@/lib/utils'
import type { TypedObject, PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity'
import { ChevronLeft, ChevronRight, ChevronDown, Check, AlertCircle } from '@geist-ui/icons'
import * as Accordion from '@radix-ui/react-accordion'
import MuxPlayer from '@mux/mux-player-react'

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

interface SanityPricingOption {
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
  options: SanityPricingOption[]
}

interface SanityScopeTableNode {
  _type: 'scopeTable'
  options: string[]
  scopeGroups?: Array<{
    groupName: string
    items: Array<{
      item: string
      description?: string
      tooltip?: string
      optionAvailability: Array<{
        optionIndex: number
        included: 'included' | 'limited' | 'not_included' | 'custom'
        customText?: string
      }>
    }>
  }>
  scopeItems?: Array<{
    group?: string
    item: string
    description?: string
    tooltip?: string
    optionAvailability: Array<{
      optionIndex: number
      included: 'included' | 'limited' | 'not_included' | 'custom'
      customText?: string
    }>
  }>
}

interface SanityTestimonialCardNode {
  _type: 'testimonialCard'
  testimonial: {
    title?: string
    content: TypedObject[]
    person: {
      firstName?: string
      lastName?: string
      role?: string
      headshot?: SanityImage
      company?: {
        name?: string
      }
    }
  }
}

interface SanityCalloutNode {
  _type: 'callout'
  title?: string
  content: TypedObject[]
  theme?: 'info' | 'success' | 'warning' | 'error'
}

interface SanityVideoModuleNode {
  _type: 'videoModule'
  video: {
    muxVideoId: string
    title?: string
    thumbnail?: SanityImage
  }
  caption?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

interface SanityReelCarouselNode {
  _type: 'reelCarousel'
  title?: string
  videos: Array<{
    muxVideoId: string
    title?: string
    thumbnail?: SanityImage
  }>
}

// Legacy interface for backward compatibility
interface LegacyPricingTableNode {
  _type: 'pricingTable'
  plans: SanityPricingOption[]
}

type PricingTableNode = SanityPricingTableNode | LegacyPricingTableNode

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
function PricingTableComponent({ value }: { value: PricingTableNode }) {
  // Handle both old 'plans' and new 'options' field names for backward compatibility
  const options = 'options' in value ? value.options : value.plans
  if (!options || options.length === 0) return null

  
  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€'
      case 'GBP': return '£'
      case 'USD':
      default: return '$'
    }
  }

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return ''
    
    const symbol = getCurrencySymbol(currency)
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    
    return `${symbol}${formatted}`
  }

  return (
    <div className="col-span-8">
      <div className="grid gap-0 border border-gray-200 rounded-lg mt-6 grid-cols-1 md:grid-cols-3">
        {options.map((option: SanityPricingOption, index: number) => (
          <div
            key={option._key}
            className={cn(
              "relative p-7",
              index > 0 && "border-l border-gray-200",
              index === 0 && "rounded-l-lg",
              index === options.length - 1 && "rounded-r-lg",
              index === 1 ? "bg-white" : "bg-gray-50"
            )}
          >
            {/* Badge */}
            {option.badge?.text && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <span className="px-2 py-1 text-xs font-medium text-white bg-black rounded">
                  {option.badge.text}
                </span>
              </div>
            )}

            {/* Option Header */}
            <div className="mb-8">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                {option.name}
              </h3>
              
              {option.description && (
                <p className="text-base text-gray-600 mb-6">
                  {option.description}
                </p>
              )}

              {/* Price */}
              {option.price && (
                <div className="mb-6">
                  {option.price.type === 'custom' ? (
                    <div className="text-base font-medium text-gray-900">
                      {option.price.customText}
                    </div>
                  ) : option.price.type === 'range' ? (
                    <div>
                      <span className="text-base font-medium text-gray-900">
                        {formatCurrency(option.price.amount, option.price.currency)}
                      </span>
                      <span className="text-base text-gray-700 mx-1">-</span>
                      <span className="text-base font-medium text-gray-900">
                        {formatCurrency(option.price.maxAmount, option.price.currency)}
                      </span>
                      {option.price.period !== 'once' && (
                        <span className="text-base text-gray-600 ml-1">
                          /{option.price.period === 'custom' ? option.price.customPeriod : option.price.period}
                        </span>
                      )}
                    </div>
                  ) : option.price.type === 'starting_from' ? (
                    <div>
                      <span className="text-base text-gray-600">Starting from </span>
                      <span className="text-base font-medium text-gray-900">
                        {formatCurrency(option.price.amount, option.price.currency)}
                      </span>
                      {option.price.period !== 'once' && (
                        <span className="text-base text-gray-600 ml-1">
                          /{option.price.period === 'custom' ? option.price.customPeriod : option.price.period}
                        </span>
                      )}
                    </div>
                  ) : option.price.amount === 0 ? (
                    <div className="text-base font-medium text-gray-900">
                      Free forever.
                    </div>
                  ) : (
                    <div>
                      <span className="text-base font-medium text-gray-900">
                        {formatCurrency(option.price.amount, option.price.currency)}
                      </span>
                      {option.price.period !== 'once' && (
                        <span className="text-base text-gray-600 ml-1">
                          /{option.price.period === 'custom' ? option.price.customPeriod : option.price.period}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Highlights */}
            {option.highlights && option.highlights.length > 0 && (
              <div>
                <ul className="space-y-3">
                  {option.highlights.map((highlight: { text: string; icon?: string }, index: number) => (
                    <li key={index} className="flex items-center">
                      {highlight.icon && (
                        <span className="mr-3">
                          <Check className="w-4 h-4 text-gray-600" />
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
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

    </div>
  )
}

// Scope Table Component
function ScopeTableComponent({ value }: { value: SanityScopeTableNode }) {
  console.log('🔍 ScopeTableComponent received value:', JSON.stringify(value, null, 2))

  // Handle both old and new schema structures for backward compatibility
  if (value.scopeItems && (!value.scopeGroups || value.scopeGroups.length === 0)) {
    // Old schema structure - convert to new grouped format
    const groupedItems = value.scopeItems.reduce(
      (acc: Record<string, typeof value.scopeItems>, item) => {
        if (!item) return acc // Skip undefined items
        const group = item.group || 'Ungrouped'
        if (!acc[group]) acc[group] = []

        const convertedItem = {
          item: item.item || 'Unnamed Item',
          description: item.description,
          tooltip: item.tooltip,
          optionAvailability: item.optionAvailability || [],
        }

        acc[group]!.push(convertedItem as {
          item: string
          description?: string
          tooltip?: string
          optionAvailability: Array<{
            optionIndex: number
            included: 'included' | 'limited' | 'not_included' | 'custom'
            customText?: string
          }>
        })
        return acc
      },
      {} as Record<string, typeof value.scopeItems>
    )

    const convertedGroups = Object.entries(groupedItems).map(([groupName, items]) => ({
      groupName,
      items,
    }))

    return <ScopeTableComponentGroups value={{ ...value, scopeGroups: convertedGroups }} />
  }

  if (!value.scopeGroups || value.scopeGroups.length === 0) return null

  return <ScopeTableComponentGroups value={value} />
}

// Testimonial Card Component
function TestimonialCardComponent({ value }: { value: SanityTestimonialCardNode }) {
  if (!value.testimonial) return null

  const { testimonial } = value
  const person = testimonial.person
  const personName = [person?.firstName, person?.lastName].filter(Boolean).join(' ')
  const companyName = person?.company?.name

  return (
    <div className="col-start-2 col-span-6 py-6">
      <div className="rounded-lg flex flex-col gap-6">
        {/* Quote Content */}
        <div className="relative">
          <span className="absolute -left-4 top-0 text-[32px] leading-[36px] text-gray-900 font-serif">&ldquo;</span>
          <div className="text-2xl text-gray-900 leading-relaxed font-light inline pl-1">
            <PortableTextComponent 
              value={testimonial.content} 
              components={{
                block: {
                  normal: ({ children }) => <span>{children}</span>,
                },
              }}
            />
            <span className="text-[32px] leading-[36px] text-gray-900 font-serif ml-1">&rdquo;</span>
          </div>
        </div>

        {/* Person Info */}
        <div className="flex items-center gap-3 justify-end">
          {person?.headshot && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <Image
                src={urlForImage(person.headshot)?.width(64).height(64).url() || ''}
                alt={personName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <div className="text-base font-medium text-gray-900">
              {personName}
              {companyName && (
                <span className="text-gray-500 font-normal">, {companyName}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Callout Component
function CalloutComponent({ value }: { value: SanityCalloutNode }) {
  const theme = value.theme || 'info'
  
  const themeStyles = {
    info: {
      border: 'border-blue-600',
      badge: 'bg-blue-600',
    },
    success: {
      border: 'border-green-600',
      badge: 'bg-green-600',
    },
    warning: {
      border: 'border-yellow-600',
      badge: 'bg-yellow-600',
    },
    error: {
      border: 'border-red-600',
      badge: 'bg-red-600',
    },
  }
  
  const styles = themeStyles[theme]
  
  return (
    <div className="col-start-2 col-span-6">
      <div className={cn('rounded-lg border pl-4 pt-6 pb-4 pr-6 relative', styles.border)}>
        {/* Badge */}
        {value.title && (
          <div className="absolute -top-3 left-4 z-20">
            <span className={cn('px-2 py-1 text-xs font-medium text-white rounded', styles.badge)}>
              {value.title}
            </span>
          </div>
        )}
        
        {/* Content */}
        <div className="text-base text-gray-800 leading-relaxed font-light">
          <PortableTextComponent 
            value={value.content}
            components={{
              block: {
                normal: ({ children }) => <p className="text-base text-gray-800 font-light">{children}</p>,
              },
              marks: {
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                link: ({ children, value: linkValue }: { children?: React.ReactNode; value?: { href?: string } }) => (
                  <a 
                    href={linkValue?.href} 
                    className="text-blue-600 hover:text-blue-700 underline"
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
      </div>
    </div>
  )
}

// Video Module Component
function VideoModuleComponent({ value }: { value: SanityVideoModuleNode }) {
  console.log('🎥 VideoModuleComponent received:', JSON.stringify(value, null, 2))
  
  if (!value.video?.muxVideoId) {
    console.log('❌ No muxVideoId found. Video object:', value.video)
    return null
  }

  const { video, caption, autoplay, loop, muted } = value
  const playbackId = String(video.muxVideoId).trim()
  
  console.log('✅ Rendering video with ID:', playbackId)

  return (
    <div className="col-span-8 py-6">
      <div className="rounded-lg overflow-hidden">
        <MuxPlayer
          playbackId={playbackId}
          metadata={{
            video_title: video.title || 'Video',
          }}
          streamType="on-demand"
          autoPlay={autoplay ? 'muted' : false}
          loop={loop}
          muted={muted}
          style={{
            aspectRatio: '16/9',
            width: '100%',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
          placeholder={video.thumbnail ? urlForImage(video.thumbnail)?.url() : undefined}
          onError={(error) => {
            console.error('❌ MuxPlayer error:', error)
          }}
        />
      </div>
      {caption && (
        <p className="text-sm text-gray-600 mt-3 text-center font-light">
          {caption}
        </p>
      )}
    </div>
  )
}

// Reel Carousel Component
function ReelCarouselComponent({ value }: { value: SanityReelCarouselNode }) {
  const videoCount = value.videos?.length || 0
  const [activeIndex, setActiveIndex] = React.useState(videoCount) // Start at first "real" video in middle set
  const [isTransitioning, setIsTransitioning] = React.useState(true)
  
  // Handle infinite loop wrap-around
  React.useEffect(() => {
    if (!videoCount) return
    
    if (activeIndex >= videoCount * 2) {
      // Reached end of second set, jump back to first set
      setTimeout(() => {
        setIsTransitioning(false)
        setActiveIndex(activeIndex - videoCount)
      }, 500) // Wait for transition to complete
    } else if (activeIndex < videoCount) {
      // Reached start of first set, jump forward to second set
      setTimeout(() => {
        setIsTransitioning(false)
        setActiveIndex(activeIndex + videoCount)
      }, 500)
    }
  }, [activeIndex, videoCount])

  // Re-enable transitions after jump
  React.useEffect(() => {
    if (!isTransitioning) {
      setTimeout(() => setIsTransitioning(true), 50)
    }
  }, [isTransitioning])

  if (!value.videos || value.videos.length === 0) return null

  // Create infinite array: [...videos, ...videos, ...videos]
  const infiniteVideos = [...value.videos, ...value.videos, ...value.videos]

  return (
    <div className="col-span-8 py-6">
      {value.title && (
        <h3 className="text-xl font-medium text-gray-900 mb-6">
          {value.title}
        </h3>
      )}
      <div className="relative h-[650px] flex items-center justify-center overflow-hidden">
        {/* Horizontal carousel container */}
        <div 
          className="flex items-center gap-4"
          style={{
            transform: `translateX(calc(50% - 170px - ${activeIndex * (340 + 16)}px))`,
            transition: isTransitioning ? 'transform 500ms ease-out' : 'none',
          }}
        >
          {infiniteVideos.map((video, index) => {
            if (!video?.muxVideoId) return null
            
            const playbackId = String(video.muxVideoId).trim()
            const isActive = index === activeIndex
            
            // Calculate position relative to active
            const offset = index - activeIndex
            
            const getScale = () => {
              if (offset === 0) return 1
              return 0.85
            }
            
            const getZIndex = () => {
              if (offset === 0) return 20
              return 10
            }
            
            return (
              <div
                key={index}
                className="flex-shrink-0 transition-all duration-500 ease-out cursor-pointer"
                style={{
                  transform: `scale(${getScale()})`,
                  zIndex: getZIndex(),
                }}
                onClick={() => setActiveIndex(index)}
              >
                <div className="w-[340px] h-[600px] rounded-3xl overflow-hidden">
                  <MuxPlayer
                    playbackId={playbackId}
                    metadata={{
                      video_title: video.title || `Reel ${index + 1}`,
                    }}
                    streamType="on-demand"
                    muted={!isActive}
                    autoPlay={isActive ? 'muted' : false}
                    style={{
                      aspectRatio: '9/16',
                      width: '100%',
                      height: '100%',
                      borderRadius: '1.5rem',
                      overflow: 'hidden',
                    }}
                    placeholder={video.thumbnail ? urlForImage(video.thumbnail)?.url() : undefined}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Custom InformationFillSmall component
function InformationFillSmall({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path 
        d="M12 16V12M12 8H12.01" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Scope Table Groups Component (for new schema structure)
function ScopeTableComponentGroups({ value }: { value: SanityScopeTableNode }) {
  const [openItems, setOpenItems] = useState<string[]>(
    value.scopeGroups?.[0]?.groupName ? [value.scopeGroups[0].groupName] : []
  )

  if (!value.scopeGroups || value.scopeGroups.length === 0) return null

  return (
    <div className="col-span-8">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-white border-b border-gray-200">
          <div
            className="grid"
            style={{ gridTemplateColumns: `1.25fr repeat(${value.options.length}, 1fr)` }}
          >
            <div className="text-left p-4 text-base font-medium text-gray-900 border-r border-gray-200">
              Scope
            </div>
            {value.options.map((optionName: string, optionIndex: number) => (
              <div
                key={optionIndex}
                className={cn(
                  'text-center p-4 text-base font-medium text-gray-900',
                  optionIndex < value.options.length - 1 && 'border-r border-gray-200'
                )}
              >
                {optionName}
              </div>
            ))}
          </div>
        </div>

        {/* Accordion groups */}
        <Accordion.Root
          type="multiple"
          className="w-full"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {value.scopeGroups.map((group) => {
            return (
              <Accordion.Item
                key={group.groupName}
                value={group.groupName}
                className="border-b border-gray-100"
              >
                <Accordion.Header className="w-full">
                  <Accordion.Trigger className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer w-full p-3 text-sm font-medium text-gray-700 border-b border-gray-200 text-left flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      {group.groupName}
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content 
                  className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
                  style={{
                    // @ts-expect-error - Custom CSS variable for overflow handling
                    '--accordion-overflow': 'hidden',
                  }}
                  onAnimationEnd={(e) => {
                    const target = e.currentTarget;
                    if (target.getAttribute('data-state') === 'open') {
                      target.style.overflow = 'visible';
                    }
                  }}
                  onAnimationStart={(e) => {
                    const target = e.currentTarget;
                    target.style.overflow = 'hidden';
                  }}
                >
                    <div className="divide-y divide-gray-100">
                      {group.items?.map((scopeItem, itemIndex) => (
                        <div
                          key={`${group.groupName}-${itemIndex}`}
                          className="grid"
                          style={{ gridTemplateColumns: `1.25fr repeat(${value.options.length}, 1fr)` }}
                        >
                          {/* Scope item cell */}
                          <div className="p-4 border-r border-gray-200">
                            <div className="">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="[font-size:14px] text-gray-900">{scopeItem.item}</div>
                                  {scopeItem.tooltip && (
                                    <div className="group relative">
                                      <InformationFillSmall className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-80 shadow-lg">
                                          {scopeItem.tooltip}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                            <div className="border-4 border-transparent border-t-gray-900"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {scopeItem.description && (
                                  <div className="text-base text-gray-500 mt-1">
                                    {scopeItem.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Option availability cells */}
                          {value.options.map((optionName: string, optionIndex: number) => {
                            const availability = scopeItem.optionAvailability?.find(
                              (o: { optionIndex: number }) => o.optionIndex === optionIndex
                            )

                            return (
                              <div
                                key={optionIndex}
                                className={cn(
                                  'p-4 text-center flex items-center justify-center',
                                  optionIndex < value.options.length - 1 && 'border-r border-gray-200'
                                )}
                              >
                                {availability ? (
                                  availability.included === 'custom' ? (
                                    <span className="[font-size:14px] text-gray-700">
                                      {availability.customText}
                                    </span>
                                  ) : availability.included === 'included' ? (
                                    <Check className="w-4 h-4 text-gray-600 mx-auto" />
                                  ) : availability.included === 'limited' ? (
                                    <AlertCircle className="w-4 h-4 text-orange-500 mx-auto" />
                                  ) : (
                                    <span className="text-base text-gray-400">—</span>
                                  )
                                ) : (
                                  <span className="text-base text-gray-400">—</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                </Accordion.Content>
              </Accordion.Item>
            )
          })}
        </Accordion.Root>
      </div>
    </div>
  )
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children, value }: { children?: React.ReactNode; value?: PortableTextBlock }) => {
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
    pricingTable: ({ value }: { value?: PricingTableNode }) => {
      console.log('💰 Rendering pricing table:', value)
      if (!value) return null
      return <PricingTableComponent value={value} />
    },
    scopeTable: ({ value }: { value?: SanityScopeTableNode }) => {
      console.log('📊 Rendering scope table:', value)
      if (!value) return null
      return <ScopeTableComponent value={value} />
    },
    testimonialCard: ({ value }: { value?: SanityTestimonialCardNode }) => {
      console.log('💬 Rendering testimonial card:', value)
      if (!value) return null
      return <TestimonialCardComponent value={value} />
    },
    callout: ({ value }: { value?: SanityCalloutNode }) => {
      console.log('📢 Rendering callout:', value)
      if (!value) return null
      return <CalloutComponent value={value} />
    },
    videoModule: ({ value }: { value?: SanityVideoModuleNode }) => {
      console.log('🎥 Rendering video module:', value)
      if (!value) return null
      return <VideoModuleComponent value={value} />
    },
    reelCarousel: ({ value }: { value?: SanityReelCarouselNode }) => {
      console.log('🎬 Rendering reel carousel:', value)
      if (!value) return null
      return <ReelCarouselComponent value={value} />
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
