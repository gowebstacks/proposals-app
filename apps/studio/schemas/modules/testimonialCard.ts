import { CommentIcon } from '@sanity/icons'

export const testimonialCard = {
  name: 'testimonialCard',
  title: 'Testimonial Card',
  type: 'object',
  icon: CommentIcon,
  fields: [
    {
      name: 'testimonial',
      title: 'Testimonial',
      type: 'reference',
      to: [{ type: 'testimonial' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Select a testimonial to display',
    },
  ],
  preview: {
    select: {
      testimonialTitle: 'testimonial.title',
      personFirstName: 'testimonial.person.firstName',
      personLastName: 'testimonial.person.lastName',
      personCompany: 'testimonial.person.company.name',
    },
    prepare(selection: any) {
      const { testimonialTitle, personFirstName, personLastName, personCompany } = selection
      const personName = [personFirstName, personLastName].filter(Boolean).join(' ')
      const title = testimonialTitle || `Testimonial from ${personName || 'Unknown'}`
      
      const subtitle = personCompany || 'No company'
      
      return {
        title: `💬 ${title}`,
        subtitle,
      }
    },
  },
}
