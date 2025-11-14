import { useState } from 'react'
import { useDocumentOperation } from 'sanity'
import { useToast } from '@sanity/ui'
import { DownloadIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'
import type { SanityClient } from '@sanity/client'

interface DocumentActionProps {
  id: string
  type: string
  published: Record<string, unknown> | null
  draft: Record<string, unknown> | null
  onComplete: () => void
}

interface BrandfetchLogo {
  type: string
  theme: string
  format: string
  src: string
}

interface BrandfetchResponse {
  name?: string
  domain?: string
  logos?: BrandfetchLogo[]
}

// Helper to extract domain from URL or use as-is
function extractDomain(input: string): string {
  if (!input) return ''
  
  // If it's already a domain (no protocol), return it
  if (!input.includes('://')) {
    return input.replace(/^www\./, '')
  }
  
  // Extract domain from URL
  try {
    const url = new URL(input)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return input.replace(/^www\./, '')
  }
}

// Upload image from URL to Sanity
async function uploadImageFromUrl(imageUrl: string, client: SanityClient) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  
  return client.assets.upload('image', blob, {
    filename: imageUrl.split('/').pop() || 'logo.png',
  })
}

export const FetchBrandAssetsAction: DocumentActionComponent = ({
  id,
  type,
  published,
  draft,
  onComplete,
}: DocumentActionProps) => {
  const [fetching, setFetching] = useState(false)
  const { patch } = useDocumentOperation(id, type)
  const toast = useToast()

  const handleFetch = async () => {
    setFetching(true)
    
    try {
      // Get website or name from the document
      const doc = (draft || published) as Record<string, unknown>
      const website = String(doc?.website || '')
      const companyName = String(doc?.name || '')
      
      if (!website && !companyName) {
        toast.push({
          status: 'warning',
          title: 'Missing Information',
          description: 'Please add a website URL or company name before fetching brand assets.',
        })
        setFetching(false)
        onComplete()
        return
      }

      // Extract domain from website or use company name
      const domain = website ? extractDomain(website) : companyName.toLowerCase().replace(/\s+/g, '')
      
      // Fetch from Brandfetch API
      const brandfetchUrl = `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`
      const response = await fetch(brandfetchUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.BRANDFETCH_API_KEY}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Brandfetch API returned ${response.status}`)
      }

      const data: BrandfetchResponse = await response.json()
      
      if (!data.logos || data.logos.length === 0) {
        toast.push({
          status: 'warning',
          title: 'No logos found',
          description: `Brandfetch couldn't find logos for ${domain}`,
        })
        setFetching(false)
        onComplete()
        return
      }

      // Find best logos for each variant
      const findLogo = (theme: 'light' | 'dark', format: 'png' | 'svg' = 'png') => {
        // Try to find exact match
        let logo = data.logos?.find(l => 
          l.theme === theme && 
          l.format === format &&
          l.type === 'logo'
        )
        
        // Fallback to any logo with matching theme
        if (!logo) {
          logo = data.logos?.find(l => l.theme === theme && l.type === 'logo')
        }
        
        return logo?.src
      }

      // Get the Sanity client from the document operation context
      // We'll need to import this properly
      const sanityClient = (await import('@sanity/client')).default
      const client = sanityClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || '',
        apiVersion: '2023-05-03',
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
      })

      // Upload logos to Sanity
      const patches: Record<string, { _type: string; asset: { _type: string; _ref: string } }> = {}
      let uploadCount = 0

      // Logo on light background
      const logoLight = findLogo('light')
      if (logoLight) {
        const asset = await uploadImageFromUrl(logoLight, client)
        patches.logoOnLight = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        }
        uploadCount++
      }

      // Logo on dark background
      const logoDark = findLogo('dark')
      if (logoDark) {
        const asset = await uploadImageFromUrl(logoDark, client)
        patches.logoOnDark = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        }
        uploadCount++
      }

      // Apply patches if we have any
      if (Object.keys(patches).length > 0) {
        patch.execute([{ set: patches }])
        
        toast.push({
          status: 'success',
          title: 'Brand assets fetched',
          description: `Successfully uploaded ${uploadCount} logo(s) from Brandfetch`,
        })
      } else {
        toast.push({
          status: 'warning',
          title: 'No suitable logos found',
          description: 'Brandfetch returned logos but none matched our requirements',
        })
      }
      
      onComplete()
    } catch (error: unknown) {
      console.error('Brandfetch error:', error)
      const err = error as Error
      
      toast.push({
        status: 'error',
        title: 'Failed to fetch brand assets',
        description: err.message || 'An error occurred while fetching from Brandfetch',
      })
    } finally {
      setFetching(false)
    }
  }

  return {
    label: fetching ? 'Fetching...' : 'Fetch Brand Assets',
    icon: DownloadIcon,
    onHandle: handleFetch,
    disabled: fetching,
    shortcut: undefined,
  }
}

export default FetchBrandAssetsAction
