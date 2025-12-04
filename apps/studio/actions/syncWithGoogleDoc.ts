import { useState } from 'react'
import { 
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'
import { useToast } from '@sanity/ui'
import { SyncIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'
import type { PortableTextBlock } from '../schemas/fields/canvas'

type SanityTableHeader = { _key: string; text: string; alignment?: 'left' | 'center' | 'right' }

function removeControlChars(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      out += s[i]
    }
  }
  return out
}
type SanityTableCell = { _key: string; content: PortableTextBlock[] }
type SanityTableRow = { _key: string; cells: SanityTableCell[] }
type SanityTableNode = { _type: 'table'; _key: string; caption?: string; headers: SanityTableHeader[]; rows: SanityTableRow[] }

// Pricing table types
type PricingTableOption = {
  _key: string
  name: string
  description?: string
  price: {
    type: 'single' | 'range' | 'starting_from' | 'custom'
    amount?: number
    maxAmount?: number
    customText?: string
    currency: 'USD' | 'EUR' | 'GBP'
    period: 'mo' | 'yr' | 'once' | 'custom'
    customPeriod?: string
  }
  badge?: {
    text?: string
  }
  highlights?: Array<{
    _key: string
    text: string
    icon: 'check' | 'lightning' | 'rocket' | 'chart' | 'lock' | 'star'
  }>
}

type PricingTableNode = {
  _type: 'pricingTable'
  _key: string
  options: PricingTableOption[]
}

// Callout module types
type CalloutNode = {
  _type: 'callout'
  _key: string
  title?: string
  content?: PortableTextBlock[]
  variant?: 'info' | 'warning' | 'success' | 'error'
}

// Scope table types
type ScopeTableOptionAvailability = {
  _key: string
  optionIndex: number
  included: 'included' | 'limited' | 'not_included' | 'custom'
  customText?: string
}

type ScopeTableItem = {
  _key: string
  item: string
  description?: string
  tooltip?: string
  optionAvailability: ScopeTableOptionAvailability[]
}

type ScopeTableGroup = {
  _key: string
  groupName: string
  items: ScopeTableItem[]
}

type ScopeTableNode = {
  _type: 'scopeTable'
  _key: string
  options: string[]
  scopeGroups: ScopeTableGroup[]
}

// Gantt chart types
type GanttChartTask = {
  _key: string
  name: string
  startDate: string
  endDate: string
  progress?: number
  dependencies?: string
}

type GanttChartNode = {
  _type: 'ganttChart'
  _key: string
  title?: string
  tasks: GanttChartTask[]
  viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year'
  showWeekends?: boolean
  showProgress?: boolean
}

type PTContent = PortableTextBlock | SanityTableNode | PricingTableNode | CalloutNode | ScopeTableNode | GanttChartNode

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
          let cleaned = pe.textRun.content
          cleaned = cleaned.replace(/\n/g, ' ')
          cleaned = cleaned.replace(/\u00A0/g, ' ')
          cleaned = removeControlChars(cleaned)
          cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
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

// Extract portable text from structural elements for table cells
function extractPortableTextFromStructuralElements(elements?: GoogleDocsStructuralElement[], doc?: GoogleDocsDocument): { blocks: Array<{ _type: 'block'; style: 'normal' | 'h1' | 'h2' | 'h3'; _key: string; markDefs: Array<{ _key: string; _type: string; href?: string }>; children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }>; listItem?: 'bullet' | 'number'; level?: number }> } {
  if (!elements || elements.length === 0) {
    return { blocks: [] }
  }
  
  const blocks: Array<{ _type: 'block'; style: 'normal' | 'h1' | 'h2' | 'h3'; _key: string; markDefs: Array<{ _key: string; _type: string; href?: string }>; children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }>; listItem?: 'bullet' | 'number'; level?: number }> = []
  
  for (const el of elements) {
    if (el.paragraph) {
      const children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
      const markDefs: Array<{ _key: string; _type: string; href?: string }> = []
      
      // Process text runs within the paragraph
      for (const pe of el.paragraph.elements) {
        if (pe.textRun?.content) {
          let textContent = pe.textRun.content
          const textStyle = pe.textRun.textStyle
          
          // Clean up text content similar to paragraph processing but preserve spacing for marks
          textContent = textContent
            .replace(/\n/g, ' ')
            .replace(/\u00A0/g, ' ')
          textContent = removeControlChars(textContent)

          // Preserve whitespace-only spans by collapsing to single space
          if (/^\s+$/.test(textContent)) {
            textContent = ' '
          }

          if (!textContent) continue
          
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
          }
          
          // Add style marks
          if (textStyle?.bold) marks.push('strong')
          if (textStyle?.italic) marks.push('em')
          if (textStyle?.underline) marks.push('underline')
          
          children.push({
            _type: 'span',
            text: textContent,
            _key: genKey(),
            marks
          })
        }
      }
      
      // DEBUG: Log children before normalization
      console.log('Table cell children before normalization:', JSON.stringify(children, null, 2))
      
      // Normalize adjacency: ensure a space between spans when neither side has boundary whitespace
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

      // Skip empty paragraphs
      if (normalizedChildren.length === 0) continue
      
      // Handle bullet points
      const bullet = (el.paragraph as { bullet?: { listId?: string; nestingLevel?: number } }).bullet
      let listItem: 'bullet' | 'number' | undefined
      let level: number | undefined
      
      if (bullet && doc && doc.lists) {
        const listId = bullet.listId
        const nestingLevel = typeof bullet.nestingLevel === 'number' ? bullet.nestingLevel : 0
        const glyphType = listId && doc.lists[listId]?.listProperties?.nestingLevels?.[nestingLevel]?.glyphType
        listItem = glyphType && /DECIMAL|ROMAN|ALPHA|NUMBER/i.test(String(glyphType)) ? 'number' : 'bullet'
        level = nestingLevel + 1
      }
      
      // Create block with list information if present
      const block = {
        _type: 'block' as const,
        style: 'normal' as const,
        _key: genKey(),
        markDefs,
        children: normalizedChildren,
        ...(listItem ? { listItem } : {}),
        ...(level ? { level } : {}),
      }
      
      blocks.push(block)
    }
  }
  
  return { blocks }
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

// Check if a table is a pricing table by looking for "Option Name" as the first column header
function isPricingTable(table: GoogleDocsTable): boolean {
  const tableRows = table?.tableRows || []
  if (tableRows.length < 2) return false // Need at least header row + 1 data row
  
  // Check first row for pricing table column headers
  const firstRow = tableRows[0]
  const cells = firstRow?.tableCells || []
  if (cells.length < 3) return false // Need at least Option Name, Description, Price Type
  
  // Extract text from first few cells to check for pricing table structure
  const firstCellText = extractTextFromStructuralElements(cells[0]?.content).trim().toLowerCase()
  const secondCellText = extractTextFromStructuralElements(cells[1]?.content).trim().toLowerCase()
  const thirdCellText = extractTextFromStructuralElements(cells[2]?.content).trim().toLowerCase()
  
  console.log('🔍 Checking table headers for pricing table:', { firstCellText, secondCellText, thirdCellText })
  
  // Detect pricing table by checking for expected column headers
  const hasOptionName = firstCellText.includes('option name') || firstCellText.includes('optionname')
  const hasDescription = secondCellText.includes('description')
  const hasPriceType = thirdCellText.includes('price type') || thirdCellText.includes('pricetype')
  
  const isPricing = hasOptionName && hasDescription && hasPriceType
  console.log('🔍 Is pricing table:', isPricing)
  
  return isPricing
}

// Check if a table is a callout module
function isCalloutModule(table: GoogleDocsTable): boolean {
  const tableRows = table?.tableRows || []
  if (tableRows.length === 0) return false
  
  const firstRow = tableRows[0]
  const firstCell = firstRow?.tableCells?.[0]
  if (!firstCell?.content) return false
  
  const cellText = extractTextFromStructuralElements(firstCell.content).trim()
  console.log('🔍 Checking first cell text for callout module marker:', cellText)
  
  // Look for the callout module marker
  return cellText.includes('{{ callout.module }}') || cellText.includes('{{callout.module}}')
}

// Convert a Google Docs table to a callout module
function convertCalloutModule(table: GoogleDocsTable, doc: GoogleDocsDocument): CalloutNode {
  const tableRows = table?.tableRows || []
  console.log('🔍 Converting callout module with', tableRows.length, 'rows')
  
  if (tableRows.length < 2) {
    console.warn('Callout module has insufficient rows, creating empty callout')
    return {
      _type: 'callout',
      _key: genKey(),
      variant: 'info'
    }
  }
  
  // Second row contains the actual callout content
  const contentRow = tableRows[1]
  const cells = contentRow?.tableCells || []
  
  let title: string | undefined
  let content: PortableTextBlock[] | undefined
  let variant: 'info' | 'warning' | 'success' | 'error' = 'info'
  
  if (cells.length >= 1) {
    // First cell is the title
    const titleCell = cells[0]
    title = extractTextFromStructuralElements(titleCell?.content).trim()
    console.log('🔍 Callout title:', title)
  }
  
  if (cells.length >= 2) {
    // Second cell is the content
    const contentCell = cells[1]
    const portableTextData = extractPortableTextFromStructuralElements(contentCell?.content, doc)
    content = portableTextData.blocks
    console.log('🔍 Callout content blocks:', content?.length || 0)
  }
  
  // Determine variant based on title keywords
  if (title) {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('warning') || lowerTitle.includes('caution') || lowerTitle.includes('alert')) {
      variant = 'warning'
    } else if (lowerTitle.includes('error') || lowerTitle.includes('danger') || lowerTitle.includes('critical')) {
      variant = 'error'
    } else if (lowerTitle.includes('success') || lowerTitle.includes('complete') || lowerTitle.includes('done')) {
      variant = 'success'
    }
  }
  
  const calloutNode: CalloutNode = {
    _type: 'callout',
    _key: genKey(),
    variant
  }
  
  if (title) {
    calloutNode.title = title
  }
  
  if (content && content.length > 0) {
    calloutNode.content = content
  }
  
  console.log('🔍 Final callout module:', JSON.stringify(calloutNode, null, 2))
  
  return calloutNode
}

// Extract option names from a pricing table (used by scope table to get real option names)
function extractPricingOptionNames(table: GoogleDocsTable): string[] {
  const tableRows = table?.tableRows || []
  if (tableRows.length < 2) return []
  
  const headerRow = tableRows[0]
  const headerCells = headerRow?.tableCells || []
  const columnMap: Record<number, string> = {}
  
  for (let i = 0; i < headerCells.length; i++) {
    const headerText = extractTextFromStructuralElements(headerCells[i]?.content).trim().toLowerCase()
    columnMap[i] = headerText
  }
  
  // Find the "Option Name" column index
  const optionNameColIndex = Object.entries(columnMap).find(([_, name]) => 
    name.includes('option name') || name.includes('optionname')
  )?.[0]
  
  if (optionNameColIndex === undefined) return []
  
  const colIdx = parseInt(optionNameColIndex, 10)
  const optionNames: string[] = []
  
  // Extract option names from data rows
  for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex]
    const cells = row?.tableCells || []
    const cell = cells[colIdx]
    if (cell) {
      const name = extractTextFromStructuralElements(cell.content).trim()
      if (name) {
        optionNames.push(name)
      }
    }
  }
  
  console.log('🔍 Extracted pricing option names:', optionNames)
  return optionNames
}

// Check if a table is a scope table by looking for "Scope Item" column header
// Format: Group Name | Scope Item | Description | Tooltip | Option 1 Status | Option 1 Custom Text | ...
function isScopeTable(table: GoogleDocsTable): boolean {
  const tableRows = table?.tableRows || []
  if (tableRows.length < 2) return false // Need at least header row + 1 data row
  
  // Check first row for scope table column headers
  const firstRow = tableRows[0]
  const cells = firstRow?.tableCells || []
  if (cells.length < 4) return false // Need at least Group Name, Scope Item, Description, and one option column
  
  // Extract text from all cells to check for scope table structure
  const cellTexts = cells.map(cell => extractTextFromStructuralElements(cell?.content).trim().toLowerCase())
  
  console.log('🔍 Checking table headers for scope table:', cellTexts)
  
  // Detect scope table by checking for expected column headers
  // Format: Group Name | Scope Item | Description | Tooltip | Option 1 Status | ...
  const hasGroupName = cellTexts[0]?.includes('group') || cellTexts[0]?.includes('category')
  const hasScopeItem = cellTexts[1]?.includes('scope item') || cellTexts[1]?.includes('scopeitem')
  const hasDescription = cellTexts[2]?.includes('description')
  const hasTooltip = cellTexts[3]?.includes('tooltip')
  const hasOptionStatus = cellTexts.some(text => text.includes('option') && text.includes('status'))
  
  const isScope = Boolean(hasGroupName && hasScopeItem && hasDescription && hasTooltip && hasOptionStatus)
  console.log('🔍 Is scope table:', isScope, { hasGroupName, hasScopeItem, hasDescription, hasTooltip, hasOptionStatus })
  
  return isScope
}

// Convert Google Docs scope table to Sanity scope table
// Format: Group Name | Scope Item | Description | Tooltip | Option 1 Status | Option 1 Custom Text | Option 2 Status | ...
// pricingOptionNames: optional array of option names from the pricing table (e.g., ["Good", "Better", "Best"])
function convertScopeTable(table: GoogleDocsTable, doc: GoogleDocsDocument, pricingOptionNames?: string[]): ScopeTableNode {
  const tableRows = table?.tableRows || []
  console.log('🔍 Converting scope table with', tableRows.length, 'rows')
  
  if (tableRows.length < 2) {
    console.warn('Scope table has insufficient rows, creating empty scope table')
    return {
      _type: 'scopeTable',
      _key: genKey(),
      options: [],
      scopeGroups: []
    }
  }
  
  // First row contains column headers - build a map of column index to field name
  const headerRow = tableRows[0]
  const headerCells = headerRow?.tableCells || []
  const columnMap: Record<number, string> = {}
  
  // Count how many options we have from "Option N Status" columns
  let optionCount = 0
  
  for (let i = 0; i < headerCells.length; i++) {
    const headerText = extractTextFromStructuralElements(headerCells[i]?.content).trim()
    const headerTextLower = headerText.toLowerCase()
    columnMap[i] = headerTextLower
    console.log(`🔍 Scope Column ${i}: "${headerText}"`)
    
    // Extract option numbers from "option N status" columns
    const optionMatch = headerTextLower.match(/option\s*(\d+)\s*status/i)
    if (optionMatch && optionMatch[1]) {
      const optionNum = parseInt(optionMatch[1], 10)
      if (optionNum > optionCount) {
        optionCount = optionNum
      }
    }
  }
  
  // Use pricing option names if provided, otherwise fall back to generic names
  const optionNames: string[] = []
  for (let i = 0; i < optionCount; i++) {
    const pricingName = pricingOptionNames?.[i]
    if (pricingName) {
      optionNames.push(pricingName)
    } else {
      optionNames.push(`Option ${i + 1}`)
    }
  }
  
  console.log('🔍 Using option names:', optionNames, '(from pricing table:', !!pricingOptionNames, ')')
  
  // Process data rows (skip header row)
  // Group items by their Group Name column
  const groupsMap: Record<string, ScopeTableItem[]> = {}
  
  for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex]
    const cells = row?.tableCells || []
    
    // Initialize scope item
    const item: ScopeTableItem = {
      _key: genKey(),
      item: '',
      optionAvailability: []
    }
    
    // Track group name for this row
    let groupName = 'General'
    
    // Collect option availability from columns
    const optionAvailability: ScopeTableOptionAvailability[] = []
    
    // Process each cell in the row
    for (let colIndex = 0; colIndex < cells.length; colIndex++) {
      const cell = cells[colIndex]
      const cellText = extractTextFromStructuralElements(cell?.content).trim()
      const columnName = columnMap[colIndex] || ''
      
      console.log(`🔍 Scope Row ${rowIndex}, Col ${colIndex} (${columnName}): "${cellText}"`)
      
      // Map column to item field
      if (columnName.includes('group') || columnName.includes('category')) {
        if (cellText) groupName = cellText
      } else if (columnName.includes('scope item') || columnName.includes('scopeitem')) {
        item.item = cellText
      } else if (columnName === 'description') {
        if (cellText) item.description = cellText
      } else if (columnName === 'tooltip') {
        if (cellText) item.tooltip = cellText
      } else if (columnName.includes('option') && columnName.includes('status')) {
        // Handle "option N status" columns
        const optionMatch = columnName.match(/option\s*(\d+)\s*status/i)
        if (optionMatch && optionMatch[1]) {
          const optionIndex = parseInt(optionMatch[1], 10) - 1 // 0-indexed
          
          // Parse status value
          let included: 'included' | 'limited' | 'not_included' | 'custom' = 'not_included'
          const lowerText = cellText.toLowerCase()
          
          if (lowerText === 'included' || lowerText === 'yes' || lowerText === '✓' || lowerText === 'true') {
            included = 'included'
          } else if (lowerText === 'limited' || lowerText === 'partial') {
            included = 'limited'
          } else if (lowerText === 'not_included' || lowerText === 'no' || lowerText === '✗' || lowerText === 'false' || lowerText === '') {
            included = 'not_included'
          } else if (cellText) {
            // Any other non-empty text is treated as custom
            included = 'custom'
          }
          
          const availability: ScopeTableOptionAvailability = {
            _key: genKey(),
            optionIndex,
            included
          }
          
          // Look for corresponding custom text column
          const customTextColIndex = Object.entries(columnMap).find(([idx, name]) => 
            name.includes(`option`) && name.includes(`${optionIndex + 1}`) && name.includes('custom text')
          )?.[0]
          
          if (customTextColIndex !== undefined) {
            const customTextCell = cells[parseInt(customTextColIndex, 10)]
            const customText = extractTextFromStructuralElements(customTextCell?.content).trim()
            if (customText) {
              availability.customText = customText
              // If there's custom text, mark as custom status
              if (included !== 'included' && included !== 'limited') {
                availability.included = 'custom'
              }
            }
          }
          
          optionAvailability[optionIndex] = availability
        }
      }
    }
    
    // Fill in any missing option availability
    for (let i = 0; i < optionNames.length; i++) {
      if (!optionAvailability[i]) {
        optionAvailability[i] = {
          _key: genKey(),
          optionIndex: i,
          included: 'not_included'
        }
      }
    }
    
    item.optionAvailability = optionAvailability.filter(Boolean)
    
    // Only add item if it has a name
    if (item.item) {
      // Add to the appropriate group
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = []
      }
      groupsMap[groupName]!.push(item)
      console.log('🔍 Added scope item to group', groupName, ':', JSON.stringify(item, null, 2))
    }
  }
  
  // Convert groupsMap to scopeGroups array
  const scopeGroups: ScopeTableGroup[] = Object.entries(groupsMap).map(([name, items]) => ({
    _key: genKey(),
    groupName: name,
    items
  }))
  
  console.log('🔍 Final scope table:', JSON.stringify({ options: optionNames, scopeGroups }, null, 2))
  
  return {
    _type: 'scopeTable',
    _key: genKey(),
    options: optionNames,
    scopeGroups
  }
}

// Check if a table is a Gantt chart by looking for "Task Name", "Start Date", "End Date" columns
function isGanttChart(table: GoogleDocsTable): boolean {
  const tableRows = table?.tableRows || []
  if (tableRows.length < 2) return false // Need at least header row + 1 data row
  
  // Check first row for Gantt chart column headers
  const firstRow = tableRows[0]
  const cells = firstRow?.tableCells || []
  if (cells.length < 3) return false // Need at least Task Name, Start Date, End Date
  
  // Extract text from first few cells to check for Gantt chart structure
  const firstCellText = extractTextFromStructuralElements(cells[0]?.content).trim().toLowerCase()
  const secondCellText = extractTextFromStructuralElements(cells[1]?.content).trim().toLowerCase()
  const thirdCellText = extractTextFromStructuralElements(cells[2]?.content).trim().toLowerCase()
  
  console.log('🔍 Checking table headers for Gantt chart:', { firstCellText, secondCellText, thirdCellText })
  
  // Detect Gantt chart by checking for expected column headers
  const hasTaskName = firstCellText.includes('task name') || firstCellText.includes('taskname') || firstCellText.includes('task')
  const hasStartDate = secondCellText.includes('start date') || secondCellText.includes('startdate') || secondCellText.includes('start')
  const hasEndDate = thirdCellText.includes('end date') || thirdCellText.includes('enddate') || thirdCellText.includes('end')
  
  const isGantt = hasTaskName && hasStartDate && hasEndDate
  console.log('🔍 Is Gantt chart:', isGantt)
  
  return isGantt
}

// Convert Google Docs Gantt chart table to Sanity Gantt chart
function convertGanttChart(table: GoogleDocsTable, doc: GoogleDocsDocument): GanttChartNode {
  const tableRows = table?.tableRows || []
  console.log('🔍 Converting Gantt chart with', tableRows.length, 'rows')
  
  if (tableRows.length < 2) {
    console.warn('Gantt chart has insufficient rows, creating empty Gantt chart')
    return {
      _type: 'ganttChart',
      _key: genKey(),
      tasks: [],
      viewMode: 'Week',
      showWeekends: false,
      showProgress: true
    }
  }
  
  // First row contains column headers - build a map of column index to field name
  const headerRow = tableRows[0]
  const headerCells = headerRow?.tableCells || []
  const columnMap: Record<number, string> = {}
  
  for (let i = 0; i < headerCells.length; i++) {
    const headerText = extractTextFromStructuralElements(headerCells[i]?.content).trim().toLowerCase()
    columnMap[i] = headerText
    console.log(`🔍 Gantt Column ${i}: "${headerText}"`)
  }
  
  // Process data rows (skip header row)
  const tasks: GanttChartTask[] = []
  
  for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex]
    const cells = row?.tableCells || []
    
    // Initialize task
    const task: GanttChartTask = {
      _key: genKey(),
      name: '',
      startDate: '',
      endDate: ''
    }
    
    // Process each cell in the row
    for (let colIndex = 0; colIndex < cells.length; colIndex++) {
      const cell = cells[colIndex]
      const cellText = extractTextFromStructuralElements(cell?.content).trim()
      const columnName = columnMap[colIndex] || ''
      
      if (!cellText) continue
      
      console.log(`🔍 Gantt Row ${rowIndex}, Col ${colIndex} (${columnName}): "${cellText}"`)
      
      // Map column to task field
      if (columnName.includes('task name') || columnName.includes('taskname') || columnName === 'task') {
        task.name = cellText
      } else if (columnName.includes('start date') || columnName.includes('startdate') || columnName === 'start') {
        // Parse date - expect YYYY-MM-DD format
        task.startDate = cellText
      } else if (columnName.includes('end date') || columnName.includes('enddate') || columnName === 'end') {
        // Parse date - expect YYYY-MM-DD format
        task.endDate = cellText
      } else if (columnName.includes('progress')) {
        // Parse progress percentage
        const progressMatch = cellText.match(/(\d+)/)
        if (progressMatch && progressMatch[1]) {
          task.progress = parseInt(progressMatch[1], 10)
        }
      } else if (columnName.includes('dependencies') || columnName.includes('depends')) {
        task.dependencies = cellText
      }
    }
    
    // Only add task if it has a name and dates
    if (task.name && task.startDate && task.endDate) {
      tasks.push(task)
      console.log('🔍 Added Gantt task:', JSON.stringify(task, null, 2))
    }
  }
  
  console.log('🔍 Final Gantt chart tasks:', JSON.stringify(tasks, null, 2))
  
  return {
    _type: 'ganttChart',
    _key: genKey(),
    tasks,
    viewMode: 'Week',
    showWeekends: false,
    showProgress: true
  }
}

// Parse pricing information from a text string
function parsePriceFromText(priceText: string): PricingTableOption['price'] {
  const cleanText = priceText.trim()
  console.log('🔍 Parsing price from text:', JSON.stringify(cleanText))
  
  // Default price structure
  const defaultPrice: PricingTableOption['price'] = {
    type: 'custom',
    customText: cleanText,
    currency: 'USD',
    period: 'mo'
  }
  
  // Check for custom text patterns
  if (cleanText.toLowerCase().includes('contact') || 
      cleanText.toLowerCase().includes('custom') ||
      cleanText.toLowerCase().includes('quote')) {
    console.log('🔍 Detected custom pricing text')
    return {
      type: 'custom',
      customText: cleanText,
      currency: 'USD',
      period: 'mo'
    }
  }
  
  // Extract currency symbol
  let currency: 'USD' | 'EUR' | 'GBP' = 'USD'
  if (cleanText.includes('€')) currency = 'EUR'
  else if (cleanText.includes('£')) currency = 'GBP'
  else if (cleanText.includes('$')) currency = 'USD'
  
  // Extract period
  let period: 'mo' | 'yr' | 'once' | 'custom' = 'mo'
  if (cleanText.includes('/yr') || cleanText.includes('year') || cleanText.includes('annually')) period = 'yr'
  else if (cleanText.toLowerCase().includes('once') || cleanText.toLowerCase().includes('one-time') || cleanText.toLowerCase().includes('one time')) period = 'once'
  
  console.log('🔍 Detected currency:', currency, 'period:', period)
  
  // Enhanced number extraction - handle various formats
  const numberMatches = cleanText.match(/\$?[\d,]+(?:\.\d+)?/g)
  console.log('🔍 Number matches found:', numberMatches)
  
  if (!numberMatches) {
    console.log('🔍 No numbers found, returning default price')
    return defaultPrice
  }
  
  const numbers = numberMatches.map(n => parseFloat(n.replace(/[$,]/g, '')))
  console.log('🔍 Parsed numbers:', numbers)
  
  // Check for range (e.g., "$50-$200/mo", "$160,000 - $200,000")
  // Be more aggressive about detecting ranges - look for multiple numbers AND range indicators
  const hasRangeIndicator = cleanText.includes('-') || cleanText.includes('to') || cleanText.includes('–') || cleanText.includes(' - ')
  if (numbers.length >= 2 && hasRangeIndicator) {
    const result = {
      type: 'range' as const,
      amount: Math.min(...numbers),
      maxAmount: Math.max(...numbers),
      currency,
      period
    }
    console.log('🔍 Detected price range:', result)
    return result
  }
  
  // Also check if we have multiple numbers even without explicit range indicators
  if (numbers.length >= 2) {
    console.log('🔍 Multiple numbers found, treating as range:', numbers)
    const result = {
      type: 'range' as const,
      amount: Math.min(...numbers),
      maxAmount: Math.max(...numbers),
      currency,
      period
    }
    console.log('🔍 Detected implicit price range:', result)
    return result
  }
  
  // Check for "starting from" pattern
  if (cleanText.toLowerCase().includes('starting') || cleanText.toLowerCase().includes('from')) {
    const result = {
      type: 'starting_from' as const,
      amount: numbers[0],
      currency,
      period
    }
    console.log('🔍 Detected starting from price:', result)
    return result
  }
  
  // Single amount
  if (numbers.length >= 1) {
    const result = {
      type: 'single' as const,
      amount: numbers[0],
      currency,
      period
    }
    console.log('🔍 Detected single price:', result)
    return result
  }
  
  console.log('🔍 Fallback to default price')
  return defaultPrice
}

// Parse highlights from bullet-pointed text
function parseHighlights(highlightText: string): PricingTableOption['highlights'] {
  console.log('🔍 Parsing highlights from text:', JSON.stringify(highlightText))
  
  // Split by newlines and also handle cases where bullets might be separated by other means
  let lines = highlightText.split('\n').filter(line => line.trim())
  
  // If no newlines, try splitting by bullet characters directly
  if (lines.length === 1 && lines[0] && lines[0].includes('•')) {
    lines = lines[0].split('•').filter(line => line.trim())
  }
  
  const highlights: PricingTableOption['highlights'] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Remove various bullet point formats and clean up
    const cleanText = trimmed
      .replace(/^[•·\-*]\s*/, '') // Standard bullets
      .replace(/^\d+\.\s*/, '') // Numbered lists
      .replace(/^[a-zA-Z]\.\s*/, '') // Lettered lists
      .trim()
    
    if (!cleanText) continue
    
    console.log('🔍 Processing highlight item:', cleanText)
    
    // Determine icon based on content
    let icon: 'check' | 'lightning' | 'rocket' | 'chart' | 'lock' | 'star' = 'check'
    const lowerText = cleanText.toLowerCase()
    
    if (lowerText.includes('fast') || lowerText.includes('speed') || lowerText.includes('quick')) {
      icon = 'lightning'
    } else if (lowerText.includes('launch') || lowerText.includes('deploy') || lowerText.includes('boost')) {
      icon = 'rocket'
    } else if (lowerText.includes('analytics') || lowerText.includes('report') || lowerText.includes('data')) {
      icon = 'chart'
    } else if (lowerText.includes('secure') || lowerText.includes('private') || lowerText.includes('protected')) {
      icon = 'lock'
    } else if (lowerText.includes('premium') || lowerText.includes('best') || lowerText.includes('featured')) {
      icon = 'star'
    }
    
    const highlight = {
      _key: genKey(),
      text: cleanText,
      icon
    }
    
    console.log('🔍 Created highlight:', highlight)
    highlights.push(highlight)
  }
  
  console.log('🔍 Final highlights array:', highlights)
  return highlights
}

// Convert Google Docs pricing table to Sanity pricing table
// New horizontal structure: each row is a pricing option, columns are fields
function convertPricingTable(table: GoogleDocsTable, doc: GoogleDocsDocument): PricingTableNode {
  const tableRows = table?.tableRows || []
  console.log('🔍 Converting pricing table with', tableRows.length, 'rows')
  
  if (tableRows.length < 2) {
    console.warn('Pricing table has insufficient rows, creating empty pricing table')
    return {
      _type: 'pricingTable',
      _key: genKey(),
      options: []
    }
  }
  
  // First row contains column headers - build a map of column index to field name
  const headerRow = tableRows[0]
  const headerCells = headerRow?.tableCells || []
  const columnMap: Record<number, string> = {}
  
  for (let i = 0; i < headerCells.length; i++) {
    const headerText = extractTextFromStructuralElements(headerCells[i]?.content).trim().toLowerCase()
    columnMap[i] = headerText
    console.log(`🔍 Column ${i}: "${headerText}"`)
  }
  
  // Process data rows (skip header row)
  const options: PricingTableOption[] = []
  
  for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex]
    const cells = row?.tableCells || []
    
    // Initialize option with defaults
    const option: PricingTableOption = {
      _key: genKey(),
      name: '',
      price: {
        type: 'single',
        currency: 'USD',
        period: 'mo'
      }
    }
    
    // Collect highlights from multiple columns
    const highlights: Array<{ _key: string; text: string; icon: 'check' | 'lightning' | 'rocket' | 'chart' | 'lock' | 'star' }> = []
    
    // Process each cell in the row
    for (let colIndex = 0; colIndex < cells.length; colIndex++) {
      const cell = cells[colIndex]
      const cellText = extractTextFromStructuralElements(cell?.content).trim()
      const columnName = columnMap[colIndex] || ''
      
      if (!cellText) continue
      
      console.log(`🔍 Row ${rowIndex}, Col ${colIndex} (${columnName}): "${cellText}"`)
      
      // Map column to option field
      if (columnName.includes('option name') || columnName.includes('optionname')) {
        option.name = cellText
      } else if (columnName === 'description') {
        option.description = cellText
      } else if (columnName.includes('price type') || columnName.includes('pricetype')) {
        const lowerText = cellText.toLowerCase()
        if (lowerText === 'range' || lowerText.includes('range')) {
          option.price.type = 'range'
        } else if (lowerText === 'starting_from' || lowerText.includes('starting')) {
          option.price.type = 'starting_from'
        } else if (lowerText === 'custom' || lowerText.includes('custom')) {
          option.price.type = 'custom'
        } else {
          option.price.type = 'single'
        }
      } else if (columnName.includes('price amount') || columnName.includes('priceamount')) {
        const amount = parseFloat(cellText.replace(/[$,]/g, ''))
        if (!isNaN(amount)) {
          option.price.amount = amount
        }
      } else if (columnName.includes('max price') || columnName.includes('maxprice')) {
        const maxAmount = parseFloat(cellText.replace(/[$,]/g, ''))
        if (!isNaN(maxAmount)) {
          option.price.maxAmount = maxAmount
        }
      } else if (columnName.includes('custom price text') || columnName.includes('custompricetext')) {
        option.price.customText = cellText
      } else if (columnName === 'currency') {
        const upperText = cellText.toUpperCase()
        if (upperText === 'EUR' || upperText === '€') {
          option.price.currency = 'EUR'
        } else if (upperText === 'GBP' || upperText === '£') {
          option.price.currency = 'GBP'
        } else {
          option.price.currency = 'USD'
        }
      } else if (columnName.includes('billing period') || columnName.includes('billingperiod')) {
        const lowerText = cellText.toLowerCase()
        if (lowerText === 'yr' || lowerText.includes('year') || lowerText.includes('annual')) {
          option.price.period = 'yr'
        } else if (lowerText === 'once' || lowerText.includes('one-time') || lowerText.includes('onetime')) {
          option.price.period = 'once'
        } else if (lowerText === 'custom') {
          option.price.period = 'custom'
        } else {
          option.price.period = 'mo'
        }
      } else if (columnName.includes('custom period') || columnName.includes('customperiod')) {
        if (cellText) {
          option.price.period = 'custom'
          option.price.customPeriod = cellText
        }
      } else if (columnName.includes('badge')) {
        if (cellText && cellText.toLowerCase() !== 'none' && cellText !== '-') {
          option.badge = { text: cellText }
        }
      } else if (columnName.includes('highlight') && columnName.includes('text')) {
        // Extract highlight number from column name (e.g., "highlight 1 text" -> 1)
        const highlightMatch = columnName.match(/highlight\s*(\d+)\s*text/i)
        const highlightIndex = highlightMatch && highlightMatch[1] ? parseInt(highlightMatch[1], 10) - 1 : highlights.length
        
        // Determine icon based on content or look for corresponding icon column
        let icon: 'check' | 'lightning' | 'rocket' | 'chart' | 'lock' | 'star' = 'check'
        
        // Look for corresponding icon column
        const iconColIndex = Object.entries(columnMap).find(([idx, name]) => 
          name.includes(`highlight`) && name.includes(`${highlightIndex + 1}`) && name.includes('icon')
        )?.[0]
        
        if (iconColIndex !== undefined) {
          const iconCell = cells[parseInt(iconColIndex, 10)]
          const iconText = extractTextFromStructuralElements(iconCell?.content).trim().toLowerCase()
          if (iconText === 'lightning') icon = 'lightning'
          else if (iconText === 'rocket') icon = 'rocket'
          else if (iconText === 'chart') icon = 'chart'
          else if (iconText === 'lock') icon = 'lock'
          else if (iconText === 'star') icon = 'star'
          else icon = 'check'
        } else {
          // Auto-assign icon based on content
          const lowerText = cellText.toLowerCase()
          if (lowerText.includes('fast') || lowerText.includes('speed') || lowerText.includes('quick')) {
            icon = 'lightning'
          } else if (lowerText.includes('launch') || lowerText.includes('deploy') || lowerText.includes('boost')) {
            icon = 'rocket'
          } else if (lowerText.includes('analytics') || lowerText.includes('report') || lowerText.includes('data')) {
            icon = 'chart'
          } else if (lowerText.includes('secure') || lowerText.includes('private') || lowerText.includes('protected')) {
            icon = 'lock'
          } else if (lowerText.includes('premium') || lowerText.includes('best') || lowerText.includes('featured')) {
            icon = 'star'
          }
        }
        
        highlights[highlightIndex] = {
          _key: genKey(),
          text: cellText,
          icon
        }
      } else if (columnName.includes('highlight') && columnName.includes('icon')) {
        // Icon columns are processed together with text columns above
        // Skip standalone processing
      }
    }
    
    // Add collected highlights to option (filter out empty slots)
    const validHighlights = highlights.filter(h => h && h.text)
    if (validHighlights.length > 0) {
      option.highlights = validHighlights
    }
    
    // Only add option if it has a name
    if (option.name) {
      options.push(option)
      console.log('🔍 Added pricing option:', JSON.stringify(option, null, 2))
    }
  }
  
  console.log('🔍 Final pricing table options:', JSON.stringify(options, null, 2))
  
  return {
    _type: 'pricingTable',
    _key: genKey(),
    options
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
    
    // First pass: find pricing tables and extract option names
    let pricingOptionNames: string[] = []
    for (const tab of flatTabs) {
      const body = tab.documentTab?.body
      if (!body?.content) continue
      
      for (const element of body.content) {
        if (element.table && isPricingTable(element.table)) {
          const names = extractPricingOptionNames(element.table)
          if (names.length > 0) {
            pricingOptionNames = names
            console.log('🔍 Found pricing option names from pricing table:', pricingOptionNames)
            break
          }
        }
      }
      if (pricingOptionNames.length > 0) break
    }
    
    const sanityTabs: Array<{ title: string; content: PTContent[] }> = []
    for (const tab of flatTabs) {
      console.log('🔍 Processing tab:', tab.tabProperties?.title)
      console.log('🔍 Tab content types:', tab.documentTab?.body?.content?.map(el => Object.keys(el).filter(k => k !== 'startIndex' && k !== 'endIndex')))
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

              textContent = removeControlChars(textContent)

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
          console.log('🔍 TABLE FOUND - processing table with', element.table.tableRows?.length || 0, 'rows')
          const table = element.table
          const tableRows = table?.tableRows || []
          if (tableRows.length > 0) {
            // Check if this is a pricing table
            if (isPricingTable(table)) {
              console.log('🔍 PRICING TABLE DETECTED - converting to pricingTable module')
              const pricingTableNode = convertPricingTable(table, doc)
              blocks.push(pricingTableNode)
            } else if (isScopeTable(table)) {
              console.log('🔍 SCOPE TABLE DETECTED - converting to scopeTable module')
              const scopeTableNode = convertScopeTable(table, doc, pricingOptionNames)
              blocks.push(scopeTableNode)
            } else if (isGanttChart(table)) {
              console.log('🔍 GANTT CHART DETECTED - converting to ganttChart module')
              const ganttChartNode = convertGanttChart(table, doc)
              blocks.push(ganttChartNode)
            } else if (isCalloutModule(table)) {
              console.log('🔍 CALLOUT MODULE DETECTED - converting to callout module')
              const calloutNode = convertCalloutModule(table, doc)
              blocks.push(calloutNode)
            } else {
              // Regular table processing
              const headerCells = tableRows[0]?.tableCells || []
              const headers: SanityTableHeader[] = headerCells.map((cell) => ({
                _key: genKey(),
                text: extractTextFromStructuralElements(cell.content),
                alignment: mapAlignment(firstParagraphAlignment(cell.content))
              }))
              const rows: SanityTableRow[] = tableRows.slice(1).map((row) => ({
                _key: genKey(),
                cells: (row.tableCells || []).map((cell) => {
                  console.log('🔍 Processing table cell - calling extractPortableTextFromStructuralElements')
                  const portableTextData = extractPortableTextFromStructuralElements(cell.content, doc)
                  if (portableTextData.blocks.length > 0) {
                    return {
                      _key: genKey(),
                      content: portableTextData.blocks
                    }
                  } else {
                    return { 
                      _key: genKey(),
                      content: [] 
                    }
                  }
                }),
              }))
              const tableNode: SanityTableNode = {
                _type: 'table',
                _key: genKey(),
                caption: undefined,
                headers,
                rows,
              }
              blocks.push(tableNode)
            }
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
  
  // First pass: find pricing tables and extract option names
  let fallbackPricingOptionNames: string[] = []
  for (const element of doc.body.content) {
    if (element.table && isPricingTable(element.table)) {
      const names = extractPricingOptionNames(element.table)
      if (names.length > 0) {
        fallbackPricingOptionNames = names
        console.log('🔍 FALLBACK: Found pricing option names from pricing table:', fallbackPricingOptionNames)
        break
      }
    }
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

          textContent = removeControlChars(textContent)

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
          console.log('🔍 FALLBACK: TABLE FOUND - processing table with', element.table.tableRows?.length || 0, 'rows')
          const table = element.table
      const tableRows = table?.tableRows || []
      if (tableRows.length > 0) {
        // Check if this is a pricing table
        if (isPricingTable(table)) {
          console.log('🔍 FALLBACK: PRICING TABLE DETECTED - converting to pricingTable module')
          const pricingTableNode = convertPricingTable(table, doc)
          blocks.push(pricingTableNode)
        } else if (isScopeTable(table)) {
          console.log('🔍 FALLBACK: SCOPE TABLE DETECTED - converting to scopeTable module')
          const scopeTableNode = convertScopeTable(table, doc, fallbackPricingOptionNames)
          blocks.push(scopeTableNode)
        } else if (isGanttChart(table)) {
          console.log('🔍 FALLBACK: GANTT CHART DETECTED - converting to ganttChart module')
          const ganttChartNode = convertGanttChart(table, doc)
          blocks.push(ganttChartNode)
        } else if (isCalloutModule(table)) {
          console.log('🔍 FALLBACK: CALLOUT MODULE DETECTED - converting to callout module')
          const calloutNode = convertCalloutModule(table, doc)
          blocks.push(calloutNode)
        } else {
          // Regular table processing
          const headerCells = tableRows[0]?.tableCells || []
          const headers: SanityTableHeader[] = headerCells.map((cell) => ({
            _key: genKey(),
            text: extractTextFromStructuralElements(cell.content),
            alignment: mapAlignment(firstParagraphAlignment(cell.content))
          }))
          const rows: SanityTableRow[] = tableRows.slice(1).map((row) => ({
            _key: genKey(),
            cells: (row.tableCells || []).map((cell) => {
              console.log('🔍 Fallback: Processing table cell - calling extractPortableTextFromStructuralElements')
              const portableTextData = extractPortableTextFromStructuralElements(cell.content, doc)
              if (portableTextData.blocks.length > 0) {
                return {
                  _key: genKey(),
                  content: portableTextData.blocks
                }
              } else {
                return { 
                  _key: genKey(),
                  content: [] 
                }
              }
            }),
          }))
          const tableNode: SanityTableNode = {
            _type: 'table',
            _key: genKey(),
            caption: undefined,
            headers,
            rows,
          }
          blocks.push(tableNode)
        }
      }
    }
  })
  
  return { 
    title: doc.title || doc.documentId || 'Google Document', 
    tabs: [{ title: 'Content', content: blocks }] 
  }
}

// Parse a plain text line and return Portable Text spans + markDefs with link annotations
function parsePlainTextLineToPT(
  line: string
): {
  children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }>
  markDefs: Array<{ _key: string; _type: 'link'; href: string }>
} {
  const children: Array<{ _type: 'span'; text: string; _key: string; marks: string[] }> = []
  const markDefs: Array<{ _key: string; _type: 'link'; href: string }> = []

  // Basic URL matcher: http(s)://... or www.... until whitespace or angle/paren terminators
  const urlRegex = /(https?:\/\/|www\.)[^\s<>()]+/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Ensure we operate on the original line (preserve spacing), but normalize control chars
  const source = removeControlChars(line)

  while ((match = urlRegex.exec(source)) !== null) {
    const start = match.index
    const end = urlRegex.lastIndex
    const urlText = source.slice(start, end)

    // Pre-match text
    const pre = source.slice(lastIndex, start)
    if (pre) {
      children.push({ _type: 'span', text: pre, _key: genKey(), marks: [] })
    }

    // Normalize href (prefix scheme for www.)
    const href = urlText.startsWith('www.') ? `https://${urlText}` : urlText
    const markKey = genKey()
    markDefs.push({ _key: markKey, _type: 'link', href })
    children.push({ _type: 'span', text: urlText, _key: genKey(), marks: [markKey] })

    lastIndex = end
  }

  // Trailing text after last match
  const tail = source.slice(lastIndex)
  if (tail) {
    children.push({ _type: 'span', text: tail, _key: genKey(), marks: [] })
  }

  if (children.length === 0) {
    children.push({ _type: 'span', text: source, _key: genKey(), marks: [] })
  }

  return { children, markDefs }
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
      
      const { children, markDefs } = parsePlainTextLineToPT(line)
      currentTab.content.push({
        _type: 'block',
        style: 'normal',
        _key: genKey(),
        markDefs,
        children,
      })
    }
  }
  
  // Add the last tab
  if (currentTab && currentTab.content.length > 0) {
    tabs.push(currentTab)
  }
  
  // If no tabs were created, create one with all content
  if (tabs.length === 0) {
    const blocks: PTContent[] = lines.map(line => {
      const { children, markDefs } = parsePlainTextLineToPT(line)
      return {
        _type: 'block',
        style: 'normal',
        _key: genKey(),
        markDefs,
        children,
      }
    })
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
