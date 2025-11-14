import { useState } from 'react'
import { 
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'
import { useToast } from '@sanity/ui'
import { SyncIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'
import type { PortableTextBlock } from '../schemas/fields/canvas'

interface DocumentActionProps {
  id: string
  type: string
  published: Record<string, unknown> | null
  draft: Record<string, unknown> | null
  onComplete: () => void
}

// Google Docs API interfaces
interface GoogleDocsParagraph {
  elements: Array<{
    textRun?: {
      content: string
      textStyle?: {
        bold?: boolean
        italic?: boolean
        underline?: boolean
      }
    }
  }>
}

interface GoogleDocsStructuralElement {
  paragraph?: GoogleDocsParagraph
  table?: unknown
  sectionBreak?: unknown
}

interface GoogleDocsDocumentTab {
  body?: {
    content?: GoogleDocsStructuralElement[]
  }
}

interface GoogleDocsTabProperties {
  tabId?: string
  title?: string
  index?: number
}

interface GoogleDocsTab {
  tabProperties?: GoogleDocsTabProperties
  documentTab?: GoogleDocsDocumentTab
  childTabs?: GoogleDocsTab[]
}

interface GoogleDocsDocument {
  documentId?: string
  title: string
  body?: {
    content?: GoogleDocsStructuralElement[]
  }
  tabs?: GoogleDocsTab[]
}

// Extract document ID from Google Doc URL or a raw ID value
function extractDocId(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  // If user pasted just the ID
  if (/^[a-zA-Z0-9-_]{10,}$/.test(trimmed)) return trimmed
  // Try URL patterns
  try {
    const u = new URL(trimmed)
    const m = u.pathname.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/)
    if (m?.[1]) return m[1]
    const qpId = u.searchParams.get('id')
    if (qpId) return qpId
  } catch (_err) {
    // not a URL; fall through
  }
  return null
}

// Simple unique key generator for portable text nodes
function genKey(): string {
  // Prefer crypto if available
  const anyCrypto = (typeof crypto !== 'undefined' ? (crypto as unknown as { randomUUID?: () => string }) : undefined)
  if (anyCrypto?.randomUUID) {
    // randomUUID is longer; slice to keep keys compact
    return anyCrypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 14)
}

// Prefer our API route: returns JSON or 401 oauth_required
async function fetchViaApiRoute(docId: string): Promise<
  | { kind: 'json'; doc: GoogleDocsDocument }
  | { kind: 'text'; text: string }
  | { kind: 'oauth_required' }
> {
  const base = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_STUDIO_URL || ''
  const url = `${base}/api/gdoc/${encodeURIComponent(docId)}?id=${encodeURIComponent(docId)}`
  const res = await fetch(url, { credentials: 'include' })
  if (res.status === 401) {
    // try to inspect error body
    try {
      const j = await res.json()
      if (j?.error === 'oauth_required') {
        return { kind: 'oauth_required' }
      }
    } catch (_err) {
      void 0
    }
    return { kind: 'oauth_required' }
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}${msg ? ` - ${msg}` : ''}`)
  }
  const ctype = res.headers.get('content-type') || ''
  if (ctype.includes('application/json')) {
    const doc = await res.json()
    return { kind: 'json', doc }
  }
  const text = await res.text()
  return { kind: 'text', text }
}

// Start OAuth in a new tab and poll status endpoint until authorized
async function ensureOAuth(): Promise<void> {
  const base = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_STUDIO_URL || ''
  const authUrl = `${base}/api/google/oauth/authorize`
  const statusUrl = `${base}/api/google/oauth/status`

  if (typeof window === 'undefined') throw new Error('OAuth requires a browser environment')

  const tab = window.open(authUrl, '_blank')
  if (!tab) throw new Error('Could not open authentication tab. Please allow popups/tabs for this site.')

  // poll for up to 2 minutes
  const start = Date.now()
  while (true) {
    if (Date.now() - start > 120_000) {
      throw new Error('Authentication timed out. Please try again.')
    }
    try {
      const r = await fetch(statusUrl, { credentials: 'include', cache: 'no-store' })
      if (r.ok) {
        const j = (await r.json()) as { authorized?: boolean }
        if (j?.authorized) {
          return
        }
      }
    } catch (_err) {
      void 0
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

// Flatten tab hierarchy (breadth-first order to match Docs UI)
function flattenTabs(tabs: GoogleDocsTab[]): GoogleDocsTab[] {
  const result: GoogleDocsTab[] = []
  const queue = [...tabs]
  while (queue.length) {
    const tab = queue.shift()!
    result.push(tab)
    if (tab.childTabs) {
      queue.push(...tab.childTabs)
    }
  }
  return result
}

// Convert Google Docs content to portable text format
function convertToPortableText(doc: GoogleDocsDocument): { title: string; tabs: Array<{ title: string; content: PortableTextBlock[] }> } {
  // If tabs are present, use them (API with includeTabsContent=true)
  if (doc.tabs && doc.tabs.length > 0) {
    console.log('Processing tabs from Google Docs API, count:', doc.tabs.length)
    const flatTabs = flattenTabs(doc.tabs)
    const sanityTabs: Array<{ title: string; content: PortableTextBlock[] }> = []
    for (const tab of flatTabs) {
      const title = tab.tabProperties?.title || 'Untitled Tab'
      const body = tab.documentTab?.body
      if (!body?.content) continue
      const lines: string[] = []
      body.content.forEach((element) => {
        if (element.paragraph) {
          const paragraph = element.paragraph
          const text = paragraph.elements
            .map((el: { textRun?: { content?: string } }) => el.textRun?.content || '')
            .join('')
            .trim()
          if (text) lines.push(text)
        }
      })
      const blocks: PortableTextBlock[] = lines.map(line => ({
        _type: 'block',
        style: 'normal',
        _key: genKey(),
        markDefs: [],
        children: [{ _type: 'span', text: line, _key: genKey(), marks: [] }],
      }))
      sanityTabs.push({ title, content: blocks })
    }
    console.log('Converted to Sanity tabs:', sanityTabs.length)
    return { title: doc.title || doc.documentId || 'Google Document', tabs: sanityTabs }
  }

  // Fallback: legacy parsing from doc.body (first tab only)
  console.log('No tabs found; falling back to legacy parsing')
  if (!doc.body?.content) {
    return { title: doc.title || doc.documentId || 'Google Document', tabs: [] }
  }
  const lines: string[] = []
  doc.body.content.forEach((element) => {
    if (element.paragraph) {
      const paragraph = element.paragraph
      const text = paragraph.elements
        .map((el: { textRun?: { content?: string } }) => el.textRun?.content || '')
        .join('')
        .trim()
      if (text) lines.push(text)
    }
  })
  const merged = lines.join('\n')
  return convertPlainTextToPortableText(doc.title || doc.documentId || 'Google Document', merged)
}

// Convert plain text to portable text with tab splitting
function convertPlainTextToPortableText(docId: string, text: string): { title: string; tabs: Array<{ title: string; content: PortableTextBlock[] }> } {
  const lines = text.split('\n').filter(line => line.trim())
  const tabs: Array<{ title: string; content: PortableTextBlock[] }> = []
  let currentTab: { title: string; content: PortableTextBlock[] } | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check for section delimiter: --- Section Name ---
    const sectionMatch = trimmed.match(/^[\-—]{3,}\s*(.+?)\s*[\-—]{3,}$/)
    
    if (sectionMatch) {
      // Save previous tab if exists
      if (currentTab && currentTab.content.length > 0) {
        tabs.push(currentTab)
      }
      
      // Start new tab with extracted title
      const sectionTitle = sectionMatch[1]?.trim() || 'Untitled Section'
      currentTab = {
        title: sectionTitle,
        content: []
      }
      // Skip adding the delimiter line to content
    } else if (trimmed) {
      // Add content to current tab
      if (!currentTab) {
        // If no tab started yet, create a default one
        currentTab = {
          title: 'Content',
          content: []
        }
      }
      
      currentTab.content.push({
        _type: 'block',
        style: 'normal',
        _key: genKey(),
        markDefs: [],
        children: [{ _type: 'span', text: trimmed, _key: genKey(), marks: [] }],
      })
    }
  }
  
  // Add the last tab
  if (currentTab && currentTab.content.length > 0) {
    tabs.push(currentTab)
  }
  
  // If no tabs were created, create one with all content
  if (tabs.length === 0) {
    const blocks: PortableTextBlock[] = lines.map(line => ({
      _type: 'block',
      style: 'normal',
      _key: genKey(),
      markDefs: [],
      children: [{ _type: 'span', text: line.trim(), _key: genKey(), marks: [] }],
    }))
    return { title: docId, tabs: [{ title: 'Content', content: blocks }] }
  }
  
  return { title: docId, tabs }
}

// Main parsing function
async function parseGoogleDoc(googleDocUrl: string): Promise<{ title: string; tabs: Array<{ title: string; content: PortableTextBlock[] }> }> {
  try {
    // Extract document ID from URL
    const docId = extractDocId(googleDocUrl)
    if (!docId) {
      throw new Error('Invalid Google Doc URL format')
    }
    
    // First attempt
    let result = await fetchViaApiRoute(docId)
    if (result.kind === 'oauth_required') {
      // trigger auth and retry once
      await ensureOAuth()
      result = await fetchViaApiRoute(docId)
      if (result.kind === 'oauth_required') {
        throw new Error('Authentication failed. Please try again.')
      }
    }

    if (result.kind === 'json') {
      return convertToPortableText(result.doc)
    }
    return convertPlainTextToPortableText(docId, result.text)
  } catch (error) {
    console.error('Error parsing Google Doc:', error)
    throw error
  }
}

export const SyncWithGoogleDocAction: DocumentActionComponent = ({
  id,
  type,
  published,
  draft,
  onComplete,
}: DocumentActionProps) => {
  const [syncing, setSyncing] = useState(false)
  const { patch } = useDocumentOperation(id, type)
  const [permissions] = useDocumentPairPermissions({ id, type, permission: 'update' })
  const toast = useToast()

  const handleSync = async () => {
    setSyncing(true)
    
    try {
      const googleDocUrl = String((draft as Record<string, unknown> | null)?.googleDoc ?? (published as Record<string, unknown> | null)?.googleDoc ?? '').trim()
      if (!googleDocUrl) {
        toast.push({
          status: 'warning',
          title: 'No Google Doc URL',
          description: 'Please add a Google Doc URL before syncing.',
        })
        setSyncing(false)
        onComplete()
        return
      }

      const parsed = await parseGoogleDoc(googleDocUrl)
      console.log('Parsed Google Doc tabs:', parsed.tabs.length, parsed.tabs.map(t => t.title))
      
      // Create canvas tabs from parsed content
      const canvasTabs = parsed.tabs.map((tab: { title?: string; content?: PortableTextBlock[] }, index: number) => ({
        _key: `tab_${index}_${genKey()}`,
        _type: 'canvas' as const,
        title: tab.title || 'Untitled',
        content: tab.content || [],
      }))
      console.log('Created Sanity canvas tabs:', canvasTabs.length)

      // Patch the document with the new tabs
      patch.execute([
        {
          set: {
            tabs: canvasTabs,
          },
        },
      ])

      toast.push({
        status: 'success',
        title: 'Synced successfully',
        description: `Created ${canvasTabs.length} tab(s) from Google Doc.`,
      })
      
      onComplete()
    } catch (error: unknown) {
      console.error('Sync error:', error)
      const err = error as Error
      
      toast.push({
        status: 'error',
        title: 'Sync failed',
        description: err.message || 'Failed to sync Google Doc',
      })
    } finally {
      setSyncing(false)
    }
  }

  return {
    label: syncing ? 'Syncing...' : 'Sync with Google Doc',
    icon: SyncIcon,
    onHandle: handleSync,
    disabled: syncing || !permissions?.granted,
    shortcut: undefined,
  }
}

export default SyncWithGoogleDocAction
