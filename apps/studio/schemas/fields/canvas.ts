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
  markDefs?: Array<{ _key: string; _type: string }>
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
            ],
          },
        },
        {
          type: 'object',
          name: 'table',
          title: 'Table',
          fields: [
            {
              name: 'caption',
              title: 'Table Caption',
              type: 'string',
              description: 'Optional caption displayed above the table',
            },
            {
              name: 'headers',
              title: 'Table Headers',
              type: 'array',
              description: 'Column headers for the table',
              validation: (Rule: { required(): any; min(num: number): any }) => Rule.required().min(1),
              of: [
                {
                  type: 'object',
                  name: 'header',
                  fields: [
                    {
                      name: 'text',
                      title: 'Header Text',
                      type: 'string',
                      validation: (Rule: { required(): any }) => Rule.required(),
                    },
                    {
                      name: 'alignment',
                      title: 'Text Alignment',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Left', value: 'left' },
                          { title: 'Center', value: 'center' },
                          { title: 'Right', value: 'right' },
                        ],
                        layout: 'radio',
                      },
                      initialValue: 'left',
                    },
                  ],
                },
              ],
            },
            {
              name: 'rows',
              title: 'Table Rows',
              type: 'array',
              description: 'Data rows for the table',
              validation: (Rule) => Rule.required().min(1),
              of: [
                {
                  type: 'object',
                  name: 'row',
                  fields: [
                    {
                      name: 'cells',
                      title: 'Row Cells',
                      type: 'array',
                      description: 'Cell data for this row',
                      of: [
                        {
                          type: 'object',
                          name: 'cell',
                          fields: [
                            {
                              name: 'content',
                              title: 'Cell Content',
                              type: 'text',
                              rows: 1,
                              validation: (Rule: { required(): any }) => Rule.required(),
                            },
                          ],
                          preview: {
                            select: {
                              content: 'content',
                            },
                            prepare({ content }: { content?: string }) {
                              return {
                                title: content || 'Empty cell',
                                subtitle: 'Cell data',
                              }
                            },
                          },
                        },
                      ],
                    },
                  ],
                  preview: {
                    select: {
                      cells: 'cells',
                    },
                    prepare({ cells }: { cells?: Array<{ content?: string }> }) {
                      const cellCount = cells?.length || 0
                      const firstCell = cells?.[0]?.content || ''
                      const truncatedFirst = firstCell.length > 30 ? firstCell.substring(0, 30) + '...' : firstCell
                      return {
                        title: `Row with ${cellCount} cell${cellCount === 1 ? '' : 's'}`,
                        subtitle: truncatedFirst || 'Empty row',
                      }
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              caption: 'caption',
              headers: 'headers',
              rows: 'rows',
            },
            prepare({ caption, headers, rows }: { caption?: string; headers?: unknown[]; rows?: unknown[] }) {
              const headerCount = headers?.length || 0
              const rowCount = rows?.length || 0
              const title = caption || `${headerCount}×${rowCount} Table`
              const subtitle = `${headerCount} column${headerCount === 1 ? '' : 's'}, ${rowCount} row${rowCount === 1 ? '' : 's'}`
              return {
                title,
                subtitle,
              }
            },
          },
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
