'use client'

import { PortableText as PortableTextComponent, type PortableTextReactComponents } from '@portabletext/react'
import { cn } from '@/lib/utils'
import type { TypedObject } from '@portabletext/types'

interface PortableTextProps {
  value: TypedObject[]
  className?: string
}

// Proper interfaces for Portable Text structure
interface PortableTextSpan {
  _type: 'span'
  text: string
  _key: string
  marks: string[]
}

interface PortableTextBlock {
  _type: 'block'
  style: 'normal' | 'h1' | 'h2' | 'h3'
  children: PortableTextSpan[]
  _key: string
  markDefs: Array<{
    _key: string
    _type: string
    href?: string
  }>
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => {
      console.log('🎯 Rendering h1 block:', children)
      return <h1 className="text-4xl font-bold text-black mb-4">{children}</h1>
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      console.log('🎯 Rendering h2 block:', children)
      return <h2 className="text-3xl font-semibold text-black mb-3">{children}</h2>
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      console.log('🎯 Rendering h3 block:', children)
      return <h3 className="text-2xl font-medium text-black mb-2">{children}</h3>
    },
    normal: ({ children }: { children?: React.ReactNode }) => {
      console.log('📄 Rendering normal block:', children)
      return <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    },
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => {
      console.log('💪 Rendering strong mark:', children)
      return <strong className="font-bold text-black">{children}</strong>
    },
    em: ({ children }: { children?: React.ReactNode }) => {
      console.log('📝 Rendering em mark:', children)
      return <em className="italic">{children}</em>
    },
    underline: ({ children }: { children?: React.ReactNode }) => {
      console.log('📏 Rendering underline mark:', children)
      return <u className="underline">{children}</u>
    },
    link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => {
      console.log('🔗 Rendering link mark:', { children, href: value?.href })
      return (
        <a 
          href={value?.href} 
          className="text-blue-600 hover:text-blue-700 underline"
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
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li>{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li>{children}</li>
    ),
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
    ['normal', 'h1', 'h2', 'h3'].includes((item as PortableTextBlock).style)
  )
  console.log(`📊 PortableText processing ${blocks.length} blocks`)
  
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
    <div className={cn('prose prose-gray max-w-none', className)}>
      <PortableTextComponent value={value} components={components} />
    </div>
  )
}
