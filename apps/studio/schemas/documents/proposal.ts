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
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Active', value: 'active' },
          { title: 'Completed', value: 'completed' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'draft',
      group: 'content',
    },
    {
      name: 'company',
      title: 'Prospect',
      type: 'reference',
      to: [{ type: 'company' }],
      validation: (Rule: Rule) => Rule.required(),
      group: 'content',
    },
    {
      name: 'amount',
      title: 'Amount',
      type: 'number',
      validation: (Rule: Rule) => Rule.positive(),
      group: 'content',
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      options: {
        list: [
          { title: 'USD', value: 'USD' },
          { title: 'EUR', value: 'EUR' },
          { title: 'GBP', value: 'GBP' },
        ],
      },
      initialValue: 'USD',
      group: 'content',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          fields: [
            {
              name: 'alt',
              title: 'Alternative text',
              type: 'string',
            },
          ],
        },
      ],
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
