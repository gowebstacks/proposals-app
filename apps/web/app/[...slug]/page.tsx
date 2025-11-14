import { notFound } from 'next/navigation'
import { getProposalBySlug, client, groq } from '@/lib/sanity'
import ProposalContent from '@/components/ProposalContent'

interface ProposalPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { slug } = await params
  const slugString = slug?.join('/') || ''
  
  const proposal = await getProposalBySlug(slugString)
  
  if (!proposal) {
    notFound()
  }

  return (
    <ProposalContent
      tabs={proposal.tabs || []}
    />
  )
}

export async function generateStaticParams() {
  // Fetch all proposals with their seo slugs
  const proposals = await client.fetch(groq`*[_type == "proposal"]{
    _id,
    "slug": seo.slug
  }`)
  
  return proposals.map((proposal: { _id: string; slug?: { current: string } }) => ({
    slug: proposal.slug?.current ? proposal.slug.current.split('/') : [proposal._id],
  }))
}
