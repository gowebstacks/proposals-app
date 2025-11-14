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
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // Generate tab slug from title
  const generateTabSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // Navigate to tab with smooth transition
  const navigateToTab = (tabIndex: number) => {
    setIsNavigating(true)
    const tab = tabs[tabIndex]
    
    // Scroll to top smoothly before navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Small delay for smooth transition
    setTimeout(() => {
      if (tab?.title) {
        const tabSlug = generateTabSlug(tab.title)
        router.push(`/${proposalSlug}/${tabSlug}`)
      } else if (tabIndex === 0) {
        // Fallback for first tab without title
        router.push(`/${proposalSlug}`)
      }
      setIsNavigating(false)
    }, 150)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
                                <div className="flex justify-between items-center">
                                  {/* Previous Page */}
                                  {activeTabIndex > 0 ? (
                                    <button
                                      onClick={() => navigateToTab(activeTabIndex - 1)}
                                      disabled={isNavigating}
                                      className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 group hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                      <div className="text-left">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Previous</div>
                                        <div className="font-medium">{tabs[activeTabIndex - 1]?.title || `Section ${activeTabIndex}`}</div>
                                      </div>
                                    </button>
                                  ) : (
                                    <div></div>
                                  )}
                                  
                                  {/* Next Page */}
                                  {activeTabIndex < tabs.length - 1 ? (
                                    <button
                                      onClick={() => navigateToTab(activeTabIndex + 1)}
                                      disabled={isNavigating}
                                      className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 group hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Next</div>
                                        <div className="font-medium">{tabs[activeTabIndex + 1]?.title || `Section ${activeTabIndex + 2}`}</div>
                                      </div>
                                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <div></div>
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
        <div className="fixed right-0 top-0 w-80 h-screen bg-black text-white border-l border-white/10 z-50 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent p-6">
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
                      disabled={isNavigating}
                      className={cn(
                        "flex items-center w-full text-left px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium group",
                        activeTabIndex === section.tabIndex
                          ? "bg-blue-600 text-white"
                          : "text-white hover:bg-white hover:bg-opacity-10"
                      )}
                    >
                      {/* Document icon */}
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-4 h-4 border border-white rounded-sm flex items-center justify-center opacity-100">
                          <div className="w-2 h-2 border-t border-white"></div>
                        </div>
                      </div>
                      <span className="truncate">{section.title}</span>
                    </button>
                    
                    {/* Headings within this section with vertical line */}
                    {section.headings.length > 0 && activeTabIndex === section.tabIndex && (
                      <div className="relative ml-5 mt-2">
                        {/* White vertical line */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"></div>
                        
                        <div className="pl-4 space-y-1">
                          {section.headings.map((heading) => (
                            <button
                              key={heading.id}
                              onClick={() => scrollToHeading(heading.id)}
                              className={cn(
                                "block w-full text-left py-1 text-sm transition-colors hover:text-white",
                                heading.level === 'h1' && "text-white font-medium",
                                heading.level === 'h2' && "text-white ml-2 opacity-90",
                                heading.level === 'h3' && "text-white ml-4 opacity-80"
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
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
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
