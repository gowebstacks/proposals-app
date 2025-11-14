import { useState } from 'react'
import { 
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'
import { useToast } from '@sanity/ui'
import { SyncIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'
import type { PortableTextBlock } from '../schemas/fields/canvas'

type SanityTableHeader = { text: string; alignment?: 'left' | 'center' | 'right' }
type SanityTableCell = { content: string }
type SanityTableRow = { cells: SanityTableCell[] }
type SanityTableNode = { _type: 'table'; caption?: string; headers: SanityTableHeader[]; rows: SanityTableRow[] }
type PTContent = PortableTextBlock | SanityTableNode

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
        link?: {
          url?: string
        }
      }
    }
  }>
  paragraphStyle?: {
    namedStyleType?: string
    headingId?: string
    alignment?: string
  }
  // Present when this paragraph is a list item
  bullet?: {
    listId?: string
    nestingLevel?: number
  }
}

function extractTextFromStructuralElements(elements?: GoogleDocsStructuralElement[]): string {
  if (!elements || elements.length === 0) return ''
  const parts: string[] = []
  for (const el of elements) {
    if (el.paragraph) {
      for (const pe of el.paragraph.elements) {
        if (pe.textRun?.content) {
          const cleaned = pe.textRun.content
            .replace(/\n/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
          if (cleaned) parts.push(cleaned)
        }
      }
    }
  }
  return parts.join(' ')
}

function firstParagraphAlignment(elements?: GoogleDocsStructuralElement[]): string | undefined {
  if (!elements) return undefined
  for (const el of elements) {
    if (el.paragraph?.paragraphStyle?.alignment) {
      return el.paragraph.paragraphStyle.alignment
    }
  }
  return undefined
}

function mapAlignment(alignment?: string): 'left' | 'center' | 'right' {
  switch (alignment) {
    case 'CENTER':
      return 'center'
    case 'END':
    case 'RIGHT':
      return 'right'
    default:
      return 'left'
  }
}

interface GoogleDocsStructuralElement {
  paragraph?: GoogleDocsParagraph
  table?: GoogleDocsTable
  sectionBreak?: unknown
}

interface GoogleDocsTableCell {
  content?: GoogleDocsStructuralElement[]
}

interface GoogleDocsTableRow {
  tableCells?: GoogleDocsTableCell[]
}

interface GoogleDocsTable {
  tableRows?: GoogleDocsTableRow[]
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
  // Optional list metadata mapping listId -> properties
  lists?: Record<string, {
    listProperties?: {
      nestingLevels?: Array<{
        glyphType?: string
      }>
    }
  }>
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

// Convert Google Docs named style to Portable Text style
function getPortableTextStyle(namedStyleType?: string): 'normal' | 'h1' | 'h2' | 'h3' {
  switch (namedStyleType) {
    case 'HEADING_1':
    case 'TITLE':
      return 'h1'
    case 'HEADING_2':
    case 'SUBTITLE':
      return 'h2'
    case 'HEADING_3':
      return 'h3'
    case 'HEADING_4':
    case 'HEADING_5':
    case 'HEADING_6':
      // Map lower headings to h3 since that's the maximum supported
      return 'h3'
    default:
      return 'normal'
  }
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
function convertToPortableText(doc: GoogleDocsDocument): { title: string; tabs: Array<{ title: string; content: PTContent[] }> } {
  console.log('=== CONVERT TO PORTABLE TEXT STARTED ===')
  console.log('Document structure:', JSON.stringify(doc, null, 2))
  
  // If tabs are present, use them (API with includeTabsContent=true)
  if (doc.tabs && doc.tabs.length > 0) {
    console.log('Processing tabs from Google Docs API, count:', doc.tabs.length)
    const flatTabs = flattenTabs(doc.tabs)
    console.log('Flattened tabs:', flatTabs.length)
    
    const sanityTabs: Array<{ title: string; content: PTContent[] }> = []
    for (const tab of flatTabs) {
      const title = tab.tabProperties?.title || 'Untitled Tab'
      console.log(`Processing tab: "${title}"`)
      console.log('Full tab structure:', JSON.stringify(tab, null, 2))
      
      const body = tab.documentTab?.body
      console.log('Tab body:', body)
      
      if (!body?.content) {
        console.log('No content in tab body, skipping')
        continue
      }
      
      console.log('Body content length:', body.content.length)
      
      const blocks: PTContent[] = []
      
      body.content.forEach((element, elementIndex) => {
        console.log(`Processing element ${elementIndex}:`, JSON.stringify(element, null, 2))
        
        if (element.paragraph) {
          const paragraph = element.paragraph
          console.log('Processing paragraph with elements:', paragraph.elements.length)
          console.log('Paragraph style:', paragraph.paragraphStyle)
          
          const children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
          const markDefs: Array<{ _key: string; _type: string; href?: string }> = []
          
          // Determine the block style based on Google Docs named style
          const blockStyle = getPortableTextStyle(paragraph.paragraphStyle?.namedStyleType)
          console.log(`Determined block style: ${blockStyle} from ${paragraph.paragraphStyle?.namedStyleType}`)
          
          paragraph.elements.forEach((el, index) => {
            console.log(`Element ${index}:`, JSON.stringify(el, null, 2))
            
            if (el.textRun?.content) {
              let textContent = el.textRun.content
              const textStyle = el.textRun.textStyle
              console.log(`Raw text content: "${textContent}"`)
              console.log(`Text style:`, textStyle)
              
              // Check if this element has formatting (marks)
              const hasFormatting = textStyle?.bold || textStyle?.italic || textStyle?.underline || textStyle?.link?.url
              
              // Clean up text content - be extremely careful about spaces around formatted text
              if (hasFormatting) {
                // For formatted text, ONLY remove excessive newlines
                // PRESERVE ALL spaces to maintain spacing around formatted words
                textContent = textContent
                  .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
                  .replace(/\n+$/, '') // Remove trailing newlines only
              } else {
                // For plain text, do not strip spaces; only normalize control chars and trailing newlines
                textContent = textContent
                  .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
                  .replace(/\n+$/, '') // Remove trailing newlines only
              }

              // Preserve common typographic characters: smart quotes, em/en dashes, etc.
              // Only remove control characters (except tab \t, newline \n, carriage return \r)
              // eslint-disable-next-line no-control-regex
              textContent = textContent.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

              // Convert remaining lone newlines inside a paragraph to single spaces
              // since we already create separate blocks per paragraph
              textContent = textContent.replace(/\n/g, ' ')
              
              // Preserve whitespace-only spans (e.g., the space between plain and bold runs)
              if (textContent === '') {
                console.log('Skipping empty text content after cleanup')
                return
              }
              if (/^\s+$/.test(textContent)) {
                // Collapse to a single space to avoid multiple adjacent whitespace spans
                textContent = ' '
              }
              
              console.log(`Cleaned text content: "${textContent}" (hasFormatting: ${hasFormatting})`)
              
              const marks: string[] = []
              
              // Generate mark key for links
              let markKey: string | undefined
              if (textStyle?.link?.url) {
                markKey = genKey()
                markDefs.push({
                  _key: markKey,
                  _type: 'link',
                  href: textStyle.link.url
                })
                marks.push(markKey)
                console.log(`Added link mark: ${markKey} -> ${textStyle.link.url}`)
              }
              
              // Add style marks
              if (textStyle?.bold) {
                marks.push('strong')
                console.log('Added bold mark')
              }
              if (textStyle?.italic) {
                marks.push('em')
                console.log('Added italic mark')
              }
              if (textStyle?.underline) {
                marks.push('underline')
                console.log('Added underline mark')
              }
              
              const span = {
                _type: 'span' as const,
                text: textContent,
                _key: genKey(),
                marks
              }
              console.log('Created span:', span)
              children.push(span)
            }
          })
          
          // Normalize adjacency: ensure a space between spans when neither side has boundary whitespace
          const normalizedChildren: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
          for (const ch of children) {
            const prev = normalizedChildren[normalizedChildren.length - 1]
            if (prev) {
              const prevEndsWithWs = /\s$/.test(prev.text)
              const currStartsWithWs = /^\s/.test(ch.text)
              if (!prevEndsWithWs && !currStartsWithWs) {
                // Append a space to previous text to ensure spacing between runs
                prev.text = prev.text + ' '
              }
            }
            normalizedChildren.push(ch)
          }

          // Only add block if there's actual content
          if (normalizedChildren.some(child => child.text.trim())) {
            const bullet = (paragraph as { bullet?: { listId?: string; nestingLevel?: number } }).bullet
            let listItem: 'bullet' | 'number' | undefined
            let level: number | undefined
            if (bullet) {
              const listId = bullet.listId
              const nestingLevel = typeof bullet.nestingLevel === 'number' ? bullet.nestingLevel : 0
              const glyphType = listId && doc.lists && doc.lists[listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType
              listItem = glyphType && /DECIMAL|ROMAN|ALPHA|NUMBER/i.test(String(glyphType)) ? 'number' : 'bullet'
              level = nestingLevel + 1
            }
            const block = {
              _type: 'block' as const,
              style: bullet ? 'normal' : blockStyle,
              _key: genKey(),
              markDefs,
              children: normalizedChildren,
              ...(listItem ? { listItem } : {}),
              ...(level ? { level } : {}),
            }
            console.log('Created block:', JSON.stringify(block, null, 2))
            blocks.push(block)
          }
        } else if (element.table) {
          const table = element.table
          const tableRows = table?.tableRows || []
          if (tableRows.length > 0) {
            const headerCells = tableRows[0]?.tableCells || []
            const headers: SanityTableHeader[] = headerCells.map((cell) => {
              const text = extractTextFromStructuralElements(cell.content)
              const align = mapAlignment(firstParagraphAlignment(cell.content))
              return { text, alignment: align }
            })
            const rows: SanityTableRow[] = tableRows.slice(1).map((row) => ({
              cells: (row.tableCells || []).map((cell) => ({ content: extractTextFromStructuralElements(cell.content) })),
            }))
            const tableNode: SanityTableNode = {
              _type: 'table',
              caption: undefined,
              headers,
              rows,
            }
            blocks.push(tableNode)
          }
        }
      })
      
      console.log(`Created ${blocks.length} blocks for tab "${title}"`)
      sanityTabs.push({ title, content: blocks })
    }
    console.log('Converted to Sanity tabs with formatting:', sanityTabs.length)
    console.log('=== CONVERT TO PORTABLE TEXT COMPLETED ===')
    return { title: doc.title || doc.documentId || 'Google Document', tabs: sanityTabs }
  }

  // Fallback: legacy parsing from doc.body (first tab only)
  console.log('No tabs found; falling back to legacy parsing')
  if (!doc.body?.content) {
    return { title: doc.title || doc.documentId || 'Google Document', tabs: [] }
  }
  
  const blocks: PTContent[] = []
  
  doc.body.content.forEach((element) => {
    if (element.paragraph) {
      const paragraph = element.paragraph
      console.log('Fallback: Processing paragraph with elements:', paragraph.elements.length)
      console.log('Fallback: Paragraph style:', paragraph.paragraphStyle)
      
      const children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
      const markDefs: Array<{ _key: string; _type: string; href?: string }> = []
      
      // Determine the block style based on Google Docs named style
      const blockStyle = getPortableTextStyle(paragraph.paragraphStyle?.namedStyleType)
      console.log(`Fallback: Determined block style: ${blockStyle} from ${paragraph.paragraphStyle?.namedStyleType}`)
      
      paragraph.elements.forEach((el, index) => {
        console.log(`Fallback element ${index}:`, JSON.stringify(el, null, 2))
        
        if (el.textRun?.content) {
          let textContent = el.textRun.content
          const textStyle = el.textRun.textStyle
          console.log(`Fallback raw text content: "${textContent}"`)
          console.log(`Fallback text style:`, textStyle)
          
          // Check if this element has formatting (marks)
          const hasFormatting = textStyle?.bold || textStyle?.italic || textStyle?.underline || textStyle?.link?.url
          
          // Clean up text content - be extremely careful about spaces around formatted text
          if (hasFormatting) {
            // For formatted text, ONLY remove excessive newlines
            // PRESERVE ALL spaces to maintain spacing around formatted words
            textContent = textContent
              .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
              .replace(/\n+$/, '') // Remove trailing newlines only
          } else {
            // For plain text, do not strip spaces; only normalize control chars and trailing newlines
            textContent = textContent
              .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
              .replace(/\n+$/, '') // Remove trailing newlines only
          }

          // Preserve typographic characters, only remove control chars
          // eslint-disable-next-line no-control-regex
          textContent = textContent.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

          // Convert remaining lone newlines inside a paragraph to single spaces
          textContent = textContent.replace(/\n/g, ' ')
          
          // Preserve whitespace-only spans
          if (textContent === '') {
            console.log('Fallback skipping empty text content after cleanup')
            return
          }
          if (/^\s+$/.test(textContent)) {
            textContent = ' '
          }
          
          console.log(`Fallback cleaned text content: "${textContent}" (hasFormatting: ${hasFormatting})`)
          
          const marks: string[] = []
          
          // Generate mark key for links
          let markKey: string | undefined
          if (textStyle?.link?.url) {
            markKey = genKey()
            markDefs.push({
              _key: markKey,
              _type: 'link',
              href: textStyle.link.url
            })
            marks.push(markKey)
            console.log(`Fallback added link mark: ${markKey} -> ${textStyle.link.url}`)
          }
          
          // Add style marks
          if (textStyle?.bold) {
            marks.push('strong')
            console.log('Fallback added bold mark')
          }
          if (textStyle?.italic) {
            marks.push('em')
            console.log('Fallback added italic mark')
          }
          if (textStyle?.underline) {
            marks.push('underline')
            console.log('Fallback added underline mark')
          }
          
          const span = {
            _type: 'span' as const,
            text: textContent,
            _key: genKey(),
            marks
          }
          console.log('Fallback created span:', span)
          children.push(span)
        }
      })
      
      // Normalize adjacency in fallback as well
      const normalizedChildren: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
      for (const ch of children) {
        const prev = normalizedChildren[normalizedChildren.length - 1]
        if (prev) {
          const prevEndsWithWs = /\s$/.test(prev.text)
          const currStartsWithWs = /^\s/.test(ch.text)
          if (!prevEndsWithWs && !currStartsWithWs) {
            prev.text = prev.text + ' '
          }
        }
        normalizedChildren.push(ch)
      }

      // Only add block if there's actual content
      if (normalizedChildren.some(child => child.text.trim())) {
        const bullet = (paragraph as { bullet?: { listId?: string; nestingLevel?: number } }).bullet
        let listItem: 'bullet' | 'number' | undefined
        let level: number | undefined
        if (bullet) {
          const listId = bullet.listId
          const nestingLevel = typeof bullet.nestingLevel === 'number' ? bullet.nestingLevel : 0
          const glyphType = listId && doc.lists && doc.lists[listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType
          listItem = glyphType && /DECIMAL|ROMAN|ALPHA|NUMBER/i.test(String(glyphType)) ? 'number' : 'bullet'
          level = nestingLevel + 1
        }
        const block = {
          _type: 'block' as const,
          style: bullet ? 'normal' : blockStyle,
          _key: genKey(),
          markDefs,
          children: normalizedChildren,
          ...(listItem ? { listItem } : {}),
          ...(level ? { level } : {}),
        }
        console.log('Fallback created block:', JSON.stringify(block, null, 2))
        blocks.push(block)
      }
    } else if (element.table) {
      const table = element.table
      const tableRows = table?.tableRows || []
      if (tableRows.length > 0) {
        const headerCells = tableRows[0]?.tableCells || []
        const headers: SanityTableHeader[] = headerCells.map((cell) => {
          const text = extractTextFromStructuralElements(cell.content)
          const align = mapAlignment(firstParagraphAlignment(cell.content))
          return { text, alignment: align }
        })
        const rows: SanityTableRow[] = tableRows.slice(1).map((row) => ({
          cells: (row.tableCells || []).map((cell) => ({ content: extractTextFromStructuralElements(cell.content) })),
        }))
        const tableNode: SanityTableNode = {
          _type: 'table',
          caption: undefined,
          headers,
          rows,
        }
        blocks.push(tableNode)
      }
    }
  })
  
  return { 
    title: doc.title || doc.documentId || 'Google Document', 
    tabs: [{ title: 'Content', content: blocks }] 
  }
}

// Convert plain text to portable text with tab splitting
function convertPlainTextToPortableText(docId: string, text: string): { title: string; tabs: Array<{ title: string; content: PTContent[] }> } {
  const lines = text.split('\n').filter(line => line.trim())
  const tabs: Array<{ title: string; content: PTContent[] }> = []
  let currentTab: { title: string; content: PTContent[] } | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check for section delimiter: --- Section Name ---
    const sectionMatch = trimmed.match(/^[—-]{3,}\s*(.+?)\s*[—-]{3,}$/)
    
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
    const blocks: PTContent[] = lines.map(line => ({
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
async function parseGoogleDoc(googleDocUrl: string): Promise<{ title: string; tabs: Array<{ title: string; content: PTContent[] }> }> {
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

  console.log('🔥 SYNC ACTION LOADED - NEW VERSION')

  const handleSync = async () => {
    console.log('🚀 SYNC STARTED - NEW VERSION')
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
      const canvasTabs = parsed.tabs.map((tab: { title?: string; content?: PTContent[] }, index: number) => ({
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
