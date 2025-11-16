import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { client, groq } from '@/lib/sanity'
import ProposalContent from '@/components/ProposalContent'
import PasswordGate from '@/components/PasswordGate'
import { createHmac } from 'crypto'

interface ProposalPageProps {
  params: Promise<{ slug: string[] }>
}

// Site configuration - update with your actual domain
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://proposals.webstacks.com'

// Force dynamic so cookies can be read to protect content
export const dynamic = 'force-dynamic'

function getSecret(): string {
  const secret = process.env.PROPOSALS_PASSWORD_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Missing PROPOSALS_PASSWORD_SECRET or NEXTAUTH_SECRET')
  return secret
}

function signToken(slug: string, password: string): string {
  return createHmac('sha256', getSecret()).update(`${slug}:${password}`).digest('hex')
}

export async function generateMetadata({ params }: ProposalPageProps): Promise<Metadata> {
  const { slug } = await params
  const proposalSlug = slug?.[0] || ''
  
  // Fetch proposal SEO data
  const proposal = await client.fetch(groq`*[_type == "proposal" && seo.slug.current == $slug][0]{
    title,
    seo,
    passwords
  }`, { slug: proposalSlug })

  if (!proposal) {
    return {
      title: 'Proposal Not Found',
      description: 'The requested proposal could not be found',
    }
  }

  const seo = proposal.seo
  const title = seo?.pageTitle || proposal.title || 'Proposal'
  const description = seo?.pageDescription || ''
  const ogImage = seo?.openGraphImage?.asset?.url
  
  const url = `${SITE_URL}/${proposalSlug}`
  const isProtected = Array.isArray(proposal.passwords) && proposal.passwords.length > 0
  const index = isProtected ? false : !seo?.noIndex
  const follow = isProtected ? false : !seo?.noFollow

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    robots: {
      index,
      follow,
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
  }
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { slug } = await params
  
  // Extract proposal slug and tab slug from URL
  // URL format: /proposal-slug/tab-slug or just /proposal-slug
  const proposalSlug = slug?.[0] || ''
  const tabSlug = slug?.[1] || null
  
  // Fetch proposal with company data
  const proposal = await client.fetch(groq`*[_type == "proposal" && seo.slug.current == $slug][0]{
    _id,
    title,
    tabs[]{
      ...,
      content[]{
        ...,
        _type == "testimonialCard" => {
          ...,
          testimonial->{
            title,
            content,
            person->{
              firstName,
              lastName,
              role,
              headshot,
              company->{
                name
              }
            }
          }
        }
      }
    },
    googleDoc,
    calendarLink,
    passwords,
    preparedBy->{
      _id,
      firstName,
      lastName,
      role,
      headshot
    },
    company->{
      _id,
      name,
      logoOnLight,
      logoOnDark,
      logomarkOnLight,
      logomarkOnDark
    },
    seo
  }`, { slug: proposalSlug })
  
  if (!proposal) {
    notFound()
  }

  // Enforce password protection if configured
  const passwords: string[] = Array.isArray(proposal.passwords) ? proposal.passwords : []
  if (passwords.length > 0) {
    const cookieName = `proposal_auth_${proposalSlug}`
    const cookieStore = await cookies()
    const token = cookieStore.get(cookieName)?.value
    const valid = token ? passwords.some((p) => signToken(proposalSlug, p) === token) : false

    if (!valid) {
      return <PasswordGate slug={proposalSlug} />
    }
  }

  // Find active tab index based on tab slug or default to 0
  let activeTabIndex = 0
  if (tabSlug && proposal.tabs) {
    const foundTabIndex = proposal.tabs.findIndex((tab: { title?: string }) => 
      tab.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === tabSlug
    )
    if (foundTabIndex !== -1) {
      activeTabIndex = foundTabIndex
    }
  }

  return (
    <ProposalContent
      tabs={proposal.tabs || []}
      proposalSlug={proposalSlug}
      activeTabIndex={activeTabIndex}
      company={proposal.company}
      googleDocUrl={proposal.googleDoc}
      calendarLink={proposal.calendarLink}
      preparedBy={proposal.preparedBy}
    />
  )
}

export async function generateStaticParams() {
  // Fetch all proposals with their seo slugs and tabs
  const proposals = await client.fetch(groq`*[_type == "proposal"]{
    _id,
    "slug": seo.slug,
    tabs[]{
      title
    }
  }`)
  
  const params: { slug: string[] }[] = []
  
  proposals.forEach((proposal: { _id: string; slug?: { current: string }; tabs?: Array<{ title?: string }> }) => {
    const proposalSlug = proposal.slug?.current || proposal._id
    
    // Add main proposal route (shows first tab)
    params.push({ slug: [proposalSlug] })
    
    // Add routes for each tab
    if (proposal.tabs) {
      proposal.tabs.forEach((tab) => {
        if (tab.title) {
          const tabSlug = tab.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          params.push({ slug: [proposalSlug, tabSlug] })
        }
      })
    }
  })
  
  return params
}
