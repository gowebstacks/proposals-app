'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import PortableText from '@/components/PortableText'
import type { TypedObject } from '@portabletext/types'
import { urlForImage } from '@/lib/sanity'

interface Tab {
  title?: string
  content?: TypedObject[]
  [key: string]: unknown
}

interface PortableTextBlock {
  _type: 'block'
  style: 'normal' | 'h1' | 'h2' | 'h3'
  children: Array<{
    _type: 'span'
    text: string
    _key?: string
    marks?: string[]
  }>
  _key?: string
  markDefs?: Array<{ _key: string; _type: string }>
}

interface Company {
  _id: string
  name: string
  logoOnLight?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logoOnDark?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logomarkOnLight?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logomarkOnDark?: {
    asset: {
      _ref: string
      url?: string
    }
  }
}

interface Person {
  _id: string
  firstName: string
  lastName: string
  role?: string
  headshot?: {
    asset: {
      _ref: string
      url?: string
    }
  }
}

interface ProposalContentProps {
  tabs: Tab[]
  proposalSlug: string
  activeTabIndex: number
  company?: Company
  googleDocUrl?: string
  preparedBy?: Person
}

export default function ProposalContent({
  tabs,
  proposalSlug,
  activeTabIndex,
  company,
  googleDocUrl,
  preparedBy
}: ProposalContentProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 })
  const router = useRouter()

  // Generate tab slug from title
  const generateTabSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // Navigate to tab
  const navigateToTab = (tabIndex: number) => {
    const tab = tabs[tabIndex]
    if (tab?.title) {
      const tabSlug = generateTabSlug(tab.title)
      router.push(`/${proposalSlug}/${tabSlug}`)
    } else if (tabIndex === 0) {
      // Fallback for first tab without title
      router.push(`/${proposalSlug}`)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track active heading on scroll
  useEffect(() => {
    const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id]')
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0
      }
    )

    headingElements.forEach((element) => observer.observe(element))

    return () => {
      headingElements.forEach((element) => observer.unobserve(element))
    }
  }, [activeTabIndex])

  // Update indicator position when active heading changes
  useEffect(() => {
    if (activeHeadingId) {
      const activeButton = document.querySelector(`button[data-heading-id="${activeHeadingId}"]`)
      if (activeButton) {
        const container = activeButton.closest('.pl-4')
        if (container) {
          const containerRect = container.getBoundingClientRect()
          const buttonRect = activeButton.getBoundingClientRect()
          const top = buttonRect.top - containerRect.top
          const height = buttonRect.height
          setIndicatorStyle({ top, height })
        }
      }
    }
  }, [activeHeadingId])

  // Scroll to heading function
  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  // Extract headings from tab content for outline
  const extractHeadings = (content: TypedObject[]) => {
    if (!content) return []
    
    return content
      .filter((block: TypedObject): block is PortableTextBlock => 
        block._type === 'block' && 
        ['h1', 'h2', 'h3'].includes((block as PortableTextBlock).style)
      )
      .map((block: PortableTextBlock) => ({
        id: block._key || Math.random().toString(36).slice(2),
        level: block.style,
        text: block.children?.map((child) => child.text || '').join('') || 'Untitled',
      }))
  }

  // Create outline structure for all tabs
  const outline = tabs.map((tab, index) => ({
    tabIndex: index,
    title: tab.title || `Section ${index + 1}`,
    headings: extractHeadings(tab.content || [])
  }))

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Fixed Header with Logo */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
        isScrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-200" : "bg-white"
      )}>
        <div className="px-8 py-6">
          <Image 
            src="/webstacks-logotype-onlight.svg" 
            alt="Webstacks" 
            width={75}
            height={20}
            className="h-5 w-auto"
          />
        </div>
      </div>
      
      <div className="relative">
        <div className="grid grid-cols-[1fr_320px] min-h-screen">
          {/* Main Content Area */}
          <div className="bg-white px-8 pt-24">
            <div className="grid place-items-center min-h-full">
              <div style={{ maxWidth: '880px' }}>
                {/* Main Content */}
                <main>
                  {tabs && tabs.length > 0 ? (
                    <Tabs value={String(activeTabIndex)} onValueChange={(value) => navigateToTab(Number(value))} className="w-full">
                      <div className="space-y-8">
                        {/* Display active tab content */}
                        <div className="bg-white">
                          <div className="py-12">
                            <div>
                              <PortableText value={tabs[activeTabIndex]?.content || []} />
                              
                              {/* Show raw data for debugging if no content */}
                              {!tabs[activeTabIndex]?.content && (
                                <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                                  <h4 className="text-sm font-semibold text-black mb-4 uppercase tracking-wider">
                                    Tab Data
                                  </h4>
                                  <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
                                    {JSON.stringify(tabs[activeTabIndex], null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {/* Previous/Next Navigation Footer */}
                              <div className="mt-16 pt-8 border-t border-gray-200">
                                <div className="flex justify-between items-start">
                                  {/* Previous Page */}
                                  {activeTabIndex > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                                        Previous
                                      </div>
                                      <button
                                        onClick={() => navigateToTab(activeTabIndex - 1)}
                                        className="flex items-center px-6 h-10 bg-black text-white rounded-full hover:bg-blue-600 transition-colors"
                                      >
                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" />
                                        </svg>
                                        <span className="font-medium text-base">{tabs[activeTabIndex - 1]?.title || `Section ${activeTabIndex}`}</span>
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Next Page */}
                                  {activeTabIndex < tabs.length - 1 && (
                                    <div className="ml-auto">
                                      <div className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                                        Up Next
                                      </div>
                                      <button
                                        onClick={() => navigateToTab(activeTabIndex + 1)}
                                        className="flex items-center px-6 h-10 bg-black text-white rounded-full hover:bg-blue-600 transition-colors"
                                      >
                                        <span className="font-medium text-base">{tabs[activeTabIndex + 1]?.title || `Section ${activeTabIndex + 2}`}</span>
                                        <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-7-7m7 7l-7 7" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tabs>
                  ) : (
                    <div className="bg-white p-12 text-center">
                      <p className="text-gray-600">No content available for this proposal.</p>
                    </div>
                  )}
                </main>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Sidebar - Table of Contents with Outline */}
        <div className="fixed right-0 top-0 w-80 h-screen bg-black text-white border-l border-white z-50 overflow-hidden">
          <div className="p-6">
            {/* Prepared for section */}
            {company ? (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                  Prepared for
                </h3>
                <div className="flex items-center space-x-3">
                  {(() => {
                    console.log('🏢 Company data:', company)
                    console.log('🖼️ logoOnLight:', company.logoOnLight)
                    console.log('🖼️ logoOnDark:', company.logoOnDark)
                    console.log('🖼️ logomarkOnLight:', company.logomarkOnLight)
                    console.log('🖼️ logomarkOnDark:', company.logomarkOnDark)
                    
                    // Try different logo fields in order of preference
                    const logo = company.logoOnLight || company.logoOnDark || company.logomarkOnLight || company.logomarkOnDark
                    
                    if (logo) {
                      const imageUrl = urlForImage(logo).url()
                      console.log('🔗 Generated image URL:', imageUrl)
                      return (
                        <div className="flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={company.name}
                            width={60}
                            height={60}
                            className="object-contain bg-white rounded p-1"
                            onError={(e) => console.error('❌ Image failed to load:', e)}
                            onLoad={() => console.log('✅ Image loaded successfully')}
                          />
                        </div>
                      )
                    } else {
                      console.log('⚠️ No logo found in any field')
                      return (
                        <div className="flex-shrink-0 w-14 h-14 bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {company.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )
                    }
                  })()}
                  <div>
                    <p className="text-white font-medium text-sm">{company.name}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-gray-400 text-sm">No company data found</p>
              </div>
            )}
            
            {/* Prepared by section */}
            {preparedBy && (
              <div className="mb-8 pb-6 border-b border-gray-700">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                  Prepared by
                </h3>
                <div className="flex items-center space-x-3">
                  {preparedBy.headshot ? (
                    <div className="flex-shrink-0">
                      <Image
                        src={urlForImage(preparedBy.headshot).url()}
                        alt={`${preparedBy.firstName} ${preparedBy.lastName}`}
                        width={40}
                        height={40}
                        className="object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {preparedBy.firstName.charAt(0)}{preparedBy.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">
                      {preparedBy.firstName} {preparedBy.lastName}
                    </p>
                    {preparedBy.role && (
                      <p className="text-gray-400 text-xs">{preparedBy.role}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-6">
              Contents
            </h3>
            
            {outline && outline.length > 0 ? (
              <nav className="space-y-1">
                {outline.map((section) => (
                  <div key={section.tabIndex} className="mb-2">
                    {/* Main section/tab */}
                    <button
                      onClick={() => navigateToTab(section.tabIndex)}
                      className={cn(
                        "flex items-center w-full text-left px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium group",
                        activeTabIndex === section.tabIndex
                          ? "bg-blue-600 text-white"
                          : "text-white hover:bg-white hover:bg-opacity-10"
                      )}
                    >
                      <span className="truncate">{section.title}</span>
                    </button>
                    
                    {/* Headings within this section with vertical line */}
                    {section.headings.length > 0 && activeTabIndex === section.tabIndex && (
                      <div className="relative ml-5 mt-2">
                        {/* White vertical line */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"></div>
                        
                        <div className="pl-4 space-y-1 relative">
                          {/* Single sliding blue indicator */}
                          <div 
                            className="absolute left-0 w-0.5 bg-blue-600 transition-all duration-300 ease-out z-10"
                            style={{
                              top: `${indicatorStyle.top}px`,
                              height: `${indicatorStyle.height}px`,
                              opacity: indicatorStyle.height > 0 ? 1 : 0
                            }}
                          ></div>
                          
                          {section.headings.map((heading) => (
                            <button
                              key={heading.id}
                              data-heading-id={heading.id}
                              onClick={() => scrollToHeading(heading.id)}
                              className={cn(
                                "block w-full text-left py-1 px-2 text-sm text-white",
                                heading.level === 'h1' 
                                  ? "font-medium"
                                  : heading.level === 'h2' 
                                    ? "ml-2 opacity-90"
                                    : "ml-4 opacity-80",
                                activeHeadingId === heading.id && "opacity-100"
                              )}
                            >
                              {heading.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              <div className="text-white text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-100" />
                <p className="text-sm">No sections available</p>
              </div>
            )}
            
            {/* Open in Google Doc button - positioned at bottom */}
            {googleDocUrl && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <a
                  href={googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-black bg-white rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <Image 
                    src="/Google Docs Logo.svg" 
                    alt="Google Docs" 
                    width={16} 
                    height={16} 
                    className="mr-2 w-4 h-4"
                  />
                  Open in Google Doc
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
