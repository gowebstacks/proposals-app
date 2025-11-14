import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fieldsets: [
    {
      name: 'name',
      title: 'Name',
      options: { columns: 2 },
    },
    {
      name: 'employment',
      title: 'Employment',
    },
  ],
  fields: [
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      fieldset: 'name',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      fieldset: 'name',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      fieldset: 'employment',
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'reference',
      to: [{ type: 'company' }],
      description: 'The company this person works for or is associated with.',
      fieldset: 'employment',
    }),
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.email(),
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
      companyName: 'company.name',
      media: 'headshot',
    },
    prepare({ firstName, lastName, role, companyName, media }) {
      const title = [firstName, lastName].filter(i => i).join(' ')

      let subtitle: string[] | string = [role, companyName]

      if (role && companyName) {
        subtitle = subtitle.join(' | ')
      } else {
        subtitle = subtitle.filter(i => i).join('')
      }

      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
