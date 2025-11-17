import { InfoOutlineIcon } from '@sanity/icons'

export const callout = {
  name: 'callout',
  title: 'Callout',
  type: 'object',
  icon: InfoOutlineIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the callout (e.g., "Important", "Note", "Warning")',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
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
      ],
      validation: (Rule: any) => Rule.required(),
      description: 'The callout message content',
    },
    {
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Info (Blue)', value: 'info' },
          { title: 'Success (Green)', value: 'success' },
          { title: 'Warning (Yellow)', value: 'warning' },
          { title: 'Error (Red)', value: 'error' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
      description: 'Visual style of the callout',
    },
  ],
  preview: {
    select: {
      title: 'title',
      content: 'content',
      theme: 'theme',
    },
    prepare(selection: any) {
      const { title, content, theme } = selection
      
      // Extract first bit of text from content
      let contentPreview = ''
      if (content && content.length > 0) {
        const firstBlock = content[0]
        if (firstBlock.children && firstBlock.children.length > 0) {
          contentPreview = firstBlock.children
            .map((child: { text?: string }) => child.text || '')
            .join('')
            .substring(0, 60) + '...'
        }
      }
      
      const variantEmoji: Record<string, string> = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
      }
      const emoji = variantEmoji[theme] || 'ℹ️'
      
      return {
        title: `${emoji} ${title || 'Callout'}`,
        subtitle: contentPreview,
      }
    },
  },
}
