'use client'

import React from 'react'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity'
import { cn } from '@/lib/utils'

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

interface LogoProps {
  company: Company
  size?: number
  className?: string
  theme?: 'light' | 'dark'
}

export default function Logo({ company, size = 75, className = "", theme = 'light' }: LogoProps) {
  // Logo selection logic based on theme
  let logo: Company['logoOnLight'] | Company['logoOnDark'] | Company['logomarkOnLight'] | Company['logomarkOnDark'] | null = null
  let needsFilter = false
  
  if (theme === 'dark') {
    // Dark theme: prefer dark logos, fallback to light logos with white filter
    logo = company.logoOnDark || company.logomarkOnDark
    if (!logo) {
      logo = company.logoOnLight || company.logomarkOnLight
      needsFilter = true
    }
  } else {
    // Light theme: prefer light logos, fallback to dark logos
    logo = company.logoOnLight || company.logomarkOnLight || company.logoOnDark || company.logomarkOnDark
  }
  
  if (logo) {
    const imageUrl = urlForImage(logo).url()
    return (
      <div className={`flex-shrink-0 ${className}`}>
        <Image
          src={imageUrl}
          alt={company.name}
          width={size}
          height={size}
          className={cn(
            "object-contain",
            needsFilter && "brightness-0 invert"
          )}
          loading="lazy"
        />
      </div>
    )
  } else {
    // Fallback circle - theme-aware colors
    const fallbackBg = theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
    const textColor = theme === 'dark' ? 'text-gray-900' : 'text-white'
    
    return (
      <div className={`flex-shrink-0 ${fallbackBg} rounded flex items-center justify-center ${className}`} 
           style={{ width: `${size}px`, height: `${size}px` }}>
        <span className={`${textColor} font-bold`} style={{ fontSize: `${size * 0.3}px` }}>
          {company.name.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }
}
