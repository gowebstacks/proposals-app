import { defineType, Rule } from 'sanity'
import { seo } from '../fields'

const proposal = defineType({
  name: 'proposal',
  title: 'Proposal',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: Rule) => Rule.required(),
      group: 'content',
    },
    {
      name: 'company',
      title: 'Prospect',
      type: 'reference',
      to: [{ type: 'company' }],
      group: 'content',
    },
    {
      name: 'preparedBy',
      title: 'Prepared By',
      type: 'reference',
      to: [{ type: 'person' }],
      description: 'Person who prepared this proposal',
      group: 'content',
    },
    {
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      of: [{ type: 'canvas' }],
      description: 'Content tabs for this proposal',
      group: 'content',
    },
    {
      name: 'googleDoc',
      title: 'Google Doc URL',
      type: 'url',
      description: 'Link to the Google Doc for this proposal',
      validation: (Rule: Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
      group: 'content',
    },
    {
      name: 'calendarLink',
      title: 'Calendar Link',
      type: 'url',
      description: 'Link to schedule a meeting or event related to this proposal (e.g., Calendly, Google Calendar)',
      validation: (Rule: Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
      group: 'content',
    },
    {
      name: 'passwords',
      title: 'Password Protection',
      type: 'array',
      description: 'Optional passwords to protect this proposal. Add multiple passwords for different users. Leave empty for public access.',
      of: [{ type: 'string' }],
      group: 'content',
    },
    seo,
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    },
  ],
})

export default proposal
