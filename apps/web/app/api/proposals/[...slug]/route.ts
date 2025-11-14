import { NextRequest, NextResponse } from 'next/server'
import { client, groq } from '@/lib/sanity'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const slugString = slug?.join('/') || ''
    
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
      { slug: slugString }
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
        { id: slugString }
      )
    }
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    return NextResponse.json({ proposal })
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
