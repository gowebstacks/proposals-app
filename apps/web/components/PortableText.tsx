'use client'

import { PortableText as PortableTextComponent, type PortableTextReactComponents } from '@portabletext/react'
import { cn } from '@/lib/utils'
import type { TypedObject } from '@portabletext/types'

interface PortableTextProps {
  value: TypedObject[]
  className?: string
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-4xl font-bold text-black mb-4">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-3xl font-semibold text-black mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-2xl font-medium text-black mb-2">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-black">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => (
      <a 
        href={value?.href} 
        className="text-blue-600 hover:text-blue-700 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
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
  if (!value || !Array.isArray(value)) {
    return <p className="text-gray-600">No content available</p>
  }

  return (
    <div className={cn('prose prose-gray max-w-none', className)}>
      <PortableTextComponent value={value} components={components} />
    </div>
  )
}
