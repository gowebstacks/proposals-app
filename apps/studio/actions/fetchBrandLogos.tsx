import React, { useState } from 'react'
import { useDocumentOperation, useClient } from 'sanity'
import { useToast, Stack, Text, Card, Button, Spinner, Box, Grid, Select, Flex, Label, Avatar, Badge } from '@sanity/ui'
import { SearchIcon, CheckmarkIcon } from '@sanity/icons'
import type { DocumentActionComponent, SanityClient } from 'sanity'

interface DocumentActionProps {
  id: string
  type: string
  published: Record<string, unknown> | null
  draft: Record<string, unknown> | null
  onComplete: () => void
}

interface BrandFetchFormat {
  src: string
  background: string
  format: string
  height: number | null
  width: number | null
  size: number
}

interface BrandFetchLogo {
  type: string
  theme: string
  formats: BrandFetchFormat[]
  tags: string[]
}

interface BrandFetchResponse {
  name: string
  domain: string
  logos: BrandFetchLogo[]
}

// Extract domain from website URL
function extractDomain(url: string): string | null {
  if (!url) return null
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Get the best URL from a logo's formats (prefer SVG, then PNG)
function getBestLogoUrl(logo: BrandFetchLogo): string | null {
  if (!logo.formats || logo.formats.length === 0) return null
  
  // Prefer SVG format first
  const svgFormat = logo.formats.find(f => f.format === 'svg')
  if (svgFormat) return svgFormat.src
  
  // Then PNG
  const pngFormat = logo.formats.find(f => f.format === 'png')
  if (pngFormat) return pngFormat.src
  
  // Fall back to first available format
  return logo.formats[0]?.src || null
}

// Get the best format name from a logo's formats
function getBestLogoFormat(logo: BrandFetchLogo): string {
  if (!logo.formats || logo.formats.length === 0) return 'Unknown format'
  
  const svgFormat = logo.formats.find(f => f.format === 'svg')
  if (svgFormat) return svgFormat.format.toUpperCase()
  
  const pngFormat = logo.formats.find(f => f.format === 'png')
  if (pngFormat) return pngFormat.format.toUpperCase()
  
  return logo.formats[0]?.format?.toUpperCase() || 'Unknown format'
}

// Upload image from URL to Sanity
async function uploadImageFromUrl(
  imageUrl: string,
  client: SanityClient
): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } }> {
  if (!imageUrl) {
    throw new Error('Image URL is undefined')
  }

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  
  const blob = await response.blob()
  
  // Generate a safe filename from the URL
  const urlParts = imageUrl.split('/')
  const filename = urlParts[urlParts.length - 1] || 'logo.png'
  
  const asset = await client.assets.upload('image', blob, {
    filename: filename.includes('.') ? filename : `${filename}.png`,
  })
  
  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

export const FetchBrandLogosAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { id, published, draft, onComplete } = props
  const { patch } = useDocumentOperation(id, 'company')
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'fetching' | 'mapping' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [availableLogos, setAvailableLogos] = useState<BrandFetchLogo[]>([])
  const [logoMappings, setLogoMappings] = useState<{
    logoOnLight?: BrandFetchLogo
    logoOnDark?: BrandFetchLogo
    logomarkOnLight?: BrandFetchLogo
    logomarkOnDark?: BrandFetchLogo
  }>({})
  const [selectedLogo, setSelectedLogo] = useState<BrandFetchLogo | null>(null)

  const doc = draft || published
  const website = doc?.website as string | undefined
  const domain = website ? extractDomain(website) : null

  const handleFetch = async () => {
    if (!website) {
      setErrorMessage('No website URL provided')
      setFetchStatus('error')
      return
    }

    setIsLoading(true)
    setFetchStatus('fetching')
    setUploadedCount(0)
    setErrorMessage('')
      
    try {
      if (!domain) {
        throw new Error('Invalid website URL')
      }

      // Fetch from BrandFetch API
      const brandfetchApiKey = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY
      if (!brandfetchApiKey) {
        throw new Error('BrandFetch API key not configured')
      }

      const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: {
          'Authorization': `Bearer ${brandfetchApiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`BrandFetch API error: ${response.status}`)
      }

      const data: BrandFetchResponse = await response.json()
      
      console.log('Full BrandFetch API response:', JSON.stringify(data, null, 2))
      
      if (!data.logos || data.logos.length === 0) {
        setErrorMessage(`No logos found for ${domain}`)
        setFetchStatus('error')
        setIsLoading(false)
        return
      }

      // Debug each logo
      data.logos.forEach((logo, index) => {
        const bestUrl = getBestLogoUrl(logo)
        const bestFormat = getBestLogoFormat(logo)
        console.log(`Logo ${index}:`, {
          type: logo.type,
          theme: logo.theme,
          formats: logo.formats.map(f => ({ format: f.format, src: f.src })),
          bestUrl,
          bestFormat,
          hasUrl: !!bestUrl,
          urlLength: bestUrl?.length || 0
        })
      })

      // Store available logos and show mapping interface
      setAvailableLogos(data.logos)
      setFetchStatus('mapping')
      
      // Reset mappings and selection for fresh start
      setLogoMappings({})
      setSelectedLogo(null)
    } catch (error) {
      console.error('Error fetching brand logos:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      setFetchStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadMappings = async () => {
    setIsLoading(true)
    setFetchStatus('uploading')
    setUploadedCount(0)
    setErrorMessage('')

    try {
      const updates: Record<string, { _type: 'image'; asset: { _type: 'reference'; _ref: string } }> = {}
      let count = 0

      // Upload each mapped logo
      for (const [fieldName, logo] of Object.entries(logoMappings)) {
        if (logo) {
          const logoUrl = getBestLogoUrl(logo)
          if (logoUrl) {
            updates[fieldName] = await uploadImageFromUrl(logoUrl, client)
            count++
            setUploadedCount(count)
          }
        }
      }

      // Patch the document with uploaded images
      if (Object.keys(updates).length > 0) {
        patch.execute([{ set: updates }])
        setFetchStatus('success')
        setUploadedCount(Object.keys(updates).length)
      } else {
        setErrorMessage('No logos selected for upload')
        setFetchStatus('error')
      }
    } catch (error) {
      console.error('Error uploading logos:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      setFetchStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoClick = (logo: BrandFetchLogo) => {
    setSelectedLogo(logo)
  }

  const handleFieldClick = (fieldName: keyof typeof logoMappings) => {
    if (selectedLogo) {
      setLogoMappings(prev => ({
        ...prev,
        [fieldName]: selectedLogo
      }))
      setSelectedLogo(null) // Clear selection after mapping
    }
  }

  return {
    label: 'Fetch Brand Logos',
    icon: SearchIcon,
    disabled: !website,
    onHandle: () => {
      setDialogOpen(true)
      setFetchStatus('idle')
      setUploadedCount(0)
      setErrorMessage('')
    },
    dialog: dialogOpen && {
      type: 'dialog',
      onClose: () => {
        setDialogOpen(false)
        if (fetchStatus === 'success') {
          onComplete()
        }
      },
      header: 'Fetch Brand Logos',
      content: (
        <Stack space={4}>
          {fetchStatus === 'idle' && (
            <Stack space={4}>
              <Stack space={3}>
                <Text size={1} muted>
                  This will fetch brand logos from BrandFetch for:
                </Text>
                <Card padding={3} tone="primary" border>
                  <Text size={1} weight="medium">{domain}</Text>
                </Card>
              </Stack>
              
              <Text size={1} muted>
                The action will fetch and upload logo variants for light/dark backgrounds.
              </Text>
              
              <Button
                text="Fetch Logos"
                tone="primary"
                onClick={handleFetch}
                disabled={isLoading}
              />
            </Stack>
          )}
            
            {fetchStatus === 'fetching' && (
              <Flex direction="column" align="center" gap={3}>
                <Spinner muted />
                <Text size={1} muted>Fetching logos from BrandFetch...</Text>
              </Flex>
            )}

            {fetchStatus === 'mapping' && (
              <Stack space={4}>
                <Text size={1} muted>
                  Found {availableLogos.length} logo(s) - Map them to your document fields:
                </Text>
                
                <Grid columns={2} gap={4}>
                  {/* Available Logos */}
                  <Stack space={3}>
                    <Label size={1}>Available Logos</Label>
                    <Stack space={3}>
                      {availableLogos.map((logo, index) => (
                        <Card 
                          key={index} 
                          tone={selectedLogo === logo ? "primary" : "transparent"} 
                          border 
                          padding={3}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleLogoClick(logo)}
                        >
                          <Stack space={3}>
                            <Box 
                              style={{ 
                                height: '160px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#f1f3f4',
                                borderRadius: '4px',
                                padding: '24px'
                              }}
                            >
                              <img 
                                src={getBestLogoUrl(logo) || ''} 
                                alt={`${logo.type} ${logo.theme}`}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '100%', 
                                  objectFit: 'contain'
                                }}
                              />
                            </Box>
                            <Flex justify="space-between" align="center">
                              <Text size={1} weight="medium">
                                {logo.type === 'logo' ? 'Logo' : 'Icon'}
                              </Text>
                              <Text size={0} muted>
                                {getBestLogoFormat(logo)}
                              </Text>
                            </Flex>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Stack>

                  {/* Field Mappings */}
                  <Stack space={3}>
                    <Label size={1}>Document Fields</Label>
                    <Stack space={3}>
                      {[
                        { 
                          key: 'logoOnLight', 
                          title: 'Logo on Light Background',
                          description: 'Full company logo for use on light backgrounds'
                        },
                        { 
                          key: 'logoOnDark', 
                          title: 'Logo on Dark Background',
                          description: 'Full company logo for use on dark backgrounds'
                        },
                        { 
                          key: 'logomarkOnLight', 
                          title: 'Logomark on Light Background',
                          description: 'Company icon/symbol for use on light backgrounds'
                        },
                        { 
                          key: 'logomarkOnDark', 
                          title: 'Logomark on Dark Background',
                          description: 'Company icon/symbol for use on dark backgrounds'
                        }
                      ].map(({ key, title, description }) => (
                        <Stack key={key} space={2}>
                          <Stack space={1}>
                            <Label size={0}>{title}</Label>
                            <Text size={0} muted>{description}</Text>
                          </Stack>
                          <Card 
                            tone={selectedLogo ? "primary" : "transparent"} 
                            border 
                            padding={3}
                            style={{ 
                              cursor: selectedLogo ? 'pointer' : 'default',
                              opacity: selectedLogo ? 1 : 0.7
                            }}
                            onClick={() => handleFieldClick(key as keyof typeof logoMappings)}
                          >
                            {logoMappings[key as keyof typeof logoMappings] ? (
                              <Stack space={3}>
                                <Box 
                                  style={{ 
                                    height: '160px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    backgroundColor: '#f1f3f4',
                                    borderRadius: '4px',
                                    padding: '24px'
                                  }}
                                >
                                  <img 
                                    src={getBestLogoUrl(logoMappings[key as keyof typeof logoMappings]!) || ''} 
                                    alt="Selected logo"
                                    style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '100%', 
                                      objectFit: 'contain'
                                    }}
                                  />
                                </Box>
                                <Flex justify="space-between" align="center">
                                  <Text size={1} weight="medium">
                                    {logoMappings[key as keyof typeof logoMappings]!.type === 'logo' ? 'Logo' : 'Icon'}
                                  </Text>
                                  <Text size={0} muted>
                                    {getBestLogoFormat(logoMappings[key as keyof typeof logoMappings]!)}
                                  </Text>
                                </Flex>
                              </Stack>
                            ) : (
                              <Box 
                                style={{ 
                                  height: '160px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  backgroundColor: '#f9f9f9',
                                  borderRadius: '4px',
                                  border: '2px dashed #ccc'
                                }}
                              >
                                <Text size={1} muted>
                                  {selectedLogo ? 'Click to assign logo' : 'Select a logo first'}
                                </Text>
                              </Box>
                            )}
                          </Card>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Grid>

                <Flex gap={2} justify="flex-end">
                  <Button
                    text="Cancel"
                    mode="ghost"
                    onClick={() => setDialogOpen(false)}
                  />
                  <Button
                    text="Upload Selected Logos"
                    tone="primary"
                    onClick={handleUploadMappings}
                    disabled={Object.values(logoMappings).every(logo => !logo)}
                  />
                </Flex>
              </Stack>
            )}
            
            {fetchStatus === 'uploading' && (
              <Flex direction="column" align="center" gap={3}>
                <Spinner muted />
                <Text size={1} muted>Uploading logos to Sanity...</Text>
                <Badge tone="primary">{uploadedCount} logo(s) uploaded</Badge>
              </Flex>
            )}
            
            {fetchStatus === 'success' && (
              <Stack space={4}>
                <Card tone="positive" border>
                  <Flex align="center" gap={3}>
                    <CheckmarkIcon />
                    <Text size={1} weight="medium">
                      Successfully uploaded {uploadedCount} logo variant(s)
                    </Text>
                  </Flex>
                </Card>
                <Button
                  text="Close"
                  tone="primary"
                  onClick={() => {
                    setDialogOpen(false)
                    onComplete()
                  }}
                />
              </Stack>
            )}
            
            {fetchStatus === 'error' && (
              <Stack space={4}>
                <Card tone="critical" border>
                  <Text size={1}>{errorMessage}</Text>
                </Card>
                <Button
                  text="Close"
                  mode="ghost"
                  onClick={() => setDialogOpen(false)}
                />
              </Stack>
            )}
        </Stack>
      ),
    },
  }
}
