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
  documents.person,
  documents.testimonial,
  documents.video,
  
  // Field schemas (reusable components)
  fields.seo,
  fields.canvas,
  
  // Section schemas (page sections)
  // sections.exampleSection,
  
  // Module schemas (reusable content blocks)
  modules.table,
  modules.gallery,
  modules.accordion,
  modules.pricingTable,
  modules.scopeTable,
  modules.testimonialCard,
  modules.callout,
  modules.videoModule,
  
  // Object schemas (reusable objects)
  // objects.exampleObject,
]
