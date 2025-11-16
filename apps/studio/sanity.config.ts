import { defineConfig, isDev } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { SyncWithGoogleDocAction } from './actions/syncWithGoogleDoc'
import type { DocumentActionComponent } from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Proposals App Studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || '',

  document: {
    actions: (prev: DocumentActionComponent[], { schemaType }: { schemaType: string }) => {
      if (schemaType === 'proposal') {
        return [...prev, SyncWithGoogleDocAction]
      }
      return prev
    },
  },

  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Proposals')
              .schemaType('proposal')
              .child(S.documentTypeList('proposal').title('Proposals')),
            S.listItem()
              .title('Companies')
              .schemaType('company')
              .child(S.documentTypeList('company').title('Companies')),
            S.listItem()
              .title('Testimonials')
              .schemaType('testimonial')
              .child(S.documentTypeList('testimonial').title('Testimonials')),
          ]),
    }),
    visionTool(),
  ],

  schema: { 
    types: schemaTypes,
  },
})
