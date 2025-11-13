import * as documents from './documents'
import * as fields from './fields'
import * as modules from './modules'
import * as sections from './sections'
import * as objects from './objects'

// Export all schemas as an array
export const schemaTypes = [
  // Document schemas
  documents.proposal,
  documents.company,
  
  // Field schemas (reusable components)
  fields.seo,
  
  // Section schemas (page sections)
  // sections.exampleSection,
  
  // Module schemas (reusable content blocks)
  // modules.exampleModule,
  
  // Object schemas (reusable objects)
  // objects.exampleObject,
]
