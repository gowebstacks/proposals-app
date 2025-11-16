import { defineType, defineField } from 'sanity'

// Define the portable text block type for better type safety
interface PortableTextChild {
  _type: 'span'
  text: string
  _key?: string
  marks?: string[]
}

interface PortableTextBlock {
  _type: 'block'
  style: 'normal' | 'h1' | 'h2' | 'h3'
  children: PortableTextChild[]
  _key?: string
  markDefs?: Array<{ _key: string; _type: string; href?: string }>
  listItem?: 'bullet' | 'number'
  level?: number
}

const canvas = defineType({
  name: 'canvas',
  title: 'Canvas',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Title for this canvas tab',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'table',
        },
        {
          type: 'gallery',
        },
        {
          type: 'accordion',
        },
        {
          type: 'pricingTable',
        },
        {
          type: 'scopeTable',
        },
        {
          type: 'testimonialCard',
        },
      ],
      description: 'Rich text content for the canvas',
    },
  ],
  preview: {
    select: {
      title: 'content',
    },
    prepare(selection: { title?: unknown }) {
      const { title } = selection
      return {
        title: title && Array.isArray(title)
          ? title.map((block: unknown) => 
              (block as { children?: PortableTextChild[] }).children?.map((child: PortableTextChild) => child.text || '').join('')
            ).join(' ').substring(0, 50) + '...'
          : 'Untitled Canvas',
      }
    },
  },
})

export type { PortableTextBlock, PortableTextChild }
export default canvas
