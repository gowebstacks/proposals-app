export const pricingTable = {
  name: 'pricingTable',
  title: 'Pricing Table',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Optional title for the pricing section',
    },
    {
      name: 'subtitle',
      title: 'Section Subtitle',
      type: 'text',
      description: 'Optional subtitle or description for the pricing section',
    },
    {
      name: 'plans',
      title: 'Pricing Plans',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pricingPlan',
          title: 'Pricing Plan',
          fields: [
            {
              name: 'name',
              title: 'Plan Name',
              type: 'string',
              description: 'e.g., Starter, Professional, Enterprise',
              validation: (Rule: { required: () => unknown }) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Plan Description',
              type: 'text',
              description: 'Brief description of who this plan is for',
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
              title: 'Plan Highlights',
              type: 'array',
              description: 'Key highlights that appear inside the plan card',
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
    {
      name: 'layout',
      title: 'Layout Options',
      type: 'object',
      fields: [
        {
          name: 'columns',
          title: 'Columns per Row',
          type: 'number',
          description: 'How many pricing plans to show per row',
          options: {
            list: [
              { title: '1 Column', value: 1 },
              { title: '2 Columns', value: 2 },
              { title: '3 Columns', value: 3 },
              { title: '4 Columns', value: 4 },
            ],
          },
          initialValue: 3,
        },
        {
          name: 'spacing',
          title: 'Card Spacing',
          type: 'string',
          options: {
            list: [
              { title: 'Tight', value: 'tight' },
              { title: 'Normal', value: 'normal' },
              { title: 'Loose', value: 'loose' },
            ],
          },
          initialValue: 'normal',
        },
        {
          name: 'alignment',
          title: 'Text Alignment',
          type: 'string',
          options: {
            list: [
              { title: 'Left', value: 'left' },
              { title: 'Center', value: 'center' },
              { title: 'Right', value: 'right' },
            ],
          },
          initialValue: 'center',
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      name: 'styling',
      title: 'Styling Options',
      type: 'object',
      fields: [
        {
          name: 'showBorders',
          title: 'Show Card Borders',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'showShadows',
          title: 'Show Card Shadows',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'roundedCorners',
          title: 'Rounded Corners',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'backgroundColor',
          title: 'Background Color',
          type: 'string',
          options: {
            list: [
              { title: 'White', value: 'white' },
              { title: 'Light Gray', value: 'gray-50' },
              { title: 'Blue', value: 'blue-50' },
              { title: 'Transparent', value: 'transparent' },
            ],
          },
          initialValue: 'white',
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      name: 'featuresTable',
      title: 'Features Table',
      type: 'array',
      description: 'Comparison table showing which features are included in each plan',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'feature',
              title: 'Feature Name',
              type: 'string',
              validation: (Rule: { required: () => unknown }) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Feature Description',
              type: 'text',
              description: 'Optional description of what this feature includes',
            },
            {
              name: 'planAvailability',
              title: 'Plan Availability',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'planIndex',
                      title: 'Plan Index',
                      type: 'number',
                      description: 'Index of the plan (0 = first plan, 1 = second plan, etc.)',
                      validation: (Rule: { required: () => unknown }) => Rule.required(),
                    },
                    {
                      name: 'included',
                      title: 'Included',
                      type: 'string',
                      options: {
                        list: [
                          { title: '✓ Included', value: 'included' },
                          { title: '⚠ Limited', value: 'limited' },
                          { title: '✗ Not Included', value: 'not_included' },
                          { title: 'Custom Text', value: 'custom' },
                        ],
                      },
                      initialValue: 'included',
                    },
                    {
                      name: 'customText',
                      title: 'Custom Text',
                      type: 'string',
                      description: 'Custom text to show instead of included/not included',
                      hidden: ({ parent }: { parent: { included: string } }) => parent?.included !== 'custom',
                    },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              feature: 'feature',
              planAvailability: 'planAvailability',
            },
            prepare(selection: { feature: string; planAvailability?: Array<{ included: string }> }) {
              const { feature, planAvailability } = selection
              const includedCount = planAvailability?.filter(p => p.included === 'included').length || 0
              const totalCount = planAvailability?.length || 0
              return {
                title: feature,
                subtitle: `Available in ${includedCount}/${totalCount} plans`,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      plans: 'plans',
    },
    prepare(selection: { title?: string; plans?: Array<{ name?: string }> }) {
      const { title, plans } = selection
      const planCount = plans?.length || 0
      const planNames = plans?.map(p => p.name).filter(Boolean).join(', ') || 'No plans'
      
      return {
        title: title || 'Pricing Table',
        subtitle: `${planCount} plans: ${planNames}`,
      }
    },
  },
}
