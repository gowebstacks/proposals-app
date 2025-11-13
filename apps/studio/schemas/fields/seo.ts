import { defineField } from 'sanity'
import type { SlugValidationContext } from 'sanity'

export const seo = defineField({
  name: 'seo',
  title: 'SEO Settings',
  type: 'object',
  group: 'seo',
  options: {
    collapsible: false,
  },
  fieldsets: [
    {
      name: 'searchEngineSettings',
      title: 'Search Engine Settings',
      options: {
        columns: 2,
      },
    },
  ],
  fields: [
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL path for this page.',
      options: {
        source: 'title',
        isUnique: isUniqueSlug,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'The title that will appear in search engine results.',
    },
    {
      name: 'pageDescription',
      title: 'Page Description',
      type: 'text',
      description: 'The description that will appear in search engine results.',
      rows: 4,
    },
    {
      name: 'openGraphImage',
      title: 'Open Graph Image',
      type: 'image',
      description:
        'The image that will appear when this page is shared on social media.',
    },
    {
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      fieldset: 'searchEngineSettings',
      description: 'Prevent search engines from indexing this page.',
      initialValue: false,
    },
    {
      name: 'noFollow',
      title: 'No Follow',
      type: 'boolean',
      fieldset: 'searchEngineSettings',
      description: 'Prevent search engines from following links on this page.',
      initialValue: false,
    },
  ],
})

// Simplified slug uniqueness validation
export async function isUniqueSlug(slug: string, context: SlugValidationContext) {
  const { document, getClient } = context
  const client = getClient({ apiVersion: '2025-02-19' })
  const id = document?._id?.replace(/^drafts\./, '')
  const params = {
    id,
    type: document?._type,
    slug,
  }

  const query = `!defined(*[
    !(_id in [$id, "drafts." + $id]) &&
    _type == $type &&
    seo.slug.current == $slug
  ][0]._id)`

  const result = await client.fetch(query, params)
  return result
}
