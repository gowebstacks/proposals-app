import { defineType } from 'sanity'

const proposal = defineType({
  name: 'proposal',
  title: 'Proposal',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
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
    },
    {
      name: 'client',
      title: 'Client',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Client Name',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'email',
          title: 'Client Email',
          type: 'string',
          validation: (Rule: any) => Rule.email(),
        },
        {
          name: 'company',
          title: 'Company',
          type: 'string',
        },
      ],
    },
    {
      name: 'amount',
      title: 'Amount',
      type: 'number',
      validation: (Rule: any) => Rule.positive(),
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
    },
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

export const schemaTypes = [proposal]
