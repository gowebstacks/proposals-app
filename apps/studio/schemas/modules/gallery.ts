export const gallery = {
  name: 'gallery',
  title: 'Gallery',
  type: 'object',
  fields: [
    {
      name: 'slides',
      title: 'Gallery Slides',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'company',
              title: 'Company',
              type: 'reference',
              to: [{ type: 'company' }],
              description: 'Reference to a company document',
            },
            {
              name: 'customImage',
              title: 'Custom Image',
              type: 'image',
              description: 'Optional custom image (overrides company logo)',
              options: {
                hotspot: true,
              },
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption for this slide',
            },
            {
              name: 'showCompanyName',
              title: 'Show Company Name',
              type: 'boolean',
              description: 'Display the company name below the image',
              initialValue: true,
            },
          ],
          preview: {
            select: {
              companyName: 'company.name',
              companyLogo: 'company.logo',
              customImage: 'customImage',
              caption: 'caption',
            },
            prepare(selection: any) {
              const { companyName, companyLogo, customImage, caption } = selection
              const displayImage = customImage || companyLogo
              const title = companyName || 'No company selected'
              const subtitle = caption || 'No caption'
              
              return {
                title: title,
                subtitle: subtitle,
                media: displayImage,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      slides: 'slides',
    },
    prepare(selection: any) {
      const { slides } = selection
      const slideCount = slides?.length || 0
      
      return {
        title: 'Company Gallery',
        subtitle: `${slideCount} company slide${slideCount === 1 ? '' : 's'}`,
      }
    },
  },
}
