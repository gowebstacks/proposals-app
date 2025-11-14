import { defineType, defineField } from 'sanity'

const company = defineType({
  name: 'company',
  title: 'Company',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Company Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // Logo variants
    defineField({
      name: 'logoOnLight',
      title: 'Logo on Light Background',
      type: 'image',
      description: 'Full company logo for use on light backgrounds',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'logoOnDark',
      title: 'Logo on Dark Background', 
      type: 'image',
      description: 'Full company logo for use on dark backgrounds',
      options: {
        hotspot: true,
      },
    }),
    // Logomark variants
    defineField({
      name: 'logomarkOnLight',
      title: 'Logomark on Light Background',
      type: 'image',
      description: 'Company logomark/symbol for use on light backgrounds',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'logomarkOnDark',
      title: 'Logomark on Dark Background',
      type: 'image', 
      description: 'Company logomark/symbol for use on dark backgrounds',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https', 'mailto', 'tel'],
        }),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logoOnLight',
    },
  },
})

export default company
