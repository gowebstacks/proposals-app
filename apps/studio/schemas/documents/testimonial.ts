import { defineType, Rule } from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the testimonial',
    },
    {
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: (Rule: Rule) => Rule.required(),
      description: 'The person who gave this testimonial',
    },
    {
      name: 'content',
      title: 'Testimonial Content',
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
      ],
      validation: (Rule: Rule) => Rule.required(),
      description: 'The testimonial content in rich text format',
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [
          { title: '1 Star', value: 1 },
          { title: '2 Stars', value: 2 },
          { title: '3 Stars', value: 3 },
          { title: '4 Stars', value: 4 },
          { title: '5 Stars', value: 5 },
        ],
      },
      description: 'Optional star rating (1-5)',
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'Date the testimonial was given',
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Mark as featured testimonial',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'title',
      personFirstName: 'person.firstName',
      personLastName: 'person.lastName',
      personCompany: 'person.company.name',
      content: 'content',
      rating: 'rating',
      featured: 'featured',
    },
    prepare({ title, personFirstName, personLastName, personCompany, content, rating, featured }) {
      const personName = [personFirstName, personLastName].filter(i => i).join(' ')
      const displayTitle = title || `Testimonial from ${personName}`
      
      // Extract first few words from content for subtitle
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
      
      const subtitle = [
        personName,
        personCompany && `(${personCompany})`,
        rating && `★${rating}`,
        featured && '⭐ Featured',
        contentPreview,
      ].filter(Boolean).join(' • ')

      return {
        title: displayTitle,
        subtitle,
      }
    },
  },
  orderings: [
    {
      title: 'Date, New',
      name: 'dateDesc',
      by: [
        { field: 'date', direction: 'desc' },
      ],
    },
    {
      title: 'Date, Old',
      name: 'dateAsc',
      by: [
        { field: 'date', direction: 'asc' },
      ],
    },
    {
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: 'date', direction: 'desc' },
      ],
    },
  ],
})
