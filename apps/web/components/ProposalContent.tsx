'use client'

import React, { useState, useEffect } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import PortableText from '@/components/PortableText'
import type { TypedObject } from '@portabletext/types'

interface Tab {
  title?: string
  content?: TypedObject[]
  [key: string]: unknown
}

interface ProposalContentProps {
  tabs: Tab[]
}

export default function ProposalContent({
  tabs
}: ProposalContentProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Gradient Background Effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-white to-gray-100 opacity-50" />
      
      {/* Fixed Header with Logo */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
        isScrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-200" : "bg-transparent"
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
          <div className="px-8 pt-24">
            <div className="grid place-items-center min-h-full">
              <div style={{ maxWidth: '880px' }}>
                {/* Main Content */}
                <main>
                  {tabs && tabs.length > 0 ? (
                    <Tabs value={String(activeTab)} onValueChange={(value) => setActiveTab(Number(value))} className="w-full">
                      <div className="space-y-8">
                        {/* Display active tab content */}
                        <div className="bg-white">
                          <div className="py-12">
                            <div style={{ maxWidth: '656px' }}>
                              <PortableText value={tabs[activeTab]?.content || []} />
                              
                              {/* Show raw data for debugging if no content */}
                              {!tabs[activeTab]?.content && (
                                <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                                  <h4 className="text-sm font-semibold text-black mb-4 uppercase tracking-wider">
                                    Tab Data
                                  </h4>
                                  <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
                                    {JSON.stringify(tabs[activeTab], null, 2)}
                                  </pre>
                                </div>
                              )}
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

        {/* Fixed Sidebar - Contents/Tabs */}
        <div className="fixed right-0 top-0 w-80 h-screen bg-black text-white border-l border-gray-800 z-50 overflow-hidden">
          <div className="p-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8">
              Contents
            </h3>
            
            {tabs && tabs.length > 0 ? (
              <nav className="space-y-1">
                {tabs.map((tab: Tab, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={cn(
                      "block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                      activeTab === index
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {tab.title || `Section ${index + 1}`}
                  </button>
                ))}
              </nav>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sections available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
