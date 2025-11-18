import { ListIcon } from '@sanity/icons'

export const scopeTable = {
  name: 'scopeTable',
  title: 'Scope Table',
  type: 'object',
  icon: ListIcon,
  fields: [
    {
      name: 'options',
      title: 'Reference Options',
      type: 'array',
      description: 'Reference to the pricing options this scope table compares',
      of: [{ type: 'string' }],
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'scopeGroups',
      title: 'Scope Groups',
      type: 'array',
      description: 'Organized groups of scope items for better structure and ordering',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'groupName',
              title: 'Group Name',
              type: 'string',
              description: 'Name of this group (e.g., Design, Development, Marketing)',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'items',
              title: 'Scope Items',
              type: 'array',
              description: 'Scope items in this group',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'item',
                      title: 'Scope Item',
                      type: 'string',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'description',
                      title: 'Scope Description',
                      type: 'text',
                      description: 'Optional description of what this scope item includes',
                    },
                    {
                      name: 'tooltip',
                      title: 'Tooltip',
                      type: 'text',
                      description: 'Optional tooltip text that appears on hover for more details',
                    },
                    {
                      name: 'optionAvailability',
                      title: 'Option Availability',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          fields: [
                            {
                              name: 'optionIndex',
                              title: 'Option Index',
                              type: 'number',
                              description: 'Index of the option (0 = first option, 1 = second option, etc.)',
                              validation: (Rule: any) => Rule.required(),
                            },
                            {
                              name: 'included',
                              title: 'Status',
                              type: 'string',
                              options: {
                                list: [
                                  { title: 'Included', value: 'included' },
                                  { title: 'Limited', value: 'limited' },
                                  { title: 'Not Included', value: 'not_included' },
                                  { title: 'Custom', value: 'custom' },
                                ],
                                layout: 'dropdown',
                              },
                              validation: (Rule: any) => Rule.required(),
                            },
                            {
                              name: 'customText',
                              title: 'Custom Text',
                              type: 'string',
                              description: 'Custom status text when status is set to "Custom"',
                              hidden: ({ parent }: { parent?: { included?: string } }) => parent?.included !== 'custom',
                            },
                          ],
                          preview: {
                            select: {
                              included: 'included',
                              customText: 'customText',
                            },
                            prepare(selection: { included: string; customText?: string }) {
                              const { included, customText } = selection
                              let statusText = included
                              if (included === 'included') statusText = '✓'
                              if (included === 'limited') statusText = '⚠️'
                              if (included === 'not_included') statusText = '✗'
                              if (included === 'custom' && customText) statusText = customText
                              
                              return {
                                title: statusText,
                              }
                            },
                          },
                        },
                      ],
                      validation: (Rule: any) => Rule.required().min(1),
                    },
                  ],
                  preview: {
                    select: {
                      item: 'item',
                      optionAvailability: 'optionAvailability',
                    },
                    prepare(selection: { item: string; optionAvailability?: Array<{ included: string }> }) {
                      const { item, optionAvailability } = selection
                      const includedCount = optionAvailability?.filter(p => p.included === 'included').length || 0
                      const totalCount = optionAvailability?.length || 0
                      return {
                        title: item,
                        subtitle: `Available in ${includedCount}/${totalCount} options`,
                      }
                    },
                  },
                },
              ],
              validation: (Rule: any) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              groupName: 'groupName',
              items: 'items',
            },
            prepare(selection: { groupName: string; items?: Array<{ item?: string }> }) {
              const { groupName, items } = selection
              const itemCount = items?.length || 0
              return {
                title: groupName,
                subtitle: `${itemCount} item${itemCount !== 1 ? 's' : ''}`,
              }
            },
          },
        },
      ],
      validation: (Rule: any) => Rule.required().min(1),
    },
  ],
  preview: {
    select: {
      scopeGroups: 'scopeGroups',
    },
    prepare(selection: { scopeGroups?: Array<{ groupName?: string }> }) {
      const { scopeGroups } = selection
      const groupCount = scopeGroups?.length || 0
      const groupNames = scopeGroups?.map(g => g.groupName).filter(Boolean).join(', ') || 'No groups'
      return {
        title: `${groupCount} group${groupCount !== 1 ? 's' : ''}: ${groupNames}`,
        subtitle: 'Scope Comparison Table',
      }
    },
  },
}
