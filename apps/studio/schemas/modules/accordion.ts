export const accordion = {
  name: 'accordion',
  title: 'Accordion',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Accordion Title',
      type: 'string',
      description: 'Optional title for the accordion section',
    },
    {
      name: 'items',
      title: 'Accordion Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule: import('sanity').Rule) => Rule.required(),
              description: 'The accordion question',
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'array',
              of: [{ type: 'block' }],
              validation: (Rule: import('sanity').Rule) => Rule.required(),
              description: 'The accordion answer (supports rich text formatting)',
            },
          ],
          preview: {
            select: {
              question: 'question',
              answer: 'answer',
            },
            prepare(selection: { question: string; answer: Array<{ _type: string; children?: Array<{ text: string }> }> }) {
              const { question, answer } = selection
              const answerPreview = answer && answer.length > 0 
                ? answer[0]?.children?.[0]?.text || 'No answer text'
                : 'No answer'
              
              return {
                title: question || 'No question',
                subtitle: answerPreview.substring(0, 100) + (answerPreview.length > 100 ? '...' : ''),
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare(selection: { title?: string; items?: { question: string }[] }) {
      const { title, items } = selection
      const itemCount = items?.length || 0
      
      return {
        title: title || 'Accordion Section',
        subtitle: `${itemCount} accordion item${itemCount === 1 ? '' : 's'}`,
      }
    },
  },
}
