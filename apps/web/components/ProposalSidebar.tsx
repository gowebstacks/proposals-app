'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Radio,
  FileText,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useSidebar } from '@/contexts/SidebarContext'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  href?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export default function ProposalSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [activeItem, setActiveItem] = useState('Proposal')

  const navSections: NavSection[] = [
    {
      items: [
        { label: 'Proposal', icon: FileText },
        { label: 'Call Recordings', icon: Radio },
        { label: 'Case Studies', icon: BookOpen },
      ]
    }
  ]

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Content */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with Logo and Toggle */}
        <div className={cn(
          "p-4 border-b border-gray-200 relative transition-all duration-300",
          isCollapsed ? "h-[104px]" : "h-[64px]"
        )}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center p-1.5">
              <Image
                src="/logo_logomark.svg"
                alt="Webstacks"
                width={20}
                height={20}
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Toggle Button with smooth position transition */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md text-gray-600"
            style={{
              transform: isCollapsed ? 'translate(0, 45px)' : 'translate(192px, 0)',
              transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && !isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.label
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => setActiveItem(item.label)}
                      className={cn(
                        "flex items-center transition-all duration-150 text-sm group relative w-full text-left py-2 rounded-md",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                          <Icon className={cn(
                            "w-4 h-4",
                            isActive ? "text-gray-900" : "text-gray-500"
                          )} />
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className={cn(
                              "truncate flex-1",
                              isActive ? "font-medium" : "font-normal"
                            )}>{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-pink-500 text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Profile at Bottom */}
        <div className="p-3 border-t border-gray-200">
          {isCollapsed ? (
            <button className="w-full flex justify-center py-2 hover:bg-gray-50 rounded-md transition-colors">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                N
              </div>
            </button>
          ) : (
            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                N
              </div>
              <span className="text-sm text-gray-700 truncate">nshahidi@webstacks.com</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
