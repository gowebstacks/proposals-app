import { TagIcon } from '@sanity/icons'

export const pricingTable = {
  name: 'pricingTable',
  title: 'Pricing Table',
  type: 'object',
  icon: TagIcon,
  fields: [
    {
      name: 'options',
      title: 'Pricing Options',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pricingOption',
          title: 'Pricing Option',
          fields: [
            {
              name: 'name',
              title: 'Option Name',
              type: 'string',
              description: 'e.g., Starter, Professional, Enterprise',
              validation: (Rule: { required: () => unknown }) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Option Description',
              type: 'text',
              description: 'A brief description of this option',
            },
            {
              name: 'price',
              title: 'Price',
              type: 'object',
              fields: [
                {
                  name: 'type',
                  title: 'Price Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Single Amount', value: 'single' },
                      { title: 'Price Range', value: 'range' },
                      { title: 'Starting From', value: 'starting_from' },
                      { title: 'Custom Text', value: 'custom' },
                    ],
                  },
                  initialValue: 'single',
                },
                {
                  name: 'amount',
                  title: 'Price Amount',
                  type: 'number',
                  description: 'Single price or minimum price for range',
                  hidden: ({ parent }: { parent: { type: string } }) => parent?.type === 'custom',
                },
                {
                  name: 'maxAmount',
                  title: 'Maximum Price',
                  type: 'number',
                  description: 'Maximum price for range',
                  hidden: ({ parent }: { parent: { type: string } }) => parent?.type !== 'range',
                },
                {
                  name: 'customText',
                  title: 'Custom Price Text',
                  type: 'string',
                  description: 'Custom pricing text (e.g., "Contact for pricing")',
                  hidden: ({ parent }: { parent: { type: string } }) => parent?.type !== 'custom',
                },
                {
                  name: 'currency',
                  title: 'Currency',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'USD ($)', value: 'USD' },
                      { title: 'EUR (€)', value: 'EUR' },
                      { title: 'GBP (£)', value: 'GBP' },
                    ],
                  },
                  initialValue: 'USD',
                },
                {
                  name: 'period',
                  title: 'Billing Period',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Per Month', value: 'mo' },
                      { title: 'Per Year', value: 'yr' },
                      { title: 'One Time', value: 'once' },
                      { title: 'Custom', value: 'custom' },
                    ],
                  },
                  initialValue: 'mo',
                },
                {
                  name: 'customPeriod',
                  title: 'Custom Period Text',
                  type: 'string',
                  description: 'Custom billing period text (only shown if period is "custom")',
                  hidden: ({ parent }: { parent: { period: string } }) => parent?.period !== 'custom',
                },
              ],
            },
            {
              name: 'badge',
              title: 'Plan Badge',
              type: 'object',
              description: 'Optional badge like "Most Popular" or "Current Plan"',
              fields: [
                {
                  name: 'text',
                  title: 'Badge Text',
                  type: 'string',
                  description: 'Badge text like "Most Popular" or "Current Plan"',
                },
              ],
              preview: {
                select: {
                  text: 'text',
                },
                prepare(selection: { text?: string }) {
                  const { text } = selection
                  return {
                    title: text || 'No badge',
                  }
                },
              },
            },
            {
              name: 'highlights',
              title: 'Option Highlights',
              type: 'array',
              description: 'Key highlights that appear inside the option card',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'text',
                      title: 'Highlight Text',
                      type: 'string',
                      validation: (Rule: { required: () => unknown }) => Rule.required(),
                    },
                    {
                      name: 'icon',
                      title: 'Icon',
                      type: 'string',
                      options: {
                        list: [
                          { title: '✓ Check', value: 'check' },
                          { title: '⚡ Lightning', value: 'lightning' },
                          { title: '🚀 Rocket', value: 'rocket' },
                          { title: '📊 Chart', value: 'chart' },
                          { title: '🔒 Lock', value: 'lock' },
                          { title: '🌟 Star', value: 'star' },
                        ],
                      },
                      initialValue: 'check',
                    },
                  ],
                  preview: {
                    select: {
                      text: 'text',
                      icon: 'icon',
                    },
                    prepare(selection: { text: string; icon: string }) {
                      const { text, icon } = selection
                      const iconMap: { [key: string]: string } = {
                        check: '✓',
                        lightning: '⚡',
                        rocket: '🚀',
                        chart: '📊',
                        lock: '🔒',
                        star: '🌟',
                      }
                      return {
                        title: `${iconMap[icon] || '✓'} ${text}`,
                      }
                    },
                  },
                },
              ],
            },
                      ],
          preview: {
            select: {
              name: 'name',
              price: 'price',
              badge: 'badge',
            },
            prepare(selection: { name?: string; price?: { type?: string; amount?: number; maxAmount?: number; customText?: string; currency?: string; period?: string }; badge?: { text?: string } }) {
              const { name, price, badge } = selection
              
              let priceText = 'No price set'
              if (price) {
                const currencySymbol = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : '£'
                const period = price.period || 'mo'
                
                if (price.type === 'custom') {
                  priceText = price.customText || 'Custom pricing'
                } else if (price.type === 'range') {
                  priceText = `${currencySymbol}${price.amount}-${currencySymbol}${price.maxAmount}/${period}`
                } else if (price.type === 'starting_from') {
                  priceText = `From ${currencySymbol}${price.amount}/${period}`
                } else if (price.amount) {
                  priceText = `${currencySymbol}${price.amount}/${period}`
                }
              }
              
              return {
                title: `${name || 'Unnamed Plan'}${badge?.text ? ' ⭐' : ''}`,
                subtitle: priceText,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      options: 'options',
    },
    prepare(selection: { options?: Array<{ name?: string }> }) {
      const { options } = selection
      const optionCount = options?.length || 0
      const optionNames = options?.map(o => o.name).filter(Boolean).join(', ') || 'No options'
      return {
        title: `${optionCount} option${optionCount !== 1 ? 's' : ''}: ${optionNames}`,
        subtitle: 'Pricing Table',
      }
    },
  },
}
