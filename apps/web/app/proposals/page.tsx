import { getAllProposals } from '@/lib/sanity'
import Link from 'next/link'

interface ProposalListItem {
  _id: string
  title: string
  slug?: {
    current: string
  }
  status: 'draft' | 'active' | 'completed' | 'archived'
  company?: {
    name: string
  }
  createdAt?: string
}

export default async function ProposalsPage() {
  const proposals = await getAllProposals()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              All Proposals
            </h1>
            <p className="text-xl text-gray-600">
              Browse and access all proposals in the system.
            </p>
          </header>

          <main>
            {proposals && proposals.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {proposals.map((proposal: ProposalListItem) => (
                  <Link
                    key={proposal._id}
                    href={`/${proposal.slug?.current || proposal._id}`}
                    className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {proposal.title}
                    </h3>
                    {proposal.company && (
                      <p className="text-sm text-gray-600 mb-3">
                        {proposal.company.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        proposal.status === 'active' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        proposal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                      {proposal.createdAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No proposals found.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
