export const table = {
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Table Title',
      type: 'string',
      description: 'Optional title for the table',
    },
    {
      name: 'caption',
      title: 'Table Caption',
      type: 'text',
      description: 'Optional caption or description for the table',
    },
    {
      name: 'headers',
      title: 'Table Headers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Header Text',
              type: 'string',
            },
            {
              name: 'align',
              title: 'Text Alignment',
              type: 'string',
              options: {
                list: [
                  { title: 'Left', value: 'left' },
                  { title: 'Center', value: 'center' },
                  { title: 'Right', value: 'right' },
                ],
              },
              initialValue: 'left',
            },
          ],
          preview: {
            select: {
              title: 'text',
              subtitle: 'align',
            },
          },
        },
      ],
    },
    {
      name: 'rows',
      title: 'Table Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'tableRow',
          title: 'Table Row',
          fields: [
            {
              name: 'cells',
              title: 'Row Cells',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'content',
                      title: 'Cell Content',
                      type: 'text',
                      rows: 3,
                    },
                    {
                      name: 'align',
                      title: 'Cell Alignment',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Left', value: 'left' },
                          { title: 'Center', value: 'center' },
                          { title: 'Right', value: 'right' },
                        ],
                      },
                      initialValue: 'left',
                    },
                    {
                      name: 'isHeader',
                      title: 'Is Header Cell',
                      type: 'boolean',
                      description: 'Mark this cell as a header (th instead of td)',
                      initialValue: false,
                    },
                  ],
                  preview: {
                    select: {
                      content: 'content',
                      align: 'align',
                      isHeader: 'isHeader',
                    },
                    prepare(selection: any) {
                      const { content, align, isHeader } = selection
                      const text = content || 'Empty cell'
                      return {
                        title: text,
                        subtitle: `${align}${isHeader ? ' (header)' : ''}`,
                      }
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              cells: 'cells',
            },
            prepare(selection: any) {
              const { cells } = selection
              const cellCount = cells?.length || 0
              const firstCellText = cells?.[0]?.content || 'Empty'
              return {
                title: `Row with ${cellCount} cells`,
                subtitle: `First cell: ${firstCellText}`,
              }
            },
          },
        },
      ],
    },
    {
      name: 'styling',
      title: 'Table Styling',
      type: 'object',
      fields: [
        {
          name: 'bordered',
          title: 'Show Borders',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'striped',
          title: 'Striped Rows',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'compact',
          title: 'Compact Layout',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'responsive',
          title: 'Responsive (Horizontal Scroll)',
          type: 'boolean',
          initialValue: true,
        },
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
  ],
  preview: {
    select: {
      title: 'title',
      headers: 'headers',
      rows: 'rows',
    },
    prepare(selection: any) {
      const { title, headers, rows } = selection
      const headerCount = headers?.length || 0
      const rowCount = rows?.length || 0
      const displayTitle = title || 'Table'
      
      return {
        title: displayTitle,
        subtitle: `${headerCount} columns × ${rowCount} rows`,
      }
    },
  },
}
