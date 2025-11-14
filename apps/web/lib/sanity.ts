import { createClient, groq } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export { groq }

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''
const apiVersion = '2023-05-03'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

// Set up image URL builder
const builder = imageUrlBuilder({ projectId, dataset })

// Helper function for generating image URLs with Sanity Image Pipeline
export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}

export async function getProposalBySlug(slug: string) {
  // Try to fetch by seo.slug first
  let proposal = await client.fetch(
    groq`*[_type == "proposal" && seo.slug.current == $slug][0]{
      _id,
      title,
      description,
      status,
      company->{
        _id,
        name,
        website
      },
      amount,
      currency,
      tabs,
      googleDoc,
      seo,
      createdAt,
      updatedAt
    }`,
    { slug }
  )
  
  // If not found by slug, try by ID (for backward compatibility)
  if (!proposal) {
    proposal = await client.fetch(
      groq`*[_type == "proposal" && _id == $id][0]{
        _id,
        title,
        description,
        status,
        company->{
          _id,
          name,
          website
        },
        amount,
        currency,
        tabs,
        googleDoc,
        seo,
        createdAt,
        updatedAt
      }`,
      { id: slug }
    )
  }
  
  return proposal
}

export async function getAllProposals() {
  return client.fetch(
    groq`*[_type == "proposal"]{
      _id,
      title,
      "slug": seo.slug,
      status,
      company->{
        name
      },
      createdAt
    }`
  )
}
