import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { client, groq } from '@/lib/sanity'
import ProposalContent from '@/components/ProposalContent'

interface ProposalPageProps {
  params: Promise<{ slug: string[] }>
}

// Site configuration - update with your actual domain
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://proposals.webstacks.com'

export async function generateMetadata({ params }: ProposalPageProps): Promise<Metadata> {
  const { slug } = await params
  const proposalSlug = slug?.[0] || ''
  
  // Fetch proposal SEO data
  const proposal = await client.fetch(groq`*[_type == "proposal" && seo.slug.current == $slug][0]{
    title,
    seo
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
  const index = !seo?.noIndex
  const follow = !seo?.noFollow

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
    tabs,
    googleDoc,
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
